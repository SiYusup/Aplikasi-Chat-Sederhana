import { randomBytes, randomUUID } from 'crypto';
import type { Socket } from 'socket.io';
import type { SocketAuth } from './index';

const MAX_BODY = 500;
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

interface Participant {
  clerkId: string;
  displayName: string;
}

interface PrivateRoom {
  creatorId: string;
  participants: Map<string, Participant>; // socketId -> participant
}

// In-memory saja (R12, FR-17): hilang saat restart, auto-delete saat kosong.
const rooms = new Map<string, PrivateRoom>();

// Kode XXXX-XXXX crypto-random, unik global (R8).
export function generateCode(): string {
  let code: string;
  do {
    const bytes = randomBytes(8);
    const chars = [...bytes].map(
      (b) => CODE_ALPHABET[b % CODE_ALPHABET.length],
    );
    code = `${chars.slice(0, 4).join('')}-${chars.slice(4).join('')}`;
  } while (rooms.has(code));
  return code;
}

export function normalizeCode(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim().toUpperCase() : '';
}

function roomName(code: string): string {
  return `private:${code}`;
}

function codesOf(socket: Socket): Set<string> {
  if (!socket.data.privateCodes) socket.data.privateCodes = new Set<string>();
  return socket.data.privateCodes as Set<string>;
}

function leaveRoom(socket: Socket, code: string, notify: boolean): void {
  const room = rooms.get(code);
  if (!room) return;
  const me = room.participants.get(socket.id);
  room.participants.delete(socket.id);
  codesOf(socket).delete(code);
  void socket.leave(roomName(code));
  if (room.participants.size === 0) {
    rooms.delete(code);
    if (notify)
      socket.emit('private:closed', {
        code,
        message: 'Room terhapus otomatis.',
      });
    return;
  }
  if (notify && me) {
    socket.to(roomName(code)).emit('private:peer-left', {
      displayName: me.displayName,
    });
  }
}

// Daftarkan event private:* untuk satu socket (T-14, Alur 3).
export function registerPrivateChat(socket: Socket): void {
  const auth = () => socket.data.auth as SocketAuth;

  socket.on('private:create', async () => {
    const me = auth();
    const code = generateCode();
    rooms.set(code, {
      creatorId: me.clerkId,
      participants: new Map([
        [socket.id, { clerkId: me.clerkId, displayName: me.displayName }],
      ]),
    });
    codesOf(socket).add(code);
    await socket.join(roomName(code));
    socket.emit('private:created', { code });
  });

  socket.on('private:join', async (payload: { code?: unknown }) => {
    const me = auth();
    const code = normalizeCode(payload?.code);
    const room = rooms.get(code);
    if (!room) {
      socket.emit('error', { message: 'Room tidak ditemukan.' });
      return;
    }
    if (room.participants.size >= 2) {
      socket.emit('error', { message: 'Room sudah penuh.' });
      return;
    }
    if ([...room.participants.values()].some((p) => p.clerkId === me.clerkId)) {
      socket.emit('error', { message: 'Tidak bisa join room sendiri.' });
      return;
    }
    room.participants.set(socket.id, {
      clerkId: me.clerkId,
      displayName: me.displayName,
    });
    codesOf(socket).add(code);
    await socket.join(roomName(code));
    socket.emit('private:joined', {
      code,
      participantCount: room.participants.size,
    });
    socket.to(roomName(code)).emit('private:peer-joined', {
      displayName: me.displayName,
    });
  });

  socket.on(
    'private:message',
    (payload: { code?: unknown; body?: unknown }) => {
      const me = auth();
      const code = normalizeCode(payload?.code);
      const room = rooms.get(code);
      if (!room || !room.participants.has(socket.id)) {
        socket.emit('error', { message: 'Room tidak ditemukan.' });
        return;
      }
      const body = typeof payload?.body === 'string' ? payload.body.trim() : '';
      if (!body) {
        socket.emit('error', { message: 'Pesan tidak boleh kosong.' });
        return;
      }
      if (body.length > MAX_BODY) {
        socket.emit('error', {
          message: `Pesan maksimal ${MAX_BODY} karakter.`,
        });
        return;
      }
      socket.to(roomName(code)).emit('private:message', {
        id: randomUUID(),
        displayName: me.displayName,
        body,
        createdAt: new Date().toISOString(),
      });
      socket.emit('private:message', {
        id: randomUUID(),
        displayName: me.displayName,
        body,
        createdAt: new Date().toISOString(),
      });
    },
  );

  const leaveAll = () => {
    for (const code of [...codesOf(socket)]) leaveRoom(socket, code, true);
  };

  socket.on('private:leave', (payload: { code?: unknown }) => {
    const code = normalizeCode(payload?.code);
    if (code && rooms.has(code)) leaveRoom(socket, code, true);
  });

  socket.on('disconnect', leaveAll);
}

// Test-only hooks (tidak dipakai production).
export const __privateDebug = { rooms };
export default registerPrivateChat;
