import { create } from "zustand";
import { api } from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";

type User = {
  id: string;
  email: string;
  username: string;
};

type AuthStore = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  getMe: () => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  isAuthenticated: false,

  getMe: async () => {
    set({ loading: true });
    try {
      const res = await api.get("/auth/me");

      connectSocket();
      set({
        user: res.data,
        isAuthenticated: true,
        loading: false,
      });
    } catch {
      set({ user: null, isAuthenticated: false, loading: false });
      disconnectSocket();
    }
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
    disconnectSocket();
  },
}));
