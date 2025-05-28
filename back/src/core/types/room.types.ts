export interface Room {
  id: string;
  name: string;
  createdAt: Date;
}

export interface RoomCreateInput {
  name: string;
}

export interface RoomWithDetails extends Room {
  _count: {
    users: number;
    messages: number;
  };
  messages?: Array<{
    id: string;
    content: string;
    createdAt: Date;
    user: {
      id: string;
      username: string;
      email: string;
    };
  }>;
  users?: Array<{
    user: {
      id: string;
      username: string;
      email: string;
    };
  }>;
}

export interface UserRoom {
  id: string;
  userId: string;
  roomId: string;
  joinedAt: Date;
}

export interface UserRoomCreateInput {
  userId: string;
  roomId: string;
}

export interface RoomStats {
  totalRooms: number;
  totalUsers: number;
  totalMessages: number;
  activeRooms: number;
  averageUsersPerRoom: number;
  averageMessagesPerRoom: number;
}

export interface RoomSearchFilters {
  search?: string;
  name?: string;
  hasUsers?: boolean;
  page?: number;
  limit?: number;
}

// Response interfaces for controllers
export interface RoomListResponse {
  rooms: Array<{
    id: string;
    name: string;
    joined: boolean;
    unreadCount: number;
  }>;
  hasMore: boolean;
  nextCursor: string | null;
}

export interface JoinRoomResponse {
  joined: boolean;
}

export interface RoomUsersResponse {
  userId: string;
  username: string;
}
