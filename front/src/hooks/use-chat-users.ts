import { useState, useEffect } from "react";
import { api } from "../services/api";

interface UseChatUsersProps {
  roomId: string;
  userId: string;
}

export function useChatUsers({ roomId, userId }: UseChatUsersProps) {
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, number>>({});

  const loadUsers = async () => {
    if (!roomId) return;

    try {
      const [usersRes] = await Promise.all([
        api.get(`/rooms/${roomId}/users-in-room`),
        api.patch(`/rooms/${roomId}/mark-as-read`),
      ]);
      setAllUsers(usersRes.data);
    } catch (err) {
      console.error("Erro ao carregar usuários", err);
    }
  };

  const updateOnlineUsers = (users: User[]) => {
    setOnlineUsers(users);
  };

  const addTypingUser = (userId: string) => {
    setTypingUsers((prev) => ({ ...prev, [userId]: Date.now() }));
  };

  const getOfflineUsers = () => {
    return allUsers.filter(
      (u) => !onlineUsers.some((o) => o.userId === u.userId)
    );
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers((prev) => {
        const now = Date.now();
        const updated: Record<string, number> = {};
        let changed = false;

        for (const id in prev) {
          if (now - prev[id] <= 2000) {
            updated[id] = prev[id];
          } else {
            changed = true;
          }
        }

        return changed ? updated : prev;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [roomId]);

  return {
    onlineUsers,
    offlineUsers: getOfflineUsers(),
    allUsers,
    typingUsers,
    updateOnlineUsers,
    addTypingUser,
    loadUsers,
  };
}
