import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "./api";

let socket: Socket | null = null;
let authedUserId: string | null = null;

/**
 * Single shared Socket.IO client, authenticated with the Clerk JWT.
 * Call once per signed-in user; reuses the connection on re-renders.
 * Pass getToken from useAuth(): () => getToken().
 */
export function getSocket(
  getToken: () => Promise<string | null>,
  userId: string
): Socket {
  if (socket && authedUserId === userId && socket.connected) return socket;

  // Drop any stale connection (e.g. user switched accounts)
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    authedUserId = null;
  }

  socket = io(API_BASE_URL, {
    transports: ["websocket", "polling"],
    withCredentials: true,
    auth: async (cb) => {
      try {
        const token = await getToken();
        cb({ token });
      } catch {
        cb({ token: null });
      }
    },
  });

  authedUserId = userId;

  socket.on("connect", () => {
    socket?.emit("join_room", userId); // server rejects non-self rooms
  });

  return socket;
}

export function disconnectSocket() {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
  authedUserId = null;
}
