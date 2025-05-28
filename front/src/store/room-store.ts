import { create } from "zustand";

interface RoomStore {
  selectedRoomId: string | null;
  setSelectedRoomId: (roomId: string | null) => void;
  clearSelectedRoom: () => void;
  isInChatRoom: () => boolean;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  selectedRoomId: null,

  setSelectedRoomId: (roomId: string | null) => {
    set({ selectedRoomId: roomId });
  },

  clearSelectedRoom: () => {
    set({ selectedRoomId: null });
  },

  isInChatRoom: () => {
    return get().selectedRoomId !== null;
  },
}));
