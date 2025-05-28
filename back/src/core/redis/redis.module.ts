import { Module, Global } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisService } from './redis.service';
import { RedisCleanupService } from './redis-cleanup.service';

@Global()
@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [RedisService, RedisCleanupService],
  exports: [RedisService, RedisCleanupService],
})
export class RedisModule {}
