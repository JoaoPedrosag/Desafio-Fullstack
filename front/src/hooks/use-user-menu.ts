import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { useBreakpointValue } from "@chakra-ui/react";
import { useAuthStore } from "../store/auth-store";
import { useAppStateStore } from "../store/app-state-store";
import { useRoomStore } from "../store/room-store";
import { api } from "../services/api";

export function useUserMenu() {
  const { user, logout } = useAuthStore();
  const { toggleRoomsDrawer, toggleMembersDrawer } = useAppStateStore();
  const { isInChatRoom } = useRoomStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useBreakpointValue({ base: true, md: false });

  const isOnRoomsPage = location.pathname === "/rooms";
  const shouldShowMembers = isOnRoomsPage && isInChatRoom();

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await api.post("/auth/logout");
    } catch (e) {
      console.error("Erro ao deslogar", e);
    } finally {
      setIsLoading(false);
      logout();
      navigate("/login");
    }
  };

  const toggleColorMode = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  const handleRooms = () => {
    if (isOnRoomsPage) {
      if (isMobile) {
        toggleRoomsDrawer();
      }
    } else {
      navigate("/rooms");
      if (isMobile) {
        setTimeout(() => {
          toggleRoomsDrawer(true);
        }, 100);
      }
    }
  };

  const handleMembers = () => {
    toggleMembersDrawer();
  };

  return {
    user,
    theme,
    isLoading,
    shouldShowMembers,
    actions: {
      handleLogout,
      toggleColorMode,
      handleProfile,
      handleRooms,
      handleMembers,
    },
  };
}
