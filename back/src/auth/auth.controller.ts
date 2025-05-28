import {
  Controller,
  Post,
  Body,
  HttpCode,
  Get,
  UseGuards,
  Res,
  Put,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from 'src/core/guards/jwt-auth.guard';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { JwtPayload } from './types/jwt-payload.interface';
import { Response } from 'express';
import { appConfig } from '../core/config/app.config';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(201)
  async register(@Body() dto: RegisterDto): Promise<{ message: string }> {
    await this.authService.register(dto);
    return { message: 'Usuário registrado com sucesso' };
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const { accessToken } = await this.authService.login(dto);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: appConfig.nodeEnv === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return { message: 'Login realizado com sucesso' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  @HttpCode(200)
  async refreshToken(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const { accessToken } = await this.authService.refreshToken(user.userId);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: appConfig.nodeEnv === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return { message: 'Token renovado com sucesso' };
  }

  @UseGuards(JwtAuthGuard)
  @Put('change-password')
  @HttpCode(200)
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.changePassword(user.userId, dto);
    return { message: 'Senha alterada com sucesso' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: JwtPayload) {
    return await this.authService.getMe(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getUserStats(@CurrentUser() user: JwtPayload) {
    return await this.authService.getUserStats(user.userId);
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response): { message: string } {
    res.clearCookie('accessToken');
    return { message: 'Logout realizado com sucesso' };
  }
}
