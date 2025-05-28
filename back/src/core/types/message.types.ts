export interface Message {
  id: string;
  content: string;
  storageId?: string | null;
  userId: string;
  roomId: string;
  createdAt: Date;
  edited: boolean;
  editedAt?: Date | null;
}

export interface MessageCreateInput {
  content: string;
  storageId?: string;
  userId: string;
  roomId: string;
}

export interface MessageWithUser extends Message {
  user: {
    id: string;
    username: string;
    email: string;
  };
}

export interface MessageWithRelations extends Message {
  user: {
    id: string;
    username: string;
    email: string;
  };
  room: {
    id: string;
    name: string;
  };
  storage?: {
    id: string;
    filename: string;
    url: string;
    mimetype: string;
  } | null;
}

export interface MessageStats {
  total: number;
  thisWeek: number;
  averagePerRoom: number;
  weeklyGrowth: number;
}

export interface MessageSearchFilters {
  content?: string;
  userId?: string;
  roomId?: string;
  hasStorage?: boolean;
  isEdited?: boolean;
  page?: number;
  limit?: number;
}

export interface MessagesResponse {
  messages: MessageWithRelations[];
  hasMore: boolean;
  nextCursor: string | null;
}
