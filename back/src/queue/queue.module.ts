import { Module, forwardRef } from '@nestjs/common';
import { QueueService } from './queue.service';
import { MessageProcessor } from './processors/message.processor';
import { MessageModule } from '../message/message.module';
import { ChatGateway, SocketServer } from '../chat/chat.gateway';
import { BullModule } from '@nestjs/bullmq';
import { ChatModule } from 'src/chat/chat.module';
import { appConfig } from '../core/config/app.config';

@Module({
  imports: [
    MessageModule,
    forwardRef(() => ChatModule),
    BullModule.forRoot({
      connection: {
        host: appConfig.redis.host,
        port: appConfig.redis.port,
      },
    }),
    BullModule.registerQueue({
      name: 'message-queue',
    }),
  ],
  providers: [
    QueueService,
    MessageProcessor,
    {
      provide: SocketServer,
      useFactory: (chat: ChatGateway) => chat.server,
      inject: [ChatGateway],
    },
  ],
  exports: [QueueService],
})
export class QueueModule {}
