import { forwardRef, Module } from '@nestjs/common';

import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { QueueModule } from '../queue/queue.module';
import { AuthModule } from 'src/auth/auth.module';
import { MessageModule } from 'src/message/message.module';
import { RoomModule } from 'src/room/room.module';
import { CoreModule } from 'src/core/core.module';

@Module({
  imports: [
    CoreModule,
    forwardRef(() => QueueModule),
    forwardRef(() => MessageModule),
    forwardRef(() => RoomModule),
    AuthModule,
  ],
  controllers: [ChatController],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
