import { Box, Heading, Input, Flex, VStack } from "@chakra-ui/react";
import { useCallback, useRef } from "react";
import { RoomsList } from "../ui/RoomsList";
import { InfinityButton } from "../ui/InfinityButton";

interface RoomsSidebarProps {
  search: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  rooms: Room[];
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onLeaveRoom: (roomId: string) => Promise<boolean | undefined>;
  unread: Record<string, number>;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  stableLoadMoreRooms: () => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export function RoomsSidebar({
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
}: RoomsSidebarProps) {
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
    <Box
      w="280px"
      borderRight="1px solid"
      borderColor="gray.200"
      _dark={{ borderColor: "gray.700" }}
      p="4"
      display="flex"
      flexDirection="column"
      h="100%"
    >
      <Heading size="md" mb="4">
        Salas
      </Heading>

      <Input
        placeholder="Buscar minhas salas"
        value={search}
        onChange={onSearchChange}
        mb="4"
      />

      <Flex gap="2" mb="4">
        <InfinityButton
          size="sm"
          isLoading={loading}
          onClick={onCreateRoom}
          flex="1"
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
    </Box>
  );
}
