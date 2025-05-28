import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const connectSocket = (): Socket => {
  if (!socket) {
    const baseURL = import.meta.env.VITE_API_BASE_URL;
    socket = io(baseURL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("✅ Socket conectado:", socket?.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket desconectado");
    });
  }

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
