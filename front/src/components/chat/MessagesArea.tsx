import { Box, Spinner } from "@chakra-ui/react";
import { MessageItem } from "./MessageItem";

interface MessagesAreaProps {
  messages: Message[];
  loadingMore: boolean;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  messageEndRef: React.RefObject<HTMLDivElement | null>;
  userId: string;
  editingMessageId: string | null;
  editContent: string;
  onChangeEdit: (content: string) => void;
  onStartEdit: (messageId: string, content: string) => void;
  onCancelEdit: () => void;
  onConfirmEdit: (messageId: string, newContent: string) => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
}

export function MessagesArea({
  messages,
  loadingMore,
  messagesContainerRef,
  messageEndRef,
  userId,
  editingMessageId,
  editContent,
  onChangeEdit,
  onStartEdit,
  onCancelEdit,
  onConfirmEdit,
  onDeleteMessage,
}: MessagesAreaProps) {
  return (
    <Box
      flex="1"
      overflowY="auto"
      borderWidth={{ base: 0, md: "1px" }}
      p={{ base: 4, md: 6 }}
      rounded="md"
      maxH="none"
      h="full"
      ref={messagesContainerRef}
      css={{
        "&::-webkit-scrollbar": {
          width: "4px",
        },
        "&::-webkit-scrollbar-track": {
          width: "6px",
        },
        "&::-webkit-scrollbar-thumb": {
          background: "gray.300",
          borderRadius: "24px",
        },
      }}
    >
      {loadingMore && (
        <Box textAlign="center" py="2">
          <Spinner size="sm" />
        </Box>
      )}

      {messages.map((msg) => (
        <MessageItem
          key={msg.id}
          msg={msg}
          isMine={msg.user.id === userId}
          isEditing={editingMessageId === msg.id}
          editContent={editContent}
          onChangeEdit={onChangeEdit}
          onStartEdit={() => onStartEdit(msg.id, msg.content)}
          onCancelEdit={onCancelEdit}
          onConfirmEdit={async (newText) => onConfirmEdit(msg.id, newText)}
          onDelete={async () => onDeleteMessage(msg.id)}
        />
      ))}

      <div ref={messageEndRef} />
    </Box>
  );
}
