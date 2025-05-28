import { useEffect, useRef } from "react";
import { getSocket } from "../services/socket";
import { SOCKET_EVENTS } from "../constants/socket-event";

export function useRoomSocket({
  selectedRoomId,
  onNewRoom,
  onRoomNotification,
}: {
  selectedRoomId: string | null;
  onNewRoom: (room: any) => void;
  onRoomNotification: (roomId: string) => void;
}) {
  const selectedRoomIdRef = useRef<string | null>(selectedRoomId);

  useEffect(() => {
    selectedRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on(SOCKET_EVENTS.NEW_ROOM, onNewRoom);

    socket.on(SOCKET_EVENTS.ROOM_NOTIFICATION, ({ roomId }) => {
      if (roomId !== selectedRoomIdRef.current) {
        onRoomNotification(roomId);
      }
    });

    return () => {
      socket.off(SOCKET_EVENTS.NEW_ROOM, onNewRoom);
      socket.off(SOCKET_EVENTS.ROOM_NOTIFICATION);
    };
  }, []);
}
