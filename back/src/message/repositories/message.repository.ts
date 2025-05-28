import { Injectable } from "@nestjs/common";
import { Message, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
  MessageCreateInput,
  MessageWithUser,
  MessageWithRelations,
  MessageStats,
  MessageSearchFilters,
} from "../../core/types/message.types";

export interface IMessageRepository {
  findWithUser(id: string): Promise<MessageWithUser | null>;
  findWithRelations(id: string): Promise<MessageWithRelations | null>;
  findByRoomId(
    roomId: string,
    limit?: number,
    cursor?: string
  ): Promise<MessageWithUser[]>;
  findByUserId(userId: string, limit?: number): Promise<MessageWithUser[]>;
  getMessageStats(): Promise<MessageStats>;
  searchMessages(filters: MessageSearchFilters): Promise<MessageWithUser[]>;
  editMessage(id: string, content: string): Promise<Message>;
  deleteMessagesByRoomId(roomId: string): Promise<void>;
  countUnreadMessages(roomId: string, lastRead: Date): Promise<number>;
}

@Injectable()
export class MessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMessage(data: MessageCreateInput): Promise<Message> {
    return this.prisma.message.create({
      data,
    });
  }

  async findById(id: string): Promise<Message | null> {
    return this.prisma.message.findUnique({
      where: { id },
    });
  }

  async getMessageStats(): Promise<MessageStats> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [total, thisWeek] = await Promise.all([
      this.prisma.message.count(),
      this.prisma.message.count({
        where: {
          createdAt: {
            gte: oneWeekAgo,
          },
        },
      }),
    ]);

    const messagesThisWeek = await this.prisma.message.count({
      where: {
        createdAt: {
          gte: oneWeekAgo,
        },
      },
    });

    const totalRooms = await this.prisma.room.count();

    return {
      total,
      thisWeek,
      averagePerRoom: totalRooms > 0 ? Math.round(total / totalRooms) : 0,
      weeklyGrowth: messagesThisWeek,
    };
  }

  async searchMessages(filters: MessageSearchFilters) {
    const {
      content,
      userId,
      roomId,
      hasStorage,
      page = 1,
      limit = 10,
    } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.MessageWhereInput = {};

    if (content) {
      where.content = { contains: content, mode: "insensitive" };
    }

    if (userId) {
      where.userId = userId;
    }

    if (roomId) {
      where.roomId = roomId;
    }

    if (hasStorage !== undefined) {
      where.storageId = hasStorage ? { not: null } : null;
    }

    return this.prisma.message.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        storage: {
          select: {
            id: true,
            filename: true,
            url: true,
            mimetype: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async deleteMessage(id: string): Promise<void> {
    await this.prisma.message.delete({
      where: { id },
    });
  }

  async deleteMessagesByRoom(roomId: string): Promise<void> {
    await this.prisma.message.deleteMany({
      where: { roomId },
    });
  }

  async findWithUser(id: string): Promise<MessageWithUser | null> {
    return this.prisma.message.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }

  async findWithRelations(id: string): Promise<MessageWithRelations | null> {
    return this.prisma.message.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
          },
        },
        storage: {
          select: {
            id: true,
            filename: true,
            url: true,
            mimetype: true,
          },
        },
      },
    });
  }

  async findByRoomId(
    roomId: string,
    limit: number = 50,
    cursor?: string
  ): Promise<MessageWithUser[]> {
    const where: Prisma.MessageWhereInput = { roomId };

    if (cursor) {
      where.id = { lt: cursor };
    }

    return this.prisma.message.findMany({
      where,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        storage: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            url: true,
            mimetype: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByUserId(
    userId: string,
    limit: number = 50
  ): Promise<MessageWithUser[]> {
    return this.prisma.message.findMany({
      where: { userId },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async editMessage(id: string, content: string): Promise<Message> {
    return this.prisma.message.update({
      where: { id },
      data: {
        content,
        edited: true,
        editedAt: new Date(),
      },
    });
  }

  async countUnreadMessages(roomId: string, lastRead: Date): Promise<number> {
    return this.prisma.message.count({
      where: {
        roomId,
        createdAt: { gt: lastRead },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.message.delete({
      where: { id },
    });
  }

  async deleteMessagesByRoomId(roomId: string): Promise<void> {
    await this.prisma.message.deleteMany({
      where: { roomId },
    });
  }
}
