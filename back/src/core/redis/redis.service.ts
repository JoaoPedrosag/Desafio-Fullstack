import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";
import {
  OnlineUser,
  RedisConfig,
  RedisInfo,
  RoomsWithUsers,
} from "../types/redis.types";
import { appConfig } from "../config/app.config";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly redis: Redis;
  private readonly pubClient: Redis;
  private readonly subClient: Redis;

  constructor() {
    const redisConfig: RedisConfig = {
      host: appConfig.redis.host,
      port: appConfig.redis.port,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: null,
    };

    this.redis = new Redis(redisConfig);
    this.pubClient = new Redis(redisConfig);
    this.subClient = new Redis(redisConfig);
  }

  getPubClient(): Redis {
    return this.pubClient;
  }

  getSubClient(): Redis {
    return this.subClient;
  }

  async addUserToRoom(roomId: string, user: OnlineUser): Promise<void> {
    const key = `room:${roomId}:users`;
    const userKey = `user:${user.userId}:${user.socketId}`;

    const pipeline = this.redis.pipeline();

    pipeline.hset(userKey, {
      userId: user.userId,
      username: user.username,
      socketId: user.socketId,
      joinedAt: user.joinedAt.toISOString(),
      roomId,
    });

    pipeline.sadd(key, userKey);

    pipeline.expire(userKey, 86400);

    await pipeline.exec();
  }

  async removeUserFromRoom(
    roomId: string,
    userId: string,
    socketId: string
  ): Promise<void> {
    const key = `room:${roomId}:users`;
    const userKey = `user:${userId}:${socketId}`;

    const pipeline = this.redis.pipeline();

    pipeline.srem(key, userKey);

    pipeline.del(userKey);

    await pipeline.exec();

    const roomSize = await this.redis.scard(key);
    if (roomSize === 0) {
      await this.redis.del(key);
    }
  }

  async removeUserFromAllRooms(
    userId: string,
    socketId: string
  ): Promise<void> {
    const userKey = `user:${userId}:${socketId}`;
    const userData = await this.redis.hgetall(userKey);

    if (userData.roomId) {
      await this.removeUserFromRoom(userData.roomId, userId, socketId);
    }
  }

  async getRoomUsers(roomId: string): Promise<OnlineUser[]> {
    const key = `room:${roomId}:users`;
    const userKeys = await this.redis.smembers(key);

    if (userKeys.length === 0) return [];

    const pipeline = this.redis.pipeline();
    userKeys.forEach((userKey) => pipeline.hgetall(userKey));

    const results = await pipeline.exec();

    if (!results) return [];

    const validUsers: OnlineUser[] = [];
    const keysToClean: string[] = [];

    for (let i = 0; i < results.length; i++) {
      const [err, data] = results[i];
      const userKey = userKeys[i];

      if (err || !data || typeof data !== "object") {
        keysToClean.push(userKey);
        continue;
      }

      const userData = data as Record<string, string>;

      if (
        !userData.userId ||
        !userData.username ||
        !userData.socketId ||
        !userData.joinedAt
      ) {
        keysToClean.push(userKey);
        continue;
      }

      validUsers.push({
        userId: userData.userId,
        username: userData.username,
        socketId: userData.socketId,
        joinedAt: new Date(userData.joinedAt),
      });
    }

    if (keysToClean.length > 0) {
      this.cleanupInvalidKeys(key, keysToClean).catch((error) => {
        console.error("Erro ao limpar chaves inválidas:", error);
      });
    }

    return validUsers;
  }

  private async cleanupInvalidKeys(
    roomKey: string,
    invalidKeys: string[]
  ): Promise<void> {
    const pipeline = this.redis.pipeline();
    invalidKeys.forEach((key) => {
      pipeline.srem(roomKey, key);
      pipeline.del(key);
    });
    await pipeline.exec();
  }

  async getRoomUserCount(roomId: string): Promise<number> {
    const key = `room:${roomId}:users`;
    return await this.redis.scard(key);
  }

  async isUserInRoom(
    roomId: string,
    userId: string,
    socketId: string
  ): Promise<boolean> {
    const key = `room:${roomId}:users`;
    const userKey = `user:${userId}:${socketId}`;
    return (await this.redis.sismember(key, userKey)) === 1;
  }

  async isUserInRoomByUserId(roomId: string, userId: string): Promise<boolean> {
    const users = await this.getRoomUsers(roomId);
    return users.some((user) => user.userId === userId);
  }

  async removeUserPreviousConnections(
    roomId: string,
    userId: string,
    currentSocketId: string
  ): Promise<void> {
    const users = await this.getRoomUsers(roomId);
    const userPreviousConnections = users.filter(
      (user) => user.userId === userId && user.socketId !== currentSocketId
    );

    if (userPreviousConnections.length > 0) {
      console.log(
        `🧹 Removendo ${userPreviousConnections.length} conexões antigas do usuário ${userId}`
      );

      for (const oldConnection of userPreviousConnections) {
        await this.removeUserFromRoom(roomId, userId, oldConnection.socketId);
      }
    }
  }

  async getAllRoomsWithUsers(): Promise<RoomsWithUsers> {
    const pattern = "room:*:users";
    const keys = await this.redis.keys(pattern);

    const result: RoomsWithUsers = {};

    for (const key of keys) {
      const roomId = key.split(":")[1];
      if (roomId) {
        result[roomId] = await this.getRoomUsers(roomId);
      }
    }

    return result;
  }

  async cleanupExpiredUsers(): Promise<void> {
    const pattern = "user:*";
    const keys = await this.redis.keys(pattern);

    const pipeline = this.redis.pipeline();

    for (const key of keys) {
      const ttl = await this.redis.ttl(key);
      if (ttl === -1) {
        pipeline.expire(key, 86400);
      }
    }

    await pipeline.exec();
  }

  async getRedisInfo(): Promise<RedisInfo> {
    return {
      rooms: await this.redis.keys("room:*:users"),
      users: await this.redis.keys("user:*"),
    };
  }

  onModuleDestroy(): void {
    this.redis.disconnect();
    this.pubClient.disconnect();
    this.subClient.disconnect();
  }
}
