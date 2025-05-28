import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CoreModule } from './core/core.module';
import { AuthModule } from './auth/auth.module';
import { RoomModule } from './room/room.module';
import { MessageModule } from './message/message.module';
import { StorageModule } from './storage/storage.module';
import { ChatModule } from './chat/chat.module';
import { QueueModule } from './queue/queue.module';
import { RedisModule } from './core/redis/redis.module';
import { HealthModule } from './health/health.module';
import { ErrorHandlingInterceptor } from './core/interceptors/error-handling.interceptor';
import { PerformanceInterceptor } from './core/interceptors/performance.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public/uploads'),
      serveRoot: '/uploads',
    }),
    CoreModule,
    RedisModule,
    AuthModule,
    RoomModule,
    MessageModule,
    StorageModule,
    ChatModule,
    QueueModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorHandlingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
  ],
})
export class AppModule {}
