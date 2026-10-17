import 'dotenv/config';
import compression from 'compression';
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import profileRouter from './routes/profile';
import roomsRouter from './routes/rooms';
import { initSocket } from './socket/index';

// ESM tidak punya __dirname — turunkan dari import.meta.url.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, '../dist');

// Entry Express (diperluas dari stub T-01):
// - compression()        -> gzip/deflate, payload chat lebih kecil
// - express.static(dist) -> hasil build Vite di production
// - GET /health          -> cek langsung ke backend (:3001)
// - GET /api/health      -> cek via Vite proxy (dev)
// - GET *                -> fallback SPA (dukung React Router refresh manual)
const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(compression());
app.use(express.json());
app.use(express.static(distDir));

app.get(['/health', '/api/health'], (_req, res) => {
  res.json({ ok: true, service: 'anonchat', ts: new Date().toISOString() });
});

// Route /api — SEBELUM fallback SPA (T-09+).
app.use('/api/profile', profileRouter);
app.use('/api/rooms', roomsRouter);

// Fallback PALING AKHIR — route /api dan Socket.io (T-09+) didaftar sebelum ini.
app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

// Socket.io menempel di HTTP server yang sama (1 port Render, T-12).
const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
