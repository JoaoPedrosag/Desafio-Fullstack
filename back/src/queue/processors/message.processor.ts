import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MessageService } from '../../message/message.service';
import { ChatGateway } from 'src/chat/chat.gateway';
import { MessageJobDTO } from '../dto/message-job.dto';
import { MessageWithRelations } from '../../core/types/message.types';

@Processor('message-queue')
export class MessageProcessor extends WorkerHost {
  constructor(
    private messageService: MessageService,
    private chatGateway: ChatGateway,
  ) {
    super();
  }

  async process(job: Job<MessageJobDTO, void>): Promise<void> {
    const { content, storageId, roomId, userId } = job.data;

    try {
      const message: MessageWithRelations = await this.messageService.create(
        { content, roomId, storageId },
        userId,
      );

      const sockets = this.chatGateway.server.sockets.sockets;

      for (const [, socket] of sockets) {
        if (!socket.data.user?.userId) continue;

        const viewerId = socket.data.user.userId;
        const currentRoomId = socket.data.currentRoomId;

        if (viewerId && currentRoomId === roomId) {
          await this.messageService.markAsRead(viewerId, roomId);
        }
      }

      await this.messageService.markAsRead(userId, roomId);

      this.chatGateway.emitMessageToRoom(roomId, message);

      console.log(`✅ Mensagem processada: ${message.id} na sala ${roomId}`);
    } catch (error) {
      console.error(`❌ Erro ao processar mensagem:`, error);
      throw error;
    }
  }
}
