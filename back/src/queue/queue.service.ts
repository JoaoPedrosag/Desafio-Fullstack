import { Injectable } from '@nestjs/common';
import { Queue, Job } from 'bullmq';
import { MessageJobDTO } from './dto/message-job.dto';
import Redis from 'ioredis';
import { appConfig } from '../core/config/app.config';

interface QueueInfoResponse {
  name: string;
  stats: Record<string, number>;
  jobs: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  failedJobsDetails: Array<{
    id: string | undefined;
    data: MessageJobDTO | { content: string; roomId: string; userId: string };
    failedReason?: string;
    stacktrace?: string | null;
    attemptsMade: number;
    timestamp: number;
  }>;
  connectionStatus: string;
  lastCheck: string;
}

interface ClearJobsResult {
  message: string;
  timestamp: string;
}

@Injectable()
export class QueueService {
  private readonly messageQueue: Queue<MessageJobDTO>;
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: appConfig.redis.host,
      port: appConfig.redis.port,
    });
    this.messageQueue = new Queue('message-queue', {
      connection: {
        host: appConfig.redis.host,
        port: appConfig.redis.port,
      },
    });
  }

  async enqueueMessage(data: MessageJobDTO): Promise<void> {
    await this.messageQueue.add('save-message', data);
  }

  async getQueueInfo(): Promise<QueueInfoResponse> {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.messageQueue.getWaiting(),
        this.messageQueue.getActive(),
        this.messageQueue.getCompleted(),
        this.messageQueue.getFailed(),
        this.messageQueue.getDelayed(),
      ]);

      const stats = await this.messageQueue.getJobCounts();

      const failedJobsDetails = failed.slice(0, 5).map((job: Job) => ({
        id: job.id,
        data: this.isMessageJobData(job.data)
          ? job.data
          : { content: 'Unknown', roomId: 'Unknown', userId: 'Unknown' },
        failedReason: job.failedReason,
        stacktrace: this.formatStacktrace(job.stacktrace),
        attemptsMade: job.attemptsMade,
        timestamp: job.timestamp,
      }));

      return {
        name: this.messageQueue.name,
        stats,
        jobs: {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
          delayed: delayed.length,
        },
        failedJobsDetails,
        connectionStatus: 'connected',
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(
        `Failed to get queue info: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async clearFailedJobs(): Promise<ClearJobsResult> {
    try {
      await this.messageQueue.clean(0, 0, 'failed');
      return {
        message: 'All failed jobs cleared',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(
        `Failed to clear jobs: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private isMessageJobData(data: any): data is MessageJobDTO {
    return (
      typeof data === 'object' &&
      data !== null &&
      'content' in data &&
      'roomId' in data &&
      'userId' in data
    );
  }

  private formatStacktrace(
    stacktrace: string | string[] | null | undefined,
  ): string | null {
    if (Array.isArray(stacktrace)) {
      return stacktrace.join('\n').slice(0, 500);
    } else if (typeof stacktrace === 'string') {
      return stacktrace.slice(0, 500);
    } else {
      return null;
    }
  }
}
