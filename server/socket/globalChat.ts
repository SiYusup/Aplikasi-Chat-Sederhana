import type { Socket } from 'socket.io';
import { prisma } from '../lib/prisma';
import { checkRateLimit } from '../lib/rateLimit';
import type { SocketAuth } from './index';

const MAX_BODY = 500;
const HISTORY_LIMIT = 50;

// Validasi isi pesan (R4 kosong, R6 max 500). Balik string error Indonesia / null jika OK.
export function validateBody(raw: unknown): string | null {
  const body = typeof raw === 'string' ? raw.trim() : '';
  if (!body) return 'Pesan tidak boleh kosong.';
  if (body.length > MAX_BODY) return `Pesan maksimal ${MAX_BODY} karakter.`;
  return null;
}

function roomName(roomId: string): string {
  return `global:${roomId}`;
}

function authOf(socket: Socket): SocketAuth {
  return socket.data.auth as SocketAuth;
}

// Daftarkan event global:* untuk satu socket (T-13, Alur 2).
export function registerGlobalChat(socket: Socket): void {
  socket.on('global:join', async (payload: { roomId?: unknown }) => {
    const roomId = typeof payload?.roomId === 'string' ? payload.roomId : '';
    const room = roomId
      ? await prisma.globalRoom
          .findUnique({ where: { id: roomId } })
          .catch(() => null)
      : null;
    if (!room) {
      socket.emit('error', { message: 'Room tidak ditemukan.' });
      return;
    }
    await socket.join(roomName(roomId));
    const desc = await prisma.globalMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_LIMIT,
    });
    socket.emit('global:history', {
      roomId,
      messages: [...desc].reverse().map((m) => ({
        id: m.id,
        displayNameSnapshot: m.displayNameSnapshot,
        body: m.body,
        createdAt: m.createdAt,
      })),
    });
  });

  socket.on('global:leave', async (payload: { roomId?: unknown }) => {
    const roomId = typeof payload?.roomId === 'string' ? payload.roomId : '';
    if (roomId) await socket.leave(roomName(roomId));
  });

  socket.on(
    'global:message',
    async (payload: { roomId?: unknown; body?: unknown }) => {
      const auth = authOf(socket);
      const roomId = typeof payload?.roomId === 'string' ? payload.roomId : '';
      const invalid = validateBody(payload?.body);
      if (invalid) {
        socket.emit('error', { message: invalid });
        return;
      }
      if (!checkRateLimit(auth.clerkId)) {
        socket.emit('error', {
          message: 'Terlalu banyak pesan. Tunggu sebentar.',
        });
        return;
      }
      const body = (payload.body as string).trim();
      try {
        const saved = await prisma.globalMessage.create({
          data: {
            roomId,
            userId: auth.userId,
            displayNameSnapshot: auth.displayName,
            body,
          },
        });
        socket.to(roomName(roomId)).emit('global:message', {
          id: saved.id,
          displayNameSnapshot: saved.displayNameSnapshot,
          body: saved.body,
          createdAt: saved.createdAt,
        });
        socket.emit('global:message', {
          id: saved.id,
          displayNameSnapshot: saved.displayNameSnapshot,
          body: saved.body,
          createdAt: saved.createdAt,
        });
      } catch {
        socket.emit('error', { message: 'Gagal mengirim pesan. Coba lagi.' });
      }
    },
  );
}

export default registerGlobalChat;
