import {
  Box,
  Flex,
  useBreakpointValue,
  VStack,
  Text,
  Icon,
} from "@chakra-ui/react";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../store/auth-store";
import {
  CreateRoomDialog,
  JoinRoomDialog,
  ChatRoom,
  RoomDrawer,
} from "../components/room";
import { RoomsSidebar } from "../components/room/RoomsSidebar";
import { useRoomSocket } from "../hooks/use-room-socket";
import { useAppStateStore } from "../store/app-state-store";
import { useRoomsManagement } from "../hooks/use-rooms-management";
import { useSearchDebounce } from "../hooks/use-search-debounce";
import { useRoomStore } from "../store/room-store";
import { HiChatBubbleLeftRight } from "react-icons/hi2";

export default function Room() {
  const selectedRoomIdRef = useRef<string | null>(null);
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? "";
  const { isRoomsDrawerOpen, toggleRoomsDrawer } = useAppStateStore();
  const { selectedRoomId, setSelectedRoomId, clearSelectedRoom } =
    useRoomStore();

  const isMobile = useBreakpointValue({ base: true, md: false });

  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [joinRoomOpen, setJoinRoomOpen] = useState(false);

  const {
    rooms,
    loading,
    loadingMore,
    unread,
    hasMore,
    stableLoadMoreRooms,
    handleJoinRoom,
    handleLeaveRoom,
    addNewRoom,
    incrementUnread,
    clearUnread,
    searchRooms,
  } = useRoomsManagement({ userId });

  const { search, handleSearchChange } = useSearchDebounce({
    onSearch: searchRooms,
  });

  useEffect(() => {
    selectedRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);

  useEffect(() => {
    return () => {
      clearSelectedRoom();
    };
  }, [clearSelectedRoom]);

  useRoomSocket({
    selectedRoomId,
    onNewRoom: addNewRoom,
    onRoomNotification: incrementUnread,
  });

  const handleRoomClick = async (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    setSelectedRoomId(roomId);
    clearUnread(roomId);

    if (isMobile && isRoomsDrawerOpen) {
      toggleRoomsDrawer(false);
    }
  };

  const handleJoinRoomAndSelect = async (roomId: string) => {
    const result = await handleJoinRoom(roomId);
    if (result) {
      setSelectedRoomId(roomId);

      if (isMobile && isRoomsDrawerOpen) {
        toggleRoomsDrawer(false);
      }
    }
  };

  const handleLeaveRoomAndDeselect = async (roomId: string) => {
    const success = await handleLeaveRoom(roomId);
    if (success && selectedRoomId === roomId) {
      setSelectedRoomId(null);
    }
    return success;
  };

  return (
    <>
      <Flex h="calc(100vh - 80px)">
        {isMobile ? (
          <RoomDrawer
            isOpen={isRoomsDrawerOpen}
            onClose={() => toggleRoomsDrawer(false)}
            search={search}
            onSearchChange={handleSearchChange}
            rooms={rooms}
            selectedRoomId={selectedRoomId}
            onSelectRoom={handleRoomClick}
            onLeaveRoom={handleLeaveRoomAndDeselect}
            unread={unread}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            stableLoadMoreRooms={stableLoadMoreRooms}
            onCreateRoom={() => setCreateRoomOpen(true)}
            onJoinRoom={() => setJoinRoomOpen(true)}
          />
        ) : (
          <RoomsSidebar
            search={search}
            onSearchChange={handleSearchChange}
            rooms={rooms}
            selectedRoomId={selectedRoomId}
            onSelectRoom={handleRoomClick}
            onLeaveRoom={handleLeaveRoomAndDeselect}
            unread={unread}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            stableLoadMoreRooms={stableLoadMoreRooms}
            onCreateRoom={() => setCreateRoomOpen(true)}
            onJoinRoom={() => setJoinRoomOpen(true)}
          />
        )}

        <Box flex="1" px={{ base: 4, md: 6 }}>
          {selectedRoomId ? (
            <ChatRoom roomId={selectedRoomId} />
          ) : (
            <Flex align="center" justify="center" h="100%" direction="column">
              <VStack
                gap={6}
                textAlign="center"
                maxW="400px"
                px={8}
                py={12}
                borderRadius="xl"
                bg="gray.50"
                _dark={{ bg: "gray.800" }}
                borderWidth={2}
                borderColor="gray.200"
                borderStyle="dashed"
              >
                <Box
                  p={6}
                  borderRadius="full"
                  bg="brand.100"
                  _dark={{ bg: "brand.900" }}
                >
                  <Icon
                    as={HiChatBubbleLeftRight}
                    w={12}
                    h={12}
                    color="brand.500"
                  />
                </Box>

                <VStack gap={2}>
                  <Text
                    fontSize="xl"
                    fontWeight="bold"
                    color="gray.700"
                    _dark={{ color: "gray.200" }}
                  >
                    Bem-vindo ao Chat!
                  </Text>
                  <Text
                    fontSize="md"
                    color="gray.500"
                    _dark={{ color: "gray.400" }}
                    lineHeight="1.6"
                  >
                    Selecione uma sala da lista{" "}
                    {isMobile ? "no menu" : "ao lado"} para começar a conversar
                    ou crie uma nova sala.
                  </Text>
                </VStack>

                <VStack
                  gap={1}
                  fontSize="sm"
                  color="gray.400"
                  _dark={{ color: "gray.500" }}
                >
                  <Text>💬 Converse em tempo real</Text>
                  <Text>👥 Participe de várias salas</Text>
                  <Text>🔔 Receba notificações</Text>
                </VStack>
              </VStack>
            </Flex>
          )}
        </Box>
      </Flex>

      <CreateRoomDialog
        isOpen={createRoomOpen}
        onClose={() => setCreateRoomOpen(false)}
      />
      <JoinRoomDialog
        isOpen={joinRoomOpen}
        onClose={() => setJoinRoomOpen(false)}
        onJoinRoom={handleJoinRoomAndSelect}
      />
    </>
  );
}
