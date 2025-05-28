import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  SubscribeMessage,
  MessageBody,
} from "@nestjs/websockets";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { QueueService } from "../queue/queue.service";
import { JwtService } from "@nestjs/jwt";
import { JwtSocketMiddleware } from "src/auth/jwt/jwt-socket.middleware";
import { RedisService } from "../core/redis/redis.service";
import { OnlineUser, RoomsWithUsers } from "../core/types/redis.types";
import {
  MessageData,
  TypingData,
  RoomData,
  UserLeftRoomData,
  RoomNotificationData,
  OnlineCountData,
  MessageDeletedData,
  NewRoomData,
} from "../core/types/socket.types";
import { TypedServer, TypedSocket } from "../types/socket.io";
import { MessageWithRelations } from "../core/types/message.types";
import { appConfig } from "../core/config/app.config";
import {
  CLIENT_EVENTS,
  SERVER_EVENTS,
} from "../core/constants/socket-events.constants";

export const SocketServer = "SOCKET_IO_SERVER";

interface Room {
  id: string;
  name: string;
}

@WebSocketGateway({
  cors: {
    origin: appConfig.corsOrigin,
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
  maxHttpBufferSize: 1e6,
  allowEIO3: true,
  transports: ["websocket"],
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: TypedServer;

  constructor(
    private queueService: QueueService,
    private jwtService: JwtService,
    private redisService: RedisService
  ) {}

  afterInit(server: Server): void {
    const middleware = new JwtSocketMiddleware(this.jwtService);
    server.use(middleware.use);

    const pubClient = this.redisService.getPubClient();
    const subClient = this.redisService.getSubClient();
    server.adapter(createAdapter(pubClient, subClient));

    console.log("🔗 ChatGateway inicializado com Redis adapter");
  }

  handleConnection(client: TypedSocket): void {
    if (client.data?.user) {
      const { username } = client.data.user;
      console.log(`🔗 Usuário ${username} conectou e está online`);
    }
  }

  @SubscribeMessage(CLIENT_EVENTS.JOIN_ROOM)
  async handleJoin(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: TypedSocket
  ): Promise<void> {
    const { userId, username } = client.data.user;

    if (client.data.currentRoomId === roomId) {
      console.log(
        `⚠️ Usuário ${username} já está na sala ${roomId}, ignorando join duplicado`
      );
      await this.emitOnlineUsers(roomId);
      return;
    }

    if (client.data.currentRoomId && client.data.currentRoomId !== roomId) {
      const previousRoom = client.data.currentRoomId;
      await this.handleLeave({ roomId: previousRoom }, client);
      console.log(
        `🔄 Usuário ${username} mudou da sala ${previousRoom} para ${roomId}`
      );
    }

    await client.join(roomId);
    client.data.currentRoomId = roomId;

    // Remove conexões antigas do mesmo usuário na sala
    await this.redisService.removeUserPreviousConnections(
      roomId,
      userId,
      client.id
    );

    const userAlreadyInRedis = await this.redisService.isUserInRoom(
      roomId,
      userId,
      client.id
    );

    if (!userAlreadyInRedis) {
      const onlineUser: OnlineUser = {
        userId,
        username,
        socketId: client.id,
        joinedAt: new Date(),
      };

      await this.redisService.addUserToRoom(roomId, onlineUser);
      console.log(
        `✅ Usuário ${username} entrou na sala ${roomId} (adicionado no Redis)`
      );
    } else {
      console.log(
        `ℹ️ Usuário ${username} já estava no Redis para sala ${roomId}, apenas sincronizando socket`
      );
    }

    await this.emitOnlineCount(roomId);
    void this.emitOnlineUsers(roomId);
  }

  async emitOnlineUsers(roomId: string): Promise<void> {
    try {
      const users = await this.redisService.getRoomUsers(roomId);
      this.server.to(roomId).emit(SERVER_EVENTS.ONLINE_USERS, users);
    } catch (error) {
      console.error("❌ Erro ao emitir usuários online:", error);
    }
  }

  @SubscribeMessage(CLIENT_EVENTS.SEND_MESSAGE)
  async handleSendMessage(
    @MessageBody() data: MessageData,
    @ConnectedSocket() client: TypedSocket
  ): Promise<void> {
    const { userId } = client.data.user;

    await this.queueService.enqueueMessage({
      ...data,
      userId,
    });
  }

  @SubscribeMessage(CLIENT_EVENTS.USER_TYPING)
  handleUserTyping(@MessageBody() data: TypingData): void {
    const { roomId, userId } = data;

    this.server.to(roomId).emit(SERVER_EVENTS.USER_IS_TYPING, {
      userId,
    });
  }

  @SubscribeMessage(CLIENT_EVENTS.LEAVE_ROOM)
  async handleLeave(
    @MessageBody() data: RoomData,
    @ConnectedSocket() client: TypedSocket
  ): Promise<void> {
    const { roomId } = data;
    const { userId, username } = client.data.user;

    await client.leave(roomId);

    if (client.data.currentRoomId === roomId) {
      client.data.currentRoomId = undefined;
    }

    await this.redisService.removeUserFromRoom(roomId, userId, client.id);

    const userLeftData: UserLeftRoomData = {
      username,
      roomId,
    };

    this.server.to(roomId).emit(SERVER_EVENTS.USER_LEFT_ROOM, userLeftData);

    await this.emitOnlineCount(roomId);
    void this.emitOnlineUsers(roomId);

    console.log(`📤 Usuário ${username} saiu da sala ${roomId}`);
  }

  async handleDisconnect(client: TypedSocket): Promise<void> {
    if (!client.data?.user) {
      console.warn("❌ Desconexão de socket anônimo.");
      return;
    }

    const { userId, username } = client.data.user;
    const currentRoomId = client.data.currentRoomId;

    console.log(
      `🔌 Iniciando desconexão do usuário ${username} (socket: ${client.id})`
    );

    if (currentRoomId) {
      await this.redisService.removeUserFromRoom(
        currentRoomId,
        userId,
        client.id
      );

      const userLeftData: UserLeftRoomData = {
        username,
        roomId: currentRoomId,
      };

      this.server
        .to(currentRoomId)
        .emit(SERVER_EVENTS.USER_LEFT_ROOM, userLeftData);

      await this.emitOnlineCount(currentRoomId);
      void this.emitOnlineUsers(currentRoomId);

      console.log(`📤 Usuário ${username} removido da sala ${currentRoomId}`);
    }

    await this.redisService.removeUserFromAllRooms(userId, client.id);

    for (const roomId of client.rooms) {
      if (roomId !== client.id && roomId !== currentRoomId) {
        const userLeftData: UserLeftRoomData = {
          username,
          roomId,
        };

        this.server.to(roomId).emit(SERVER_EVENTS.USER_LEFT_ROOM, userLeftData);

        await this.emitOnlineCount(roomId);
        void this.emitOnlineUsers(roomId);
      }
    }

    console.log(`🔌 Usuário ${username} desconectou completamente`);
  }

  emitMessageToRoom(roomId: string, message: MessageWithRelations): void {
    this.server.to(roomId).emit(SERVER_EVENTS.NEW_MESSAGE, message);

    const notificationData: RoomNotificationData = {
      roomId,
      preview: message.content,
    };

    this.server.emit(SERVER_EVENTS.ROOM_NOTIFICATION, notificationData);
  }

  emitNewRoom(room: Room, userId: string): void {
    const newRoomData: NewRoomData = {
      id: room.id,
      name: room.name,
      userId,
    };

    this.server.sockets.sockets.forEach((socket) => {
      socket.emit(SERVER_EVENTS.NEW_ROOM, newRoomData);
    });
  }

  emitMessageEdited(
    roomId: string,
    updatedMessage: MessageWithRelations
  ): void {
    this.server.to(roomId).emit(SERVER_EVENTS.MESSAGE_EDITED, updatedMessage);
  }

  emitMessageDeleted(roomId: string, messageId: string): void {
    const deletedData: MessageDeletedData = { id: messageId };
    this.server.to(roomId).emit(SERVER_EVENTS.MESSAGE_DELETED, deletedData);
  }

  async emitOnlineCount(roomId: string): Promise<void> {
    try {
      const count = await this.redisService.getRoomUserCount(roomId);
      const onlineCountData: OnlineCountData = { roomId, count };
      this.server.to(roomId).emit(SERVER_EVENTS.ONLINE_COUNT, onlineCountData);
    } catch (error) {
      console.error("❌ Erro ao emitir contagem online:", error);
    }
  }

  async getOnlineUsersDebug(): Promise<RoomsWithUsers> {
    return await this.redisService.getAllRoomsWithUsers();
  }
}
