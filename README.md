# AnonChat

Aplikasi chat anonim sederhana — obrolan tanpa nama asli. Identitas akun (email/nama dari Clerk) tidak pernah ditampilkan di antarmuka; yang terlihat hanya **nama tampilan** pilihan pengguna atau `anonymous`.

Dibangun sebagai proyek demo Tugas Akhir: satu aplikasi web full-stack dengan chat global, room private sekali pakai, dan desain neobrutalism.

## Fitur

- **Chat global** — 3 room bawaan (`#Umum`, `#Tugas`, `#Random`), riwayat pesan tersimpan di database (50 pesan terakhir per room).
- **Private chat 1-on-1** — buat room, bagikan kode undangan format `XXXX-XXXX`, maksimal 2 orang. Room in-memory: otomatis terhapus saat keduanya keluar.
- **Nama tampilan** — 1–30 karakter, default `anonymous`, dapat diganti kapan saja lewat kartu nama (tanpa email/nama asli).
- **Login & registrasi in-app** — Clerk (email + OAuth GitHub/Google), halaman bertema AnonChat, sesi tercatat bertahan 3 hari.
- **Realtime** — pesan terkirim lewat Socket.io; maksimal 500 karakter dengan validasi di server.
- **UI neobrutalism** — border 3px, shadow keras, radius 8px, mode gelap/terang, animasi GSAP (menghormati `prefers-reduced-motion`), responsif mobile.

## Teknologi

| Lapisan     | Teknologi                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------- |
| Frontend    | React 19, Vite 8, TypeScript, React Router, Zustand, Tailwind CSS v4, GSAP, Phosphor        |
| Backend     | Express 4 (ESM, TypeScript via `tsx`), Socket.io                                            |
| Database    | PostgreSQL (Supabase) + Prisma 7 (driver adapter `@prisma/adapter-pg`)                      |
| Autentikasi | Clerk — `@clerk/express` (server), `@clerk/react` (client)                                  |
| Deploy      | Render — satu web service: Express menyajikan SPA hasil build + Socket.io di port yang sama |

## Arsitektur

Monolith sederhana: **satu proses Express** melayani tiga hal sekaligus —

```
Browser ──┬── GET /            → file statis dist/ (React SPA)
          ├── /api/*           → REST (profil, daftar room, riwayat pesan)
          └── /socket.io       → Socket.io (chat global + private realtime)
```

- Data permanen (user lokal, room global, pesan global) di PostgreSQL via Prisma.
- Room private **tidak** menyentuh database — disimpan in-memory, hilang saat server restart.
- Verifikasi token Clerk terjadi di server (`requireClerkAuth`); `CLERK_SECRET_KEY` tidak pernah dikirim ke browser.

## Struktur Proyek

```
server/                 # Backend Express
  index.ts              #   entry: static + REST + Socket.io (1 port)
  routes/               #   /api/profile, /api/rooms
  socket/               #   globalChat.ts, privateChat.ts
  middleware/auth.ts    #   verifikasi token Clerk
  lib/                  #   prisma client, cache, rate limit
prisma/                 # schema, migrasi, seed (3 room + pesan sambutan)
src/                    # Frontend React
  pages/                #   GlobalChatPage, PrivateChatPage, Login, SignUp
  components/           #   MessageList, MessageInput, AuthLayout, ProtectedRoute, ThemeToggle
  lib/                  #   api, socket, clerkAppearance, sessionActivity, motion
  stores/               #   state Zustand
scripts/history.py      # track record tugas (history.db)
```

## Menjalankan di Lokal

Prasyarat: Node.js 20+, database PostgreSQL (mis. Supabase), dan akun Clerk.

```bash
# 1. Install dependency
npm install

# 2. Siapkan environment
cp .env.example .env        # lalu isi nilainya:
#    DATABASE_URL               → connection string Postgres (session pooler, port 5432)
#    CLERK_SECRET_KEY           → secret key Clerk (hanya di server)
#    VITE_CLERK_PUBLISHABLE_KEY → publishable key Clerk (frontend)
#    PORT                       → port server Express (default 3001)

# 3. Migrasi + seed database
npx prisma migrate dev
npx prisma db seed

# 4a. Mode pengembangan (2 terminal)
npm run dev:server          # Express + Socket.io di :3001
npm run dev                 # Vite di :5173 (proxy /api dan /socket.io ke :3001)

# 4b. Mode produksi lokal
npm run build               # typecheck + build frontend ke dist/
npm start                   # Express menyajikan dist/ di :3001
```

Outlet OAuth (GitHub/Google) di Clerk perlu diaktifkan agar tombolnya berfungsi, atau pakai email + kode verifikasi.

## REST API

| Method | Endpoint                         | Keterangan                                           |
| ------ | -------------------------------- | ---------------------------------------------------- |
| GET    | `/api/health`                    | Health check                                         |
| GET    | `/api/profile`                   | Ambil profil lokal (buat `anonymous` bila belum ada) |
| PUT    | `/api/profile`                   | Ubah nama tampilan (1–30 karakter)                   |
| GET    | `/api/rooms/global`              | Daftar room global                                   |
| GET    | `/api/rooms/global/:id/messages` | Riwayat pesan room (`?limit=50`)                     |

Semua endpoint di atas memerlukan token Clerk yang valid.

## Socket.io

Dikirim klien → server:

| Event             | Fungsi                                        |
| ----------------- | --------------------------------------------- |
| `global:join`     | Masuk room global (menerima `global:history`) |
| `global:leave`    | Keluar dari room global                       |
| `global:message`  | Kirim pesan global                            |
| `private:create`  | Buat room private baru (dapat kode)           |
| `private:join`    | Gabung room private via kode                  |
| `private:message` | Kirim pesan private                           |
| `private:leave`   | Keluar dari room private                      |

Dikirim server → klien:

| Event                 | Fungsi                              |
| --------------------- | ----------------------------------- |
| `global:history`      | 50 pesan terakhir saat join         |
| `global:message`      | Pesan global baru                   |
| `private:created`     | Kode room private baru              |
| `private:joined`      | Konfirmasi join + info peserta      |
| `private:peer-joined` | Pasangan masuk room                 |
| `private:peer-left`   | Pasangan keluar room                |
| `private:closed`      | Room ditutup (auto-delete)          |
| `private:message`     | Pesan private baru                  |
| `error`               | pesan kesalahan berbahasa Indonesia |

## Privasi & Keamanan

- UI chat **tidak pernah** menampilkan email atau nama asli — hanya nama tampilan.
- Snapshot nama ikut disimpan per pesan agar riwayat konsisten meski nama diganti.
- Private room maksimal 2 peserta, kode acak kriptografis, dan auto-delete saat kosong.
- Secret hanya lewat environment variable (`.env` lokal / dashboard hosting) — tidak ada di repo.
- Token Clerk diverifikasi di server untuk REST maupun Socket.io handshake.

## Status

| Bagian                                                          | Status                                 |
| --------------------------------------------------------------- | -------------------------------------- |
| Chat global + private + auth + UI                               | Selesai, teruji end-to-end (2 browser) |
| Deploy produksi (Render, Clerk production, Supabase production) | Belum — langkah berikutnya             |

## Lisensi

[MIT](LICENSE)
