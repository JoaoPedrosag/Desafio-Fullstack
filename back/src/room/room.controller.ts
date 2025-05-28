import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Query,
  Patch,
} from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { JwtPayload } from 'src/auth/types/jwt-payload.interface';
import { JwtAuthGuard } from 'src/core/guards/jwt-auth.guard';
import { RoomFilterEnum } from './enums/room-filter.enum';
import { Room } from '../core/types/room.types';

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  async create(
    @Body() dto: CreateRoomDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<Room> {
    return this.roomService.create(dto, user.userId);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
    @Query('roomFilter')
    roomFilter: RoomFilterEnum = RoomFilterEnum.ONLY_JOINED,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const limitNumber = limit ? parseInt(limit, 10) : 20;
    return this.roomService.findAll(
      user.userId,
      search,
      roomFilter,
      cursor,
      limitNumber,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomService.findOne(id);
  }

  @Post(':id/join')
  async joinRoom(@Param('id') roomId: string, @CurrentUser() user: JwtPayload) {
    return this.roomService.joinRoom(user.userId, roomId);
  }

  @Patch(':id/mark-as-read')
  async markAsRead(
    @Param('id') roomId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.roomService.markAsRead(user.userId, roomId);
  }

  @Post(':id/leave')
  async leaveRoom(
    @Param('id') roomId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.roomService.leaveRoom(user.userId, roomId);
  }

  @Get(':id/users-in-room')
  async getUsersInRoom(@Param('id') roomId: string) {
    return this.roomService.getUsersInRoom(roomId);
  }
}
