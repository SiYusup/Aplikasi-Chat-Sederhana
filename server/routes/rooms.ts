import type { Request, Response } from 'express';
import { Router } from 'express';
import { requireClerkAuth } from '../middleware/auth';
import { roomCache } from '../lib/cache';
import { prisma } from '../lib/prisma';

const MAX_LIMIT = 50;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/rooms/global — daftar room + jumlah pesan (cache 60 detik, FR-09).
export async function handleListRooms(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const cached = roomCache.get<unknown>('rooms:global');
    if (cached) {
      res.json(cached);
      return;
    }
    const rooms = await prisma.globalRoom.findMany({
      orderBy: { createdAt: 'asc' },
    });
    const payload = {
      rooms: await Promise.all(
        rooms.map(async (r) => ({
          id: r.id,
          name: r.name,
          messageCount: await prisma.globalMessage.count({
            where: { roomId: r.id },
          }),
        })),
      ),
    };
    roomCache.set('rooms:global', payload);
    res.json(payload);
  } catch {
    res.status(500).json({ error: 'Gagal memuat daftar room. Coba lagi.' });
  }
}

// GET /api/rooms/global/:id/messages?limit=50 — 50 pesan terakhir (FR-13).
export async function handleRoomMessages(
  req: Request,
  res: Response,
): Promise<void> {
  const roomId = req.params.id;
  if (!UUID_RE.test(roomId)) {
    res.status(404).json({ error: 'Room tidak ditemukan.' });
    return;
  }
  const limit = Math.min(
    Math.max(Number(req.query.limit) || MAX_LIMIT, 1),
    MAX_LIMIT,
  );
  try {
    const room = await prisma.globalRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) {
      res.status(404).json({ error: 'Room tidak ditemukan.' });
      return;
    }
    const desc = await prisma.globalMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    res.json({
      room: { id: room.id, name: room.name },
      messages: [...desc].reverse(),
    });
  } catch {
    res.status(500).json({ error: 'Gagal memuat pesan. Coba lagi.' });
  }
}

export const roomsRouter = Router();

roomsRouter.get('/global', requireClerkAuth, handleListRooms);
roomsRouter.get('/global/:id/messages', requireClerkAuth, handleRoomMessages);

export default roomsRouter;
