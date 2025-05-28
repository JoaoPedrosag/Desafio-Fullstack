import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import { JwtPayload } from '../types/jwt-payload.interface';
import { appConfig } from '../../core/config/app.config';

@Injectable()
export class JwtSocketMiddleware {
  constructor(private jwtService: JwtService) {}

  use = (socket: Socket, next: (err?: ExtendedError) => void): void => {
    try {
      const token = this.extractTokenFromSocket(socket);

      if (!token) {
        return next(new Error('Token de autenticação não encontrado'));
      }

      const payload = this.verifyJwtToken(token);
      if (!payload) {
        return next(new Error('Token inválido'));
      }

      socket.data = socket.data || {};
      socket.data.user = {
        userId: payload.sub,
        username: payload.username,
      };

      next();
    } catch (err) {
      console.error('Erro na autenticação do socket:', err);
      next(new Error('Falha na autenticação'));
    }
  };

  private extractTokenFromSocket(socket: Socket): string | null {
    try {
      const cookies = socket.handshake.headers.cookie;
      if (!cookies) {
        return this.extractFromAuth(socket);
      }

      const cookieArray = cookies.split(';').map((c) => c.trim());
      for (const cookie of cookieArray) {
        if (cookie.startsWith('accessToken=')) {
          return cookie.split('=')[1];
        }
      }

      return this.extractFromAuth(socket);
    } catch (err) {
      console.error('Erro ao extrair token do socket:', err);
      return null;
    }
  }

  private extractFromAuth(socket: Socket): string | null {
    const auth = socket.handshake.auth as { token?: string } | undefined;
    const authToken = auth?.token || socket.handshake.headers.authorization;

    if (!authToken) {
      return null;
    }

    if (typeof authToken === 'string' && authToken.startsWith('Bearer ')) {
      return authToken.substring(7);
    }

    return typeof authToken === 'string' ? authToken : null;
  }

  private verifyJwtToken(token: string): JwtPayload | null {
    try {
      const decoded: unknown = this.jwtService.verify(token, {
        secret: appConfig.jwt.secret,
      });

      if (!this.isValidPayload(decoded)) {
        throw new Error('Invalid JWT payload');
      }

      return decoded;
    } catch (err) {
      console.error('JWT token verification failed:', err);
      return null;
    }
  }

  private isValidPayload(payload: unknown): payload is JwtPayload {
    return (
      payload !== null &&
      typeof payload === 'object' &&
      'sub' in payload &&
      'username' in payload &&
      typeof (payload as Record<string, unknown>).sub === 'string' &&
      typeof (payload as Record<string, unknown>).username === 'string'
    );
  }
}
