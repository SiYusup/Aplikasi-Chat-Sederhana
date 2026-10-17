# AGENTS.md — AnonChat

> Project: **AnonChat** (aplikasi chat sederhana, demo Tugas Akhir)
> Stack: Monolith Express + Vite React SPA + Prisma + Supabase + Socket.io + Clerk · Deploy: Render
> UI: Neobrutalism (radius 8px, pink primary, dark mode V1, GSAP)

## 1. Orientasi Wajib (setiap sesi baru)

1. Baca dokumen vault `obs_aplikasi_chat_sederhana/` sesuai kebutuhan:
   - `1-PRD-AnonChat.md` — visi, 16 stories, 17 FR
   - `2-TECH-SPEC-AnonChat.md` — stack, arsitektur, DB
   - `2a-Interface-Design.md` — REST + socket events + halaman
   - `2b-Alur-Logika.md` — alur + business rules R1–R13
   - `2c-Keamanan-Performa-Deployment.md` — security, deploy, roadmap v2
   - `3-UI-System-Design.md` — token neobrutalism, komponen, animasi
   - `4-TASKS-AnonChat.md` — task list (cermin `history.db`)
2. Cek status terakhir:
   ```
   python scripts/history.py events 5
   python scripts/history.py list --status Todo
   ```

## 2. Track Record (`history.db` + `scripts/history.py`)

- **Sumber kebenaran status task = `history.db` tabel `tasks`.** File `4-TASKS-AnonChat.md` adalah cermin bacaan manusia — update keduanya.
- **History TIDAK PERNAH dihapus.** Task selesai → `status='Done'`. Bug baru → task baru (ID lanjut T-30+), bukan edit task lama.
- Setiap aksi catat event:
  ```
  python scripts/history.py set-status T-01 Done
  python scripts/history.py log "selesai setup vite+express"
  python scripts/history.py search "private"
  ```
- Perintah lengkap: `python scripts/history.py --help`

## 3. Aturan Kerja

- Bahasa: Indonesia. Error message UI: Bahasa Indonesia.
- Privasi inti: UI chat TIDAK PERNAH menampilkan email/nama asli — hanya `displayName` / snapshot / "anonymous".
- Private room: in-memory, maks 2 orang, auto-delete saat keduanya keluar.
- Ikuti token & komponen di `3-UI-System-Design.md` (border 3px, shadow keras, radius 8px, Phosphor Bold, GSAP + reduced-motion).
- Secrets hanya via env (`.env` lokal, Render Dashboard) — JANGAN commit.
- Verifikasi via eksekusi: `npm run build`, migrasi prisma, uji 2-browser sebelum klaim selesai.

## 4. Handoff Antar AI

AI baru cukup baca file ini + jalankan 2 perintah orientasi di §1. Seluruh konteks (PRD → Tech Spec → UI → Tasks → event log) tersedia tanpa bertanya ulang ke user.
