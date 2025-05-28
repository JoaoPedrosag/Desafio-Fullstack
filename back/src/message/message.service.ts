import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Message } from "@prisma/client";
import { MessageRepository } from "./repositories/message.repository";
import { CreateMessageDto } from "./dto/create-message.dto";
import { ChatGateway } from "../chat/chat.gateway";
import { StorageService } from "../storage/storage.service";
import {
  MessageWithUser,
  MessageWithRelations,
  MessageStats,
  MessageSearchFilters,
  MessagesResponse,
} from "../core/types/message.types";
import { PrismaService } from "../prisma/prisma.service";
import { RoomService } from "../room/room.service";

@Injectable()
export class MessageService {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
    private readonly storageService: StorageService,
    private readonly roomService: RoomService
  ) {}

  async create(
    dto: CreateMessageDto,
    userId: string
  ): Promise<MessageWithRelations> {
    const message = await this.messageRepository.createMessage({
      content: dto.content,
      userId,
      roomId: dto.roomId,
      ...(dto.storageId && { storageId: dto.storageId }),
    });

    const messageWithRelations = await this.messageRepository.findWithRelations(
      message.id
    );

    if (!messageWithRelations) {
      throw new Error("Failed to fetch created message with relations");
    }

    return messageWithRelations;
  }

  async findMessages(
    roomId: string,
    take: number = 50,
    cursor?: string
  ): Promise<MessagesResponse> {
    if (take > 100) {
      throw new BadRequestException("Limit too high");
    }

    const room = await this.roomService.findOne(roomId);

    if (!room) {
      throw new NotFoundException("Sala não encontrada");
    }

    const messages = await this.messageRepository.findByRoomId(
      roomId,
      take,
      cursor
    );

    const enriched = messages.map((message) => ({
      ...message,
      user: {
        id: message.user.id,
        username: message.user.username,
        email: message.user.email,
      },
      room: {
        id: roomId,
        name: room.name,
      },
    }));

    return {
      messages: enriched.reverse(),
      hasMore: messages.length === take,
      nextCursor: messages.length > 0 ? messages[messages.length - 1].id : null,
    };
  }

  async getUnreadCount(roomId: string, lastRead: Date): Promise<number> {
    return await this.messageRepository.countUnreadMessages(roomId, lastRead);
  }

  async search(filters: MessageSearchFilters): Promise<MessageWithUser[]> {
    return this.messageRepository.searchMessages(filters);
  }

  async edit(id: string, content: string, userId: string): Promise<Message> {
    const message = await this.messageRepository.findById(id);
    if (!message) {
      throw new Error("Message not found");
    }

    if (message.userId !== userId) {
      throw new Error("Unauthorized to edit this message");
    }

    return this.messageRepository.editMessage(id, content);
  }

  async delete(id: string, userId: string): Promise<void> {
    const message = await this.messageRepository.findById(id);
    if (!message) {
      throw new Error("Message not found");
    }

    if (message.userId !== userId) {
      throw new Error("Unauthorized to delete this message");
    }

    await this.messageRepository.deleteMessage(id);
  }

  async deleteByRoomId(roomId: string): Promise<void> {
    await this.messageRepository.deleteMessagesByRoom(roomId);
  }

  async getMessageById(id: string): Promise<MessageWithRelations | null> {
    return await this.messageRepository.findWithRelations(id);
  }

  async getMessagesByUserId(
    userId: string,
    limit?: number
  ): Promise<MessageWithUser[]> {
    return await this.messageRepository.findByUserId(userId, limit);
  }

  async getMessageStats(): Promise<MessageStats> {
    return await this.messageRepository.getMessageStats();
  }

  async searchMessages(
    content?: string,
    userId?: string,
    roomId?: string,
    hasStorage?: boolean,
    isEdited?: boolean
  ): Promise<MessageWithUser[]> {
    const filters = { content, userId, roomId, hasStorage, isEdited };
    return await this.messageRepository.searchMessages(filters);
  }

  async markAsRead(userId: string, roomId: string): Promise<void> {
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

  async updateMessage(
    id: string,
    content: string,
    userId: string
  ): Promise<void> {
    const message = await this.messageRepository.findById(id);

    if (!message || message.userId !== userId) {
      throw new ForbiddenException(
        "Você não tem permissão para editar esta mensagem"
      );
    }

    const updated = await this.messageRepository.editMessage(id, content);

    const updatedWithRelations =
      await this.messageRepository.findWithRelations(id);

    if (updatedWithRelations) {
      this.chatGateway.emitMessageEdited(updated.roomId, updatedWithRelations);
    }
  }

  async deleteMessage(id: string, userId: string): Promise<void> {
    const message = await this.messageRepository.findById(id);

    if (!message || message.userId !== userId) {
      throw new ForbiddenException(
        "Você não tem permissão para deletar esta mensagem"
      );
    }

    await this.messageRepository.delete(id);

    this.chatGateway.emitMessageDeleted(message.roomId, id);
  }

  async deleteMessagesByRoomId(roomId: string): Promise<void> {
    await this.messageRepository.deleteMessagesByRoomId(roomId);
  }
}
