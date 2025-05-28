import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty({ message: 'password é obrigatório' })
  @MinLength(6)
  password: string;
}
