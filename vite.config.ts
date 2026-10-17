import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Dev: frontend :5173, backend :3001 (lihat server/index.ts)
// /api/* dan /socket.io diteruskan ke Express (T-01: /api/health untuk uji proxy,
// /socket.io disiapkan untuk Socket.io di T-12).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },
});
