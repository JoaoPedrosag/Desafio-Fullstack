import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { JwtPayload } from 'src/auth/types/jwt-payload.interface';
import { JwtAuthGuard } from 'src/core/guards/jwt-auth.guard';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
    @Body('roomId') roomId: string,
  ) {
    const url = await this.storageService.uploadFile(
      file.buffer,
      file.mimetype,
      file.originalname,
      user.userId,
      roomId,
    );
    return { imageUrl: url };
  }
}
