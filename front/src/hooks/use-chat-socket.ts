import { useEffect } from "react";
import { getSocket } from "../services/socket";
import { SOCKET_EVENTS } from "../constants/socket-event";

export function useChatSocket({
  roomId,
  userId,
  onNewMessage,
  onMessageEdited,
  onMessageDeleted,
  onOnlineUsers,
  onUserTyping,
}: {
  roomId: string;
  userId: string;
  onNewMessage: (msg: Message) => void;
  onMessageEdited: (msg: Message) => void;
  onMessageDeleted: (data: { id: string }) => void;
  onOnlineUsers: (users: any[]) => void;
  onUserTyping: (userId: string) => void;
}) {
  useEffect(() => {
    if (!roomId || !userId) return;

    const socket = getSocket();
    if (!socket) return;

    socket.emit(SOCKET_EVENTS.JOIN_ROOM, roomId);

    socket.on(SOCKET_EVENTS.NEW_MESSAGE, onNewMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_EDITED, onMessageEdited);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, onMessageDeleted);
    socket.on(SOCKET_EVENTS.ONLINE_USERS, onOnlineUsers);

    socket.on(SOCKET_EVENTS.USER_IS_TYPING, ({ userId }) => {
      onUserTyping(userId);
    });
    return () => {
      socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId });
      socket.off(SOCKET_EVENTS.NEW_MESSAGE, onNewMessage);
      socket.off(SOCKET_EVENTS.MESSAGE_EDITED, onMessageEdited);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED, onMessageDeleted);
      socket.off(SOCKET_EVENTS.ONLINE_USERS, onOnlineUsers);
      socket.off(SOCKET_EVENTS.USER_IS_TYPING, onUserTyping);
    };
  }, [roomId, userId]);
}
