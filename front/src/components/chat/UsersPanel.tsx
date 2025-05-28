import { VStack, useBreakpointValue } from "@chakra-ui/react";
import { UserList } from "./UserList";
import { UserDrawer } from "./UserDrawer";
import { useAppStateStore } from "../../store/app-state-store";

interface UsersPanelProps {
  onlineUsers: User[];
  offlineUsers: User[];
  userId: string;
  typingUsers: Record<string, number>;
}

export function UsersPanel({
  onlineUsers,
  offlineUsers,
  userId,
  typingUsers,
}: UsersPanelProps) {
  const { isMembersDrawerOpen, toggleMembersDrawer } = useAppStateStore();
  const isMobile = useBreakpointValue({ base: true, md: false });

  if (isMobile) {
    return (
      <UserDrawer
        isOpen={isMembersDrawerOpen}
        onClose={() => toggleMembersDrawer(false)}
        onlineUsers={onlineUsers}
        offlineUsers={offlineUsers}
        userId={userId}
        typingUsers={typingUsers}
      />
    );
  }

  return (
    <VStack
      w="240px"
      p="3"
      align="stretch"
      gap="3"
      overflowY="auto"
      borderLeftWidth="1px"
      h="full"
    >
      <UserList
        title="Online"
        users={onlineUsers}
        userId={userId}
        color="green.500"
        typingUsers={typingUsers}
      />

      <UserList
        title="Offline"
        users={offlineUsers}
        userId={userId}
        color="gray.400"
      />
    </VStack>
  );
}
