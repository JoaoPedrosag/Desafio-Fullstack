import {
  Portal,
  Input,
  VStack,
  Flex,
  CloseButton,
  Drawer,
  Box,
} from "@chakra-ui/react";
import { useCallback } from "react";
import { RoomsList } from "../ui/RoomsList";
import { InfinityButton } from "../ui/InfinityButton";

type RoomDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  search: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  rooms: Room[];
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onLeaveRoom: (roomId: string) => void;
  unread: Record<string, number>;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  stableLoadMoreRooms: () => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
};

export function RoomDrawer({
  isOpen,
  onClose,
  search,
  onSearchChange,
  rooms,
  selectedRoomId,
  onSelectRoom,
  onLeaveRoom,
  unread,
  loading,
  loadingMore,
  hasMore,
  stableLoadMoreRooms,
  onCreateRoom,
  onJoinRoom,
}: RoomDrawerProps) {
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      const isAtBottom = scrollHeight - scrollTop === clientHeight;

      if (isAtBottom && hasMore && !loadingMore) {
        stableLoadMoreRooms();
      }
    },
    [hasMore, loadingMore, stableLoadMoreRooms]
  );

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
      placement="start"
    >
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content maxW="320px">
            <Drawer.Header>
              <Drawer.Title>Salas</Drawer.Title>
            </Drawer.Header>
            <Drawer.Body>
              <VStack gap={4} align="stretch" h="100%">
                <Input
                  placeholder="Buscar minhas salas"
                  value={search}
                  onChange={onSearchChange}
                />

                <Flex gap="2">
                  <InfinityButton
                    size="sm"
                    onClick={onCreateRoom}
                    flex="1"
                    isLoading={loading}
                  >
                    Criar sala
                  </InfinityButton>
                  <InfinityButton size="sm" onClick={onJoinRoom} flex="1">
                    Entrar
                  </InfinityButton>
                </Flex>

                <Box flex="1" overflowY="auto" onScroll={handleScroll}>
                  <RoomsList
                    title="Minhas salas"
                    rooms={rooms}
                    selectedRoomId={selectedRoomId}
                    onSelectRoom={onSelectRoom}
                    onLeaveRoom={onLeaveRoom}
                    unread={unread}
                    loadingMore={loadingMore}
                  />
                </Box>
              </VStack>
            </Drawer.Body>
            <Drawer.CloseTrigger asChild>
              <CloseButton size="sm" position="absolute" top="4" right="4" />
            </Drawer.CloseTrigger>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}
