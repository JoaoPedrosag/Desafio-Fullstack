import { Injectable } from '@nestjs/common';
import { Room, UserRoom, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RoomCreateInput,
  RoomWithDetails,
  UserRoomCreateInput,
  RoomStats,
  RoomSearchFilters,
} from '../../core/types/room.types';

@Injectable()
export class RoomRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createRoom(data: RoomCreateInput): Promise<Room> {
    return this.prisma.room.create({
      data,
    });
  }

  async findById(id: string): Promise<Room | null> {
    return this.prisma.room.findUnique({
      where: { id },
    });
  }

  async findRoomWithDetails(id: string): Promise<RoomWithDetails | null> {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        messages: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            users: true,
            messages: true,
          },
        },
      },
    });

    return room as RoomWithDetails | null;
  }

  async findManyRooms(): Promise<Room[]> {
    return this.prisma.room.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async addUserToRoom(data: UserRoomCreateInput): Promise<UserRoom> {
    return this.prisma.userRoom.create({
      data,
    });
  }

  async removeUserFromRoom(roomId: string, userId: string): Promise<void> {
    await this.prisma.userRoom.deleteMany({
      where: { userId, roomId },
    });
  }

  async isUserInRoom(roomId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.userRoom.count({
      where: { userId, roomId },
    });
    return count > 0;
  }

  async getRoomUsers(roomId: string) {
    const userRooms = await this.prisma.userRoom.findMany({
      where: { roomId },
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
    return userRooms.map(ur => ur.user);
  }

  async getUserRooms(userId: string) {
    const userRooms = await this.prisma.userRoom.findMany({
      where: { userId },
      include: {
        room: true,
      },
    });
    return userRooms.map(ur => ur.room);
  }

  async getRoomStats(): Promise<RoomStats> {
    const [totalRooms, totalUsers, totalMessages] = await Promise.all([
      this.prisma.room.count(),
      this.prisma.userRoom.count(),
      this.prisma.message.count(),
    ]);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const activeRooms = await this.prisma.room.count({
      where: {
        messages: {
          some: {
            createdAt: { gte: oneWeekAgo },
          },
        },
      },
    });

    return {
      totalRooms,
      totalUsers,
      totalMessages,
      activeRooms,
      averageUsersPerRoom:
        totalRooms > 0 ? Math.round(totalUsers / totalRooms) : 0,
      averageMessagesPerRoom:
        totalRooms > 0 ? Math.round(totalMessages / totalRooms) : 0,
    };
  }

  async searchRooms(filters: RoomSearchFilters) {
    const { search, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.RoomWhereInput = {};

    if (search) {
      where.OR = [{ name: { contains: search, mode: 'insensitive' } }];
    }

    return this.prisma.room.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}
