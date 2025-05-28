import { Socket } from 'socket.io';

export interface AuthenticatedUser {
  userId: string;
  username: string;
  email?: string;
}

export interface SocketData {
  user: AuthenticatedUser;
  currentRoomId?: string;
}

export interface AuthenticatedSocket extends Socket {
  data: SocketData;
}

export interface MessageData {
  content: string;
  roomId: string;
  storageId?: string;
}

export interface TypingData {
  roomId: string;
  userId: string;
}

export interface RoomData {
  roomId: string;
}

export interface UserLeftRoomData {
  username: string;
  roomId: string;
}

export interface RoomNotificationData {
  roomId: string;
  preview: string;
}

export interface OnlineCountData {
  roomId: string;
  count: number;
}

export interface MessageDeletedData {
  id: string;
}

export interface NewRoomData {
  id: string;
  name: string;
  userId: string;
}

// Tipos para eventos do Socket.IO
export interface ServerToClientEvents {
  onlineUsers: (users: any[]) => void;
  userIsTyping: (data: { userId: string }) => void;
  userLeftRoom: (data: UserLeftRoomData) => void;
  onlineCount: (data: OnlineCountData) => void;
  newMessage: (message: any) => void;
  roomNotification: (data: RoomNotificationData) => void;
  newRoom: (data: NewRoomData) => void;
  messageEdited: (message: any) => void;
  messageDeleted: (data: MessageDeletedData) => void;
}

export interface ClientToServerEvents {
  joinRoom: (roomId: string) => void;
  sendMessage: (data: MessageData) => void;
  userTyping: (data: TypingData) => void;
  leaveRoom: (data: RoomData) => void;
}
