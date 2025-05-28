import { useAuthStore } from "../store/auth-store";
import { useChatSocket } from "./use-chat-socket";
import { useChatMessages } from "./use-chat-messages";
import { useChatUsers } from "./use-chat-users";

interface UseChatRoomProps {
  roomId: string;
}

export function useChatRoom({ roomId }: UseChatRoomProps) {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? "";

  const messagesHook = useChatMessages({ roomId, userId });

  const usersHook = useChatUsers({ roomId, userId });

  useChatSocket({
    roomId: roomId!,
    userId,
    onNewMessage: messagesHook.addMessage,
    onMessageEdited: messagesHook.updateMessage,
    onMessageDeleted: ({ id }) => messagesHook.deleteMessage(id),
    onOnlineUsers: usersHook.updateOnlineUsers,
    onUserTyping: usersHook.addTypingUser,
  });

  return {
    userId,
    messages: messagesHook.messages,
    loadingMore: messagesHook.loadingMore,
    messageEndRef: messagesHook.messageEndRef,
    messagesContainerRef: messagesHook.messagesContainerRef,
    editingMessageId: messagesHook.editingMessageId,
    editContent: messagesHook.editContent,
    setEditContent: messagesHook.setEditContent,
    startEditing: messagesHook.startEditing,
    cancelEditing: messagesHook.cancelEditing,
    editMessage: messagesHook.editMessage,
    deleteMessage: messagesHook.deleteMessageApi,
    onlineUsers: usersHook.onlineUsers,
    offlineUsers: usersHook.offlineUsers,
    typingUsers: usersHook.typingUsers,
  };
}
