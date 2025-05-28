import { forwardRef, Module } from '@nestjs/common';

import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { ChatModule } from 'src/chat/chat.module';
import { RoomRepository } from './repositories/room.repository';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [RoomController],
  providers: [RoomService, RoomRepository],
  exports: [RoomService, RoomRepository],
  imports: [forwardRef(() => ChatModule), AuthModule],
})
export class RoomModule {}
