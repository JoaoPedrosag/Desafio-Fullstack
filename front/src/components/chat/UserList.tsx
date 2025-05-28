import {
  Text,
  HStack,
  Avatar,
  Float,
  Circle,
  VStack,
  Box,
} from "@chakra-ui/react";

type UserListProps = {
  title: string;
  users: User[];
  userId: string;
  color: string;
  typingUsers?: Record<string, number>;
};

export function UserList({
  title,
  users,
  userId,
  color,
  typingUsers,
}: UserListProps) {
  return (
    <>
      <Text
        fontSize="sm"
        fontWeight="bold"
        marginBottom="12px"
        color="gray.500"
      >
        {title} — {users.length}
      </Text>

      <VStack gap="3" align="start" width="100%">
        {users.map((user) => {
          const isTyping = typingUsers ? typingUsers[user.userId] : false;
          return (
            <HStack key={user.userId} gap="3">
              <Avatar.Root size="md" variant="solid" colorPalette="gray">
                <Avatar.Fallback name={user.username} />
                <Float placement="bottom-end" offsetX="1" offsetY="1.5">
                  <Circle
                    bg={color}
                    size="14px"
                    outline="2px solid"
                    outlineColor="white"
                  />
                </Float>
              </Avatar.Root>
              <Box display="block">
                <HStack gap="2">
                  <Text fontSize="sm" fontWeight="medium">
                    {user.username}
                  </Text>
                  <Text fontSize="xs">
                    {user.userId === userId ? "(Você)" : ""}
                  </Text>
                </HStack>
                {isTyping && user.userId !== userId && (
                  <Text fontSize="xs" color="gray.500">
                    Digitando...
                  </Text>
                )}
              </Box>
            </HStack>
          );
        })}
      </VStack>
    </>
  );
}
