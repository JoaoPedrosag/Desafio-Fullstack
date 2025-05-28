import { IsEmail, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'Username é obrigatório' })
  @MinLength(3, { message: 'Username deve ter no mínimo 3 caracteres' })
  @MaxLength(20, { message: 'Username deve ter no máximo 20 caracteres' })
  username: string;

  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  password: string;
}
