import { create } from "zustand";

type AppStateStore = {
  isMembersDrawerOpen: boolean;
  isRoomsDrawerOpen: boolean;
  toggleMembersDrawer: (force?: boolean) => void;
  toggleRoomsDrawer: (force?: boolean) => void;
};

export const useAppStateStore = create<AppStateStore>((set) => ({
  isRoomsDrawerOpen: false,
  isMembersDrawerOpen: false,
  toggleMembersDrawer: (force?: boolean) =>
    set((state) => ({
      isMembersDrawerOpen: force ?? !state.isMembersDrawerOpen,
    })),
  toggleRoomsDrawer: (force?: boolean) =>
    set((state) => ({ isRoomsDrawerOpen: force ?? !state.isRoomsDrawerOpen })),
}));
