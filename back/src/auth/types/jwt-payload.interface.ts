export interface JwtPayload {
  sub: string;
  username: string;
  userId: string;
  iat?: number;
  exp?: number;
}
