import {
  Drawer,
  Portal,
  DrawerBackdrop,
  DrawerPositioner,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
  DrawerCloseTrigger,
  CloseButton,
  Box,
} from "@chakra-ui/react";
import { UserList } from "../chat/UserList";

type UserDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  onlineUsers: User[];
  offlineUsers: User[];
  userId: string;
  typingUsers: Record<string, number>;
};

export function UserDrawer({
  isOpen,
  onClose,
  onlineUsers,
  offlineUsers,
  userId,
  typingUsers,
}: UserDrawerProps) {
  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
      placement="end"
    >
      <Portal>
        <DrawerBackdrop />
        <DrawerPositioner>
          <DrawerContent maxW="300px">
            <DrawerHeader>
              <DrawerTitle>Usuários</DrawerTitle>
            </DrawerHeader>

            <DrawerBody>
              {onlineUsers.length > 0 && (
                <Box marginBottom="24px">
                  <UserList
                    title="Online"
                    users={onlineUsers}
                    userId={userId}
                    color="green.400"
                    typingUsers={typingUsers}
                  />
                </Box>
              )}

              <Box>
                <UserList
                  title="Offline"
                  users={offlineUsers}
                  userId={userId}
                  color="gray.400"
                  typingUsers={typingUsers}
                />
              </Box>
            </DrawerBody>

            <DrawerCloseTrigger asChild>
              <CloseButton size="sm" position="absolute" top="4" right="4" />
            </DrawerCloseTrigger>
          </DrawerContent>
        </DrawerPositioner>
      </Portal>
    </Drawer.Root>
  );
}
