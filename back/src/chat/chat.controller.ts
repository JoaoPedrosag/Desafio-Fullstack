import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MessageService } from '../message/message.service';
import { RoomService } from '../room/room.service';
import { RedisService } from '../core/redis/redis.service';
import { QueueService } from '../queue/queue.service';
import { ChatGateway } from './chat.gateway';
import {
  RoomUserCountResponse,
  RedisInfo,
  OnlineUser,
  RoomsWithUsers,
} from '../core/types/redis.types';
import { appConfig } from '../core/config/app.config';

interface QueueStatusResponse {
  status: string;
  queue: string;
  timestamp: string;
  data?: any;
  error?: string;
  stack?: string;
}

interface ClearJobsResponse {
  status: string;
  message: string;
  timestamp: string;
  result?: any;
  error?: string;
}

@Controller('chat')
export class ChatController {
  constructor(
    private messageService: MessageService,
    private roomService: RoomService,
    private redisService: RedisService,
    private queueService: QueueService,
    private chatGateway: ChatGateway,
  ) {}

  @Get('rooms/:roomId/users')
  async getRoomUsers(@Param('roomId') roomId: string): Promise<OnlineUser[]> {
    return await this.redisService.getRoomUsers(roomId);
  }

  @Get('rooms/:roomId/count')
  async getRoomUserCount(
    @Param('roomId') roomId: string,
  ): Promise<RoomUserCountResponse> {
    const count = await this.redisService.getRoomUserCount(roomId);
    return { roomId, count };
  }

  @Get('rooms/all')
  async getAllRoomsWithUsers(): Promise<RoomsWithUsers> {
    return await this.redisService.getAllRoomsWithUsers();
  }

  @Get('debug/redis-info')
  async getRedisInfo(): Promise<RedisInfo> {
    return await this.redisService.getRedisInfo();
  }

  @Get('debug/online-users')
  async getOnlineUsers(): Promise<RoomsWithUsers> {
    if (appConfig.nodeEnv !== 'development') {
      throw new Error('Este endpoint só está disponível em desenvolvimento');
    }
    return await this.chatGateway.getOnlineUsersDebug();
  }

  @Get('debug/queue-status')
  async getQueueStatus(): Promise<QueueStatusResponse> {
    try {
      const queueInfo = await this.queueService.getQueueInfo();
      return {
        status: 'ok',
        queue: 'connected',
        timestamp: new Date().toISOString(),
        data: queueInfo,
      };
    } catch (error) {
      return {
        status: 'error',
        queue: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      };
    }
  }

  @Post('debug/queue-clear-failed')
  async clearFailedJobs(): Promise<ClearJobsResponse> {
    if (appConfig.nodeEnv === 'production') {
      throw new Error('Endpoint disponível apenas em desenvolvimento');
    }

    try {
      const result = await this.queueService.clearFailedJobs();
      return {
        status: 'ok',
        message: 'Failed jobs cleared successfully',
        timestamp: new Date().toISOString(),
        result,
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to clear jobs',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
