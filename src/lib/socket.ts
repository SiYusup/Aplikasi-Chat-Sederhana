import { io, type Socket } from 'socket.io-client';

// Singleton socket.io-client (T-16): satu koneksi, join ulang otomatis.
// Auth via handshake { token } — diverifikasi server (T-12).

let socket: Socket | null = null;
let lastRoomId: string | null = null;
let lastToken: string | null = null;

export function connectSocket(token: string): Socket {
  if (socket?.connected && lastToken === token) return socket;
  // Putuskan koneksi lama, tapi JANGAN lupa room terakhir (lastRoomId) —
  // join ulang di bawah bergantung padanya.
  socket?.removeAllListeners();
  socket?.disconnect();
  lastToken = token;
  socket = io({ auth: { token } });
  socket.on('connect', () => {
    if (lastRoomId) socket?.emit('global:join', { roomId: lastRoomId });
  });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function rememberRoom(roomId: string | null): void {
  lastRoomId = roomId;
}

export function disconnectSocket(): void {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
  lastToken = null;
  lastRoomId = null;
}
