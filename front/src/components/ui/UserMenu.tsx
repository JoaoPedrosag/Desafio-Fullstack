import {
  Menu,
  Portal,
  IconButton,
  Avatar,
  Text,
  HStack,
  useBreakpointValue,
} from "@chakra-ui/react";
import {
  LuUser,
  LuLogOut,
  LuMoon,
  LuSun,
  LuMenu,
  LuUsers,
} from "react-icons/lu";
import { useUserMenu } from "../../hooks/use-user-menu";

export function UserMenu() {
  const { user, theme, isLoading, shouldShowMembers, actions } = useUserMenu();
  const isMobile = useBreakpointValue({ base: true, md: false });

  if (!user) return null;

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <IconButton
          variant="ghost"
          aria-label="Menu do usuário"
          size="sm"
          _hover={{
            bg: "brand.50",
            _dark: { bg: "brand.900/20" },
            transform: "scale(1.02)",
          }}
          transition="all 0.2s ease"
          borderRadius="lg"
        >
          <HStack gap={2}>
            <Avatar.Root size="sm" variant="solid" colorPalette="brand">
              <Avatar.Fallback name={user.username} />
            </Avatar.Root>
            {!isMobile && (
              <Text fontSize="sm" fontWeight="medium">
                {user.username}
              </Text>
            )}
          </HStack>
        </IconButton>
      </Menu.Trigger>

      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="200px">
            <Menu.Item
              value="profile"
              onClick={actions.handleProfile}
              cursor="pointer"
              _hover={{ bg: "gray.100", _dark: { bg: "gray.700" } }}
            >
              <LuUser />
              Perfil
            </Menu.Item>

            <Menu.Item
              value="theme"
              onClick={actions.toggleColorMode}
              cursor="pointer"
              _hover={{ bg: "gray.100", _dark: { bg: "gray.700" } }}
            >
              {theme === "light" ? <LuMoon /> : <LuSun />}
              {theme === "light" ? "Modo escuro" : "Modo claro"}
            </Menu.Item>

            {isMobile && (
              <>
                <Menu.Separator />
                <Menu.Item
                  value="rooms"
                  onClick={actions.handleRooms}
                  cursor="pointer"
                  _hover={{ bg: "gray.100", _dark: { bg: "gray.700" } }}
                >
                  <LuMenu />
                  Salas
                </Menu.Item>
                {shouldShowMembers && (
                  <Menu.Item
                    value="members"
                    onClick={actions.handleMembers}
                    cursor="pointer"
                    _hover={{ bg: "gray.100", _dark: { bg: "gray.700" } }}
                  >
                    <LuUsers />
                    Membros
                  </Menu.Item>
                )}
              </>
            )}

            <Menu.Separator />
            <Menu.Item
              value="logout"
              onClick={actions.handleLogout}
              disabled={isLoading}
              color="red.500"
              cursor="pointer"
              _hover={{
                bg: isLoading ? "transparent" : "red.50",
                _dark: { bg: isLoading ? "transparent" : "red.900/20" },
              }}
            >
              <LuLogOut />
              {isLoading ? "Saindo..." : "Sair"}
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
