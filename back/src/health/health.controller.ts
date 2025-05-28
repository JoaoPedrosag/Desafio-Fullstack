import { Controller, Get } from '@nestjs/common';
import { HealthCheckResponse } from '../core/types/redis.types';
import { HealthService } from './health.service';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  getHealth(): HealthCheckResponse {
    return this.healthService.checkHealth();
  }
}
