import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Patch,
  Delete,
  Query,
  HttpCode,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import { JwtPayload } from 'src/auth/types/jwt-payload.interface';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(private messageService: MessageService) {}

  @Post()
  create(@Body() dto: CreateMessageDto, @CurrentUser() user: JwtPayload) {
    return this.messageService.create(dto, user.userId);
  }

  @Get('room/:roomId')
  @HttpCode(200)
  async getMessages(
    @Param('roomId') roomId: string,
    @Query('cursor') cursor?: string,
    @Query('take') take?: string,
  ) {
    return this.messageService.findMessages(
      roomId,
      take ? parseInt(take, 10) : 50,
      cursor,
    );
  }

  @Patch(':id')
  async updateMessage(
    @Param('id') id: string,
    @Body('content') content: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const userId = user.userId;
    return this.messageService.updateMessage(id, content, userId);
  }

  @Delete(':id')
  async deleteMessage(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const userId = user.userId;
    return this.messageService.deleteMessage(id, userId);
  }
}
