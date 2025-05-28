import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty({ message: 'content é obrigatório' })
  content: string;
  @IsNotEmpty({ message: 'roomId é obrigatório' })
  roomId: string;

  @IsOptional()
  @IsUUID()
  storageId?: string;
}
