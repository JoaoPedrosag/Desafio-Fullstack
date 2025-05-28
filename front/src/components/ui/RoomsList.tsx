import {
  Box,
  Stack,
  Text,
  Flex,
  IconButton,
  Circle,
  Spinner,
} from "@chakra-ui/react";
import { IoExit } from "react-icons/io5";

type Props = {
  rooms: Room[];
  title?: string;
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onLeaveRoom: (roomId: string) => void;
  unread?: Record<string, number>;
  loadingMore?: boolean;
};

export function RoomsList({
  rooms,
  title,
  selectedRoomId,
  onSelectRoom,
  onLeaveRoom,
  unread = {},
  loadingMore = false,
}: Props) {
  if (rooms.length === 0) {
    return;
  }

  const truncateName = (name: string) => {
    if (name.length <= 10) return name;
    return name.slice(0, 10) + "...";
  };

  const getInitial = (name: string) => {
    const words = name.split(" ");

    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }

    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Box>
      {title && (
        <Text fontSize="sm" fontWeight="bold" mb="2" ml="1" color="gray.600">
          {title}
        </Text>
      )}

      <Stack gap="2">
        {rooms.map((room) => (
          <Flex
            key={room.id}
            px="3"
            py="2"
            rounded="md"
            align="center"
            justify="space-between"
            bg={room.id === selectedRoomId ? "brand.500" : "transparent"}
            color={room.id === selectedRoomId ? "white" : "inherit"}
            _hover={{ bg: "brand.300" }}
            transition="all 0.2s ease"
          >
            <Flex
              flex="1"
              gap="2"
              align="center"
              cursor="pointer"
              onClick={() => onSelectRoom(room.id)}
              _hover={{ transform: "scale(1.01)" }}
              transition="transform 0.1s ease"
            >
              <Circle
                size="32px"
                bg={room.id === selectedRoomId ? "white" : "brand.500"}
                color={room.id === selectedRoomId ? "brand.500" : "white"}
                fontSize="sm"
                fontWeight="bold"
              >
                {getInitial(room.name)}
              </Circle>

              <Box position="relative">
                <Text
                  maxWidth="160px"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                >
                  {truncateName(room.name)}
                </Text>

                {room.joined && unread?.[room.id] > 0 && (
                  <Box
                    position="absolute"
                    top="-2px"
                    right="-24px"
                    bg="red.500"
                    color="white"
                    fontSize="xs"
                    px="1.5"
                    py="0.5"
                    rounded="full"
                    minW="20px"
                    textAlign="center"
                    lineHeight="1"
                  >
                    {unread[room.id]}
                  </Box>
                )}
              </Box>
            </Flex>

            <IconButton
              size="xs"
              aria-label="Sair da sala"
              onClick={(e) => {
                e.stopPropagation();
                onLeaveRoom(room.id);
              }}
              variant="ghost"
              colorScheme="red"
              cursor="pointer"
              _hover={{
                bg: "red.100",
                _dark: { bg: "red.900/20" },
                transform: "scale(1.1)",
              }}
              transition="all 0.2s ease"
            >
              <IoExit size={16} />
            </IconButton>
          </Flex>
        ))}

        {loadingMore && (
          <Flex justify="center" py={2}>
            <Spinner size="sm" />
          </Flex>
        )}
      </Stack>
    </Box>
  );
}
