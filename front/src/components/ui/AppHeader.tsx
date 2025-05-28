import { Box, HStack, useBreakpointValue } from "@chakra-ui/react";
import { useAuthStore } from "../../store/auth-store";
import { useAppStateStore } from "../../store/app-state-store";
import { useEffect } from "react";
import { UserMenu } from "./UserMenu";

export function AppHeader() {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { toggleRoomsDrawer, toggleMembersDrawer } = useAppStateStore();

  useEffect(() => {
    if (!isMobile) {
      toggleRoomsDrawer(false);
      toggleMembersDrawer(false);
    }
  }, [isMobile]);

  return (
    <Box
      width="full"
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      height="80px"
      paddingX="16px"
      zIndex="1"
      borderBottom="1px solid"
      borderColor={{ _dark: "gray.700", _light: "gray.200" }}
      _dark={{ bg: "gray.900" }}
    >
      <Box>
        <Box as="span" fontSize="xl" fontWeight="bold" color="brand.500">
          ChatApp
        </Box>
      </Box>

      <HStack gap="3">{isAuthenticated && <UserMenu />}</HStack>
    </Box>
  );
}
