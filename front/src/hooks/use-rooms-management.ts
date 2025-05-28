import { useState, useCallback, useRef, useEffect } from "react";
import { api } from "../services/api";
import { toaster } from "../components/ui/Toaster";
import { RoomFilterEnum } from "../types/room-filter";

interface UseRoomsManagementProps {
  userId: string;
}

interface RoomsPaginatedResponse {
  rooms: Room[];
  hasMore: boolean;
  nextCursor: string | null;
}

export function useRoomsManagement({ userId }: UseRoomsManagementProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef<boolean>(false);

  cursorRef.current = cursor;
  hasMoreRef.current = hasMore;

  const fetchRooms = useCallback(async (query = "", isNewSearch = false) => {
    if (loadingRef.current) return;

    try {
      loadingRef.current = true;

      if (isNewSearch) {
        setLoading(true);
        setCursor(null);
        cursorRef.current = null;
      } else {
        setLoadingMore(true);
      }

      const params: any = {
        roomFilter: RoomFilterEnum.ONLY_JOINED,
        limit: 20,
      };

      if (query.trim() !== "") {
        params.search = query;
      }

      if (!isNewSearch && cursorRef.current) {
        params.cursor = cursorRef.current;
      }

      const res = await api.get("/rooms", { params });

      const data: RoomsPaginatedResponse = res.data.rooms
        ? res.data
        : { rooms: res.data, hasMore: false, nextCursor: null };

      if (isNewSearch) {
        setRooms(data.rooms);
      } else {
        setRooms((prev) => {
          const existingIds = new Set(prev.map((r) => r.id));
          const newRooms = data.rooms.filter(
            (room) => !existingIds.has(room.id)
          );
          return [...prev, ...newRooms];
        });
      }

      setHasMore(data.hasMore);
      setCursor(data.nextCursor);

      const unreadFromServer = data.rooms.reduce(
        (acc: Record<string, number>, room: Room) => {
          if (room.unreadCount > 0) {
            acc[room.id] = room.unreadCount;
          }
          return acc;
        },
        {} as Record<string, number>
      );

      if (isNewSearch) {
        setUnread(unreadFromServer);
      } else {
        setUnread((prev) => ({ ...prev, ...unreadFromServer }));
      }
    } catch (err: any) {
      toaster.create({
        title: "Erro ao carregar salas",
        description: err?.response?.data?.message || "Erro inesperado.",
        type: "error",
      });
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const searchRooms = useCallback((query: string) => {
    fetchRooms(query, true);
  }, []);

  const fetchRoomsRef = useRef(fetchRooms);
  fetchRoomsRef.current = fetchRooms;

  const stableLoadMoreRooms = useCallback(() => {
    if (hasMoreRef.current && !loadingMore && !loadingRef.current) {
      fetchRoomsRef.current("", false);
    }
  }, [loadingMore]);

  const handleJoinRoom = async (roomId: string) => {
    if (!userId) return;

    try {
      await api.post(`/rooms/${roomId}/join`, { userId });

      await fetchRooms("", true);

      toaster.create({
        title: "Você entrou na sala",
        type: "success",
      });

      return roomId;
    } catch (err: any) {
      toaster.create({
        title: "Erro ao entrar na sala",
        description: err?.response?.data?.message || "Erro inesperado.",
        type: "error",
      });
    }
  };

  const handleLeaveRoom = async (roomId: string) => {
    if (!userId) return;

    try {
      await api.post(`/rooms/${roomId}/leave`, { userId });

      setRooms((prev) => prev.filter((room) => room.id !== roomId));

      toaster.create({
        title: "Você saiu da sala",
        type: "info",
      });

      return true;
    } catch (err: any) {
      toaster.create({
        title: "Erro ao sair da sala",
        description: err?.response?.data?.message || "Erro inesperado.",
        type: "error",
      });
      return false;
    }
  };

  const addNewRoom = useCallback((room: Room) => {
    if (room.userId === userId) {
      setRooms((prev) => {
        const exists = prev.some((r) => r.id === room.id);
        return exists ? prev : [room, ...prev];
      });
    }
  }, []);

  const incrementUnread = useCallback((roomId: string) => {
    setUnread((prev) => ({
      ...prev,
      [roomId]: (prev[roomId] || 0) + 1,
    }));
  }, []);

  const clearUnread = useCallback((roomId: string) => {
    setUnread((prev) => {
      const updated = { ...prev };
      delete updated[roomId];
      return updated;
    });
  }, []);

  useEffect(() => {
    fetchRooms("", true);
  }, []);

  return {
    rooms,
    loading,
    loadingMore,
    unread,
    hasMore,
    fetchRooms,
    stableLoadMoreRooms,
    handleJoinRoom,
    handleLeaveRoom,
    addNewRoom,
    incrementUnread,
    clearUnread,
    searchRooms,
  };
}
