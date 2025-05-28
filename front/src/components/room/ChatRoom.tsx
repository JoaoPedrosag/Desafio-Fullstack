import { Flex, VStack, useBreakpointValue } from "@chakra-ui/react";
import { useChatRoom } from "../../hooks/use-chat-room";
import { MessagesArea } from "../chat/MessagesArea";
import { MessageInput } from "../chat/MessageInput";
import { UsersPanel } from "../chat/UsersPanel";

type ChatRoomProps = {
  roomId: string;
};

export default function ChatRoom({ roomId }: ChatRoomProps) {
  const {
    userId,
    messages,
    loadingMore,
    messageEndRef,
    messagesContainerRef,
    editingMessageId,
    editContent,
    setEditContent,
    startEditing,
    cancelEditing,
    editMessage,
    deleteMessage,
    onlineUsers,
    offlineUsers,
    typingUsers,
  } = useChatRoom({ roomId });

  const direction = useBreakpointValue({ base: "column", md: "row" });

  return (
    <Flex h="calc(100vh - 80px)" direction={direction}>
      <VStack
        flex="1"
        margin="0"
        p={{ base: 0, md: 4 }}
        gap={2}
        align="stretch"
        h="full"
        position="relative"
      >
        <MessagesArea
          messages={messages}
          loadingMore={loadingMore}
          messagesContainerRef={messagesContainerRef}
          messageEndRef={messageEndRef}
          userId={userId}
          editingMessageId={editingMessageId}
          editContent={editContent}
          onChangeEdit={setEditContent}
          onStartEdit={startEditing}
          onCancelEdit={cancelEditing}
          onConfirmEdit={editMessage}
          onDeleteMessage={deleteMessage}
        />

        <MessageInput roomId={roomId} userId={userId} />
      </VStack>

      <UsersPanel
        onlineUsers={onlineUsers}
        offlineUsers={offlineUsers}
        userId={userId}
        typingUsers={typingUsers}
      />
    </Flex>
  );
}
