import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  requireClerkAuth,
  type AuthenticatedRequest,
} from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { Prisma } from '../../src/generated/prisma/client';

// GET /api/profile — ambil profil lokal by clerkId (FR-06/07, Alur 1).
// Belum ada -> INSERT displayName="anonymous", balas { isNew: true }.
export const profileRouter = Router();

profileRouter.put('/', requireClerkAuth, handleUpdateDisplayName);

profileRouter.get(
  '/',
  requireClerkAuth,
  async (req: Request, res: Response) => {
    const clerkId = (req as AuthenticatedRequest).clerkId;
    try {
      const existing = await prisma.user.findUnique({ where: { clerkId } });
      if (existing) {
        res.json({
          isNew: false,
          user: { id: existing.id, displayName: existing.displayName },
        });
        return;
      }
      const created = await prisma.user.create({
        data: { clerkId, displayName: 'anonymous' },
      });
      res.status(201).json({
        isNew: true,
        user: { id: created.id, displayName: created.displayName },
      });
    } catch {
      res.status(500).json({ error: 'Gagal memuat profil. Coba lagi.' });
    }
  },
);

export default profileRouter;

// PUT /api/profile/ — ganti displayName 1–30 karakter (FR-06/08, R1).
export async function handleUpdateDisplayName(
  req: Request,
  res: Response,
): Promise<void> {
  const clerkId = (req as AuthenticatedRequest).clerkId;
  const raw = (req.body as { displayName?: unknown } | undefined)?.displayName;
  const displayName = typeof raw === 'string' ? raw.trim() : '';
  if (displayName.length < 1 || displayName.length > 30) {
    res
      .status(400)
      .json({ error: 'Nama tampilan harus 1 sampai 30 karakter.' });
    return;
  }
  try {
    const updated = await prisma.user.update({
      where: { clerkId },
      data: { displayName },
    });
    res.json({
      user: { id: updated.id, displayName: updated.displayName },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2025'
    ) {
      res
        .status(404)
        .json({ error: 'Profil tidak ditemukan. Muat ulang profil dulu.' });
      return;
    }
    res.status(500).json({ error: 'Gagal menyimpan nama. Coba lagi.' });
  }
}
