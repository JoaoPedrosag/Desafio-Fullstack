export interface RedisInfo {
  rooms: string[];
  users: string[];
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  redis: 'connected' | 'disconnected';
  timestamp: string;
  data?: RedisInfo;
  error?: string;
}

export interface RoomUserCountResponse {
  roomId: string;
  count: number;
}

export interface RedisConfig {
  host: string;
  port: number;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
}

export interface OnlineUser {
  userId: string;
  username: string;
  socketId: string;
  joinedAt: Date;
}

export interface RoomsWithUsers {
  [roomId: string]: OnlineUser[];
}
