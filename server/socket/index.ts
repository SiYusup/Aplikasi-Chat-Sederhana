import { verifyToken } from '@clerk/express';
import type { Server as HttpServer } from 'http';
import { Server, type Socket } from 'socket.io';
import { prisma } from '../lib/prisma';
import { registerGlobalChat } from './globalChat';
import { registerPrivateChat } from './privateChat';

// Data auth yang ditempel ke setiap socket lolos handshake (2a §2).
export interface SocketAuth {
  clerkId: string;
  userId: string;
  displayName: string;
}

async function socketAuth(
  socket: Socket,
  next: (err?: Error) => void,
): Promise<void> {
  try {
    const secretKey = process.env.CLERK_SECRET_KEY;
    const token = socket.handshake.auth?.token as unknown;
    if (!secretKey || typeof token !== 'string' || !token) {
      next(new Error('Token tidak ditemukan. Silakan login ulang.'));
      return;
    }
    const payload = await verifyToken(token, { secretKey });
    const clerkId = payload.sub;
    let user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      user = await prisma.user.create({
        data: { clerkId, displayName: 'anonymous' },
      });
    }
    const auth: SocketAuth = {
      clerkId,
      userId: user.id,
      displayName: user.displayName,
    };
    socket.data.auth = auth;
    next();
  } catch {
    next(new Error('Sesi tidak valid atau kedaluwarsa. Silakan login ulang.'));
  }
}

// Attach Socket.io ke HTTP server Express (T-12). Dipanggil sekali dari index.
export function initSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer);
  io.use(socketAuth);
  io.on('connection', (socket: Socket) => {
    registerGlobalChat(socket);
    registerPrivateChat(socket);
  });
  return io;
}

export default initSocket;
