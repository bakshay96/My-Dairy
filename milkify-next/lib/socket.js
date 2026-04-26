import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3030";

export const socket = io(SOCKET_URL, {
  autoConnect: false, // Connect manually after auth
  transports: ["websocket", "polling"],
});
