import {
  SocketData,
  ServerToClientEvents,
  ClientToServerEvents,
} from '../core/types/socket.types';

declare module 'socket.io' {
  interface Socket {
    data: SocketData;
  }
}

export type TypedServer = import('socket.io').Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

export type TypedSocket = import('socket.io').Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;
