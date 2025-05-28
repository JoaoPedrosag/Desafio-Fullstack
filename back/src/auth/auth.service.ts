import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRepository } from './repositories/user.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { MeDto } from './dto/me.dto';
import { AuthTokens, JwtPayload } from './types/auth.types';
import { UserStats, User } from '../core/types/user.types';

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('E-mail já está em uso');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.userRepository.createUser({
      username: dto.username,
      email: dto.email,
      password: hashedPassword,
    });

    const tokens = this.generateTokens(user.id, user.username);
    return { user, ...tokens };
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return this.generateTokens(user.id, user.username);
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findById(userId);
  }

  async refreshToken(userId: string): Promise<{ accessToken: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '15m' },
    );

    return { accessToken };
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    const hashedNewPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      10,
    );

    await this.userRepository.updateUser(userId, {
      password: hashedNewPassword,
    });
  }

  async getMe(userId: string): Promise<MeDto> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
    };
  }

  async getUserStats(userId: string): Promise<UserStats> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return this.userRepository.getUserStats();
  }

  private generateTokens(userId: string, username: string): AuthTokens {
    const payload: JwtPayload = { sub: userId, username };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
