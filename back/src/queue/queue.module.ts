import { Module, forwardRef } from "@nestjs/common";
import { QueueService } from "./queue.service";
import { MessageProcessor } from "./processors/message.processor";
import { MessageModule } from "../message/message.module";
import { ChatGateway, SocketServer } from "../chat/chat.gateway";
import { BullModule } from "@nestjs/bullmq";
import { ChatModule } from "src/chat/chat.module";
import { appConfig } from "../core/config/app.config";

@Module({
  imports: [
    MessageModule,
    forwardRef(() => ChatModule),
    BullModule.forRoot({
      connection: {
        host: appConfig.redis.host,
        port: appConfig.redis.port,
        maxRetriesPerRequest: null,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 10000,
        family: 4,
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      },
    }),
    BullModule.registerQueue({
      name: "message-queue",
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 25,
        attempts: 2,
        backoff: {
          type: "fixed",
          delay: 1000,
        },
      },
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
