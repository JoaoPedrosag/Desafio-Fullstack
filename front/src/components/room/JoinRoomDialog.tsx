import {
  Dialog,
  Portal,
  DialogBackdrop,
  DialogPositioner,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogCloseTrigger,
  Input,
  VStack,
  Text,
  Flex,
  CloseButton,
  Spinner,
} from "@chakra-ui/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../../services/api";
import { toaster } from "../ui/Toaster";
import { RoomFilterEnum } from "../../types/room-filter";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onJoinRoom: (roomId: string) => Promise<void>;
};

interface RoomsPaginatedResponse {
  rooms: Room[];
  hasMore: boolean;
  nextCursor: string | null;
}

export function JoinRoomDialog({ isOpen, onClose, onJoinRoom }: Props) {
  const [search, setSearch] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setSearch("");
    setRooms([]);
    setCursor(null);
    setHasMore(false);
    setLoading(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    fetchRooms("");

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      setRooms([]);
      setCursor(null);
      setHasMore(false);
      setLoading(true);
      fetchRooms(search);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  const fetchRooms = useCallback(
    async (searchValue = "") => {
      try {
        if (rooms.length === 0) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const params: any = {
          roomFilter: RoomFilterEnum.ONLY_NOT_JOINED,
          limit: 20,
        };

        if (searchValue.trim() !== "") {
          params.search = searchValue;
        }

        if (cursor) {
          params.cursor = cursor;
        }

        const response = await api.get("/rooms", { params });

        const data: RoomsPaginatedResponse = response.data.rooms
          ? response.data
          : { rooms: response.data, hasMore: false, nextCursor: null };

        const filteredRooms = data.rooms;

        setRooms((prev) => {
          if (searchValue !== search) {
            return filteredRooms;
          } else {
            const existingIds = new Set(prev.map((room) => room.id));
            const newRooms = filteredRooms.filter(
              (room) => !existingIds.has(room.id)
            );
            return [...prev, ...newRooms];
          }
        });

        setHasMore(data.hasMore);
        setCursor(data.nextCursor);
      } catch (error) {
        toaster.create({
          title: "Erro ao buscar salas",
          type: "error",
        });
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [cursor, rooms.length, search]
  );

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

      if (
        scrollHeight - scrollTop <= clientHeight + 50 &&
        hasMore &&
        !loadingMore
      ) {
        fetchRooms(search);
      }
    },
    [hasMore, loadingMore, fetchRooms, search]
  );

  const handleJoinRoom = async (roomId: string) => {
    try {
      setJoiningRoom(roomId);
      await onJoinRoom(roomId);
      onClose();
    } catch (error) {
      toaster.create({
        title: "Erro ao entrar na sala",
        type: "error",
      });
    } finally {
      setJoiningRoom(null);
    }
  };

  return (
    <Dialog.Root
      lazyMount
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
    >
      <Portal>
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent
            maxH={{ base: "90vh", md: "600px" }}
            maxW={{ base: "95vw", md: "500px" }}
            mx={{ base: "2", md: "auto" }}
            overflow="hidden"
          >
            <DialogHeader>
              <DialogTitle>Entrar em uma sala</DialogTitle>
            </DialogHeader>
            <DialogBody p={{ base: "3", md: "4" }}>
              <VStack gap={4} h={{ base: "70vh", md: "500px" }} w="full">
                <Input
                  placeholder="Buscar salas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <Flex
                  direction="column"
                  w="full"
                  flex={1}
                  overflowY="auto"
                  overflowX="hidden"
                  ref={scrollContainerRef}
                  onScroll={handleScroll}
                  gap={{ base: 3, md: 2 }}
                  px={{ base: "1", md: "0" }}
                >
                  {loading ? (
                    <Flex justify="center" py={4}>
                      <Spinner />
                    </Flex>
                  ) : rooms.length === 0 ? (
                    <Text textAlign="center" py={4}>
                      Nenhuma sala encontrada
                    </Text>
                  ) : (
                    <>
                      {rooms.map((room) => (
                        <Flex
                          key={room.id}
                          w="full"
                          justify="space-between"
                          align="center"
                          p={{ base: 4, md: 3 }}
                          borderWidth={1}
                          borderRadius="md"
                          flexShrink={0}
                          cursor="pointer"
                          bg={joiningRoom === room.id ? "gray.50" : "white"}
                          borderColor={
                            joiningRoom === room.id ? "brand.300" : "gray.200"
                          }
                          _dark={{
                            bg:
                              joiningRoom === room.id ? "gray.700" : "gray.800",
                            borderColor:
                              joiningRoom === room.id
                                ? "brand.500"
                                : "gray.600",
                          }}
                          _hover={{
                            bg:
                              joiningRoom === room.id ? "gray.50" : "brand.50",
                            borderColor: "brand.300",
                            _dark: {
                              bg:
                                joiningRoom === room.id
                                  ? "gray.700"
                                  : "gray.700",
                              borderColor: "brand.400",
                            },
                          }}
                          _active={{
                            bg: "gray.100",
                            _dark: { bg: "gray.600" },
                          }}
                          opacity={joiningRoom === room.id ? 0.7 : 1}
                          onClick={() => handleJoinRoom(room.id)}
                          transition="all 0.2s ease"
                          shadow="sm"
                          _focus={{
                            outline: "2px solid",
                            outlineColor: "brand.500",
                            outlineOffset: "2px",
                          }}
                        >
                          <Text
                            fontWeight="medium"
                            color={
                              joiningRoom === room.id ? "gray.600" : "gray.900"
                            }
                            _dark={{
                              color:
                                joiningRoom === room.id
                                  ? "gray.300"
                                  : "gray.100",
                            }}
                          >
                            {room.name}
                          </Text>
                          {joiningRoom === room.id && (
                            <Spinner size="sm" color="brand.500" />
                          )}
                        </Flex>
                      ))}

                      {loadingMore && (
                        <Flex justify="center" py={2}>
                          <Spinner size="sm" />
                        </Flex>
                      )}

                      {!hasMore && rooms.length > 0 && (
                        <Text
                          textAlign="center"
                          fontSize="sm"
                          color="gray.500"
                          py={2}
                        >
                          Todas as salas foram carregadas
                        </Text>
                      )}
                    </>
                  )}
                </Flex>
              </VStack>
            </DialogBody>
            <DialogCloseTrigger asChild>
              <CloseButton size="sm" />
            </DialogCloseTrigger>
          </DialogContent>
        </DialogPositioner>
      </Portal>
    </Dialog.Root>
  );
}
