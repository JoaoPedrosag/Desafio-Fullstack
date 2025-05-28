import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth-store";
import { api } from "../../services/api";
import { useState } from "react";

import { IconButton } from "@chakra-ui/react";
import { TbLogout } from "react-icons/tb";

export function LogoutButton() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      setIsLoading(true);
    } catch (e) {
      console.error("Erro ao deslogar", e);
    } finally {
      setIsLoading(false);
      logout();
      navigate("/login");
    }
  };

  return (
    <IconButton loading={isLoading} onClick={handleLogout}>
      <TbLogout />
    </IconButton>
  );
}
