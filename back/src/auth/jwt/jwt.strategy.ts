import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AuthenticatedUser } from '../../core/types/socket.types';
import { appConfig } from '../../core/config/app.config';

interface JwtPayload {
  sub: string;
  username: string;
  email?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromExtractors([
          (request: Request) => {
            const token = request?.cookies?.accessToken as string | undefined;
            if (token) {
              return token;
            }
            return null;
          },
        ]),
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: appConfig.jwt.secret,
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      userId: payload.sub,
      username: payload.username,
      email: payload.email,
    };
  }
}
