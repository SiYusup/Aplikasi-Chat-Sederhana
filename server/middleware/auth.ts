import { verifyToken } from '@clerk/express';
import type { NextFunction, Request, Response } from 'express';

// Request yang sudah lewat requireClerkAuth — clerkId dijamin terisi (dipakai T-09+).
export interface AuthenticatedRequest extends Request {
  clerkId: string;
}

function unauthorized(res: Response, message: string): void {
  res.status(401).json({ error: message });
}

// Verifikasi Clerk session token (header `Authorization: Bearer <token>`).
// Sukses -> req.clerkId terisi, lanjut next(). Gagal -> 401 Bahasa Indonesia.
export async function requireClerkAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    unauthorized(
      res,
      'Konfigurasi server belum lengkap (CLERK_SECRET_KEY kosong).',
    );
    return;
  }
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    unauthorized(res, 'Token tidak ditemukan. Silakan login ulang.');
    return;
  }
  try {
    const payload = await verifyToken(header.slice('Bearer '.length), {
      secretKey,
    });
    (req as AuthenticatedRequest).clerkId = payload.sub;
    next();
  } catch {
    unauthorized(
      res,
      'Sesi tidak valid atau kedaluwarsa. Silakan login ulang.',
    );
  }
}

export default requireClerkAuth;
