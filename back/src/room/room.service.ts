import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoomRepository } from './repositories/room.repository';
import { CreateRoomDto } from './dto/create-room.dto';
import { ChatGateway } from 'src/chat/chat.gateway';
import { RoomFilterEnum } from './enums/room-filter.enum';
import {
  Room,
  RoomWithDetails,
  RoomStats,
  UserRoomCreateInput,
  RoomListResponse,
  JoinRoomResponse,
  RoomUsersResponse,
} from '../core/types/room.types';
import { PrismaService } from '../prisma/prisma.service';
import { UserRepository } from '../auth/repositories/user.repository';

@Injectable()
export class RoomService {
  constructor(
    private readonly roomRepository: RoomRepository,
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
    private readonly userRepository: UserRepository,
  ) {}

  async create(dto: CreateRoomDto, userId: string): Promise<Room> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new BadRequestException('Usuário não encontrado');
    }

    const room = await this.roomRepository.createRoom({
      name: dto.name,
    });

    await this.prisma.userRoom.create({
      data: {
        userId: userId,
        roomId: room.id,
      },
    });

    await this.prisma.userRoomRead.create({
      data: {
        userId,
        roomId: room.id,
        lastRead: new Date(),
      },
    });

    this.chatGateway.emitNewRoom({ id: room.id, name: room.name }, userId);

    return room;
  }

  async markAsRead(userId: string, roomId: string): Promise<void> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundException('Sala não encontrada');
    }

    const userExists = await this.userRepository.findById(userId);
    if (!userExists) {
      throw new BadRequestException('Usuário não encontrado');
    }

    await this.prisma.userRoomRead.upsert({
      where: {
        userId_roomId: { userId, roomId },
      },
      update: {
        lastRead: new Date(),
      },
      create: {
        userId,
        roomId,
        lastRead: new Date(),
      },
    });
  }

  async findAll(
    userId: string,
    search?: string,
    roomFilter: RoomFilterEnum = RoomFilterEnum.ONLY_JOINED,
    cursor?: string,
    limit: number = 20,
  ): Promise<RoomListResponse> {
    const rooms = await this.prisma.room.findMany({
      where: {
        name: search
          ? {
              contains: search,
              mode: 'insensitive',
            }
          : undefined,
        ...(roomFilter === RoomFilterEnum.ONLY_JOINED && {
          users: {
            some: {
              userId,
            },
          },
        }),
        ...(roomFilter === RoomFilterEnum.ONLY_NOT_JOINED && {
          users: {
            none: {
              userId: userId,
            },
          },
        }),
        ...(cursor && {
          id: {
            lt: cursor,
          },
        }),
      },
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          where: { userId },
          select: { userId: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    });

    const hasMore = rooms.length > limit;
    const roomsToReturn = hasMore ? rooms.slice(0, limit) : rooms;

    const reads = await this.prisma.userRoomRead.findMany({
      where: { userId },
    });

    const readMap = new Map(reads.map(r => [`${r.roomId}`, r.lastRead]));

    const response = await Promise.all(
      roomsToReturn.map(async room => {
        const joined = room.users.length > 0;
        const lastRead = readMap.get(room.id);

        let unreadCount = 0;

        if (lastRead) {
          unreadCount = await this.prisma.message.count({
            where: {
              roomId: room.id,
              createdAt: { gt: lastRead },
            },
          });
        }

        return {
          id: room.id,
          name: room.name,
          joined,
          unreadCount: joined ? unreadCount : 0,
        };
      }),
    );

    return {
      rooms: response,
      hasMore,
      nextCursor: hasMore ? roomsToReturn[roomsToReturn.length - 1].id : null,
    };
  }

  async findOne(id: string): Promise<Room | null> {
    return await this.roomRepository.findById(id);
  }

  async findWithDetails(id: string): Promise<RoomWithDetails | null> {
    return await this.roomRepository.findRoomWithDetails(id);
  }

  async getAllWithDetails(): Promise<Room[]> {
    return await this.roomRepository.findManyRooms();
  }

  async joinRoom(userId: string, roomId: string): Promise<JoinRoomResponse> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundException('Sala não encontrada');
    }

    const userExists = await this.userRepository.findById(userId);
    if (!userExists) {
      throw new BadRequestException('Usuário não encontrado');
    }

    const isAlreadyInRoom = await this.roomRepository.isUserInRoom(
      roomId,
      userId,
    );

    if (!isAlreadyInRoom) {
      const userRoomData: UserRoomCreateInput = {
        userId,
        roomId,
      };
      await this.roomRepository.addUserToRoom(userRoomData);
    }

    await this.prisma.userRoomRead.upsert({
      where: {
        userId_roomId: { userId, roomId },
      },
      update: {
        lastRead: new Date(),
      },
      create: {
        userId,
        roomId,
        lastRead: new Date(),
      },
    });

    return { joined: true };
  }

  async leaveRoom(userId: string, roomId: string): Promise<void> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundException('Sala não encontrada');
    }

    const userExists = await this.userRepository.findById(userId);
    if (!userExists) {
      throw new BadRequestException('Usuário não encontrado');
    }

    await this.roomRepository.removeUserFromRoom(roomId, userId);
  }

  async getUsersInRoom(roomId: string): Promise<RoomUsersResponse[]> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundException('Sala não encontrada');
    }

    const users = await this.roomRepository.getRoomUsers(roomId);

    return users.map(user => ({
      userId: user.id,
      username: user.username,
    }));
  }

  async getUserRooms(userId: string): Promise<Room[]> {
    return await this.roomRepository.getUserRooms(userId);
  }

  async getRoomStats(): Promise<RoomStats> {
    return await this.roomRepository.getRoomStats();
  }

  async searchRooms(name?: string, hasUsers?: boolean): Promise<Room[]> {
    const filters = { name, hasUsers };
    return await this.roomRepository.searchRooms(filters);
  }
}
