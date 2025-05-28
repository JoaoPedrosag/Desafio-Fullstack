import { forwardRef, Module } from '@nestjs/common';

import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { MessageRepository } from './repositories/message.repository';
import { AuthModule } from 'src/auth/auth.module';
import { ChatModule } from 'src/chat/chat.module';
import { StorageModule } from 'src/storage/storage.module';
import { RoomModule } from 'src/room/room.module';

@Module({
  controllers: [MessageController],
  providers: [MessageService, MessageRepository],
  exports: [MessageService, MessageRepository],
  imports: [
    forwardRef(() => ChatModule),
    forwardRef(() => RoomModule),
    AuthModule,
    StorageModule,
  ],
})
export class MessageModule {}
