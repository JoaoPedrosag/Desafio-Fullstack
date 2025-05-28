import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RedisService } from './redis.service';
import { RedisInfo } from '../types/redis.types';

@Injectable()
export class RedisCleanupService {
  private readonly logger = new Logger(RedisCleanupService.name);

  constructor(private redisService: RedisService) {}

  @Cron('0 */30 * * * *')
  async handleCleanup(): Promise<void> {
    try {
      this.logger.log('🧹 Iniciando limpeza de dados orfãos no Redis...');

      await this.redisService.cleanupExpiredUsers();

      const info: RedisInfo = await this.redisService.getRedisInfo();
      this.logger.log(
        `✅ Limpeza concluída. Salas: ${info.rooms.length}, Usuários: ${info.users.length}`,
      );
    } catch (error) {
      this.logger.error('❌ Erro durante limpeza do Redis:', error);
    }
  }

  async manualCleanup(): Promise<void> {
    await this.handleCleanup();
  }
}
