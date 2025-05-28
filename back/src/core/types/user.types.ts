export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
}

export interface UserCreateInput {
  username: string;
  email: string;
  password: string;
}

export interface UserUpdateInput {
  username?: string;
  email?: string;
  password?: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}

export interface UserSearchFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface UserStats {
  total: number;
  active: number;
  recent: number;
}
