import { Injectable } from '@nestjs/common';
import { HealthCheckResponse } from '../core/types/redis.types';

@Injectable()
export class HealthService {
  checkHealth(): HealthCheckResponse {
    try {
      // Health check básico por enquanto
      return {
        status: 'ok',
        redis: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        redis: 'disconnected',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
