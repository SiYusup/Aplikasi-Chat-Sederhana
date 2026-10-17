"""Track record AnonChat (SQLite).

Aturan: history tidak pernah dihapus. Task selesai -> status='Done'.
Event baru selalu di-append, tidak ada UPDATE/DELETE ke events.

Usage:
  python scripts/history.py init                  # buat + seed history.db
  python scripts/history.py list [--status Todo]  # daftar tasks
  python scripts/history.py show T-01             # detail 1 task
  python scripts/history.py set-status T-01 Done  # ubah status task (+ auto event)
  python scripts/history.py log "catatan"         # append event manual
  python scripts/history.py events [N]            # N event terakhir
  python scripts/history.py search "kata"         # cari di tasks + events + docs
  python scripts/history.py docs                  # index dokumen vault
"""
import sqlite3
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / "history.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS tasks(
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  modul TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Todo',
  dependencies TEXT DEFAULT '',
  estimate TEXT DEFAULT '',
  files TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS events(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL DEFAULT (datetime('now')),
  actor TEXT NOT NULL,
  kind TEXT NOT NULL,
  ref TEXT DEFAULT '',
  note TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS docs(
  path TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  kind TEXT NOT NULL
);
"""

TASKS = [
    ("T-01", "Init monorepo + scripts", "Setup", "High", "Todo", "", "3 jam", "package.json, vite.config.ts, tsconfig.json, server/index.ts"),
    ("T-02", "Tailwind + design tokens + fonts", "Setup", "High", "Todo", "T-01", "2 jam", "tailwind.config.js, src/index.css"),
    ("T-03", "Env, gitignore, lint", "Setup", "Mid", "Todo", "T-01", "1 jam", ".env.example, .gitignore, .eslintrc"),
    ("T-04", "Prisma schema + migrasi", "Database", "High", "Todo", "T-01", "2 jam", "prisma/schema.prisma"),
    ("T-05", "Seed room global", "Database", "High", "Todo", "T-04", "1 jam", "prisma/seed.ts"),
    ("T-06", "Prisma client singleton", "Database", "High", "Todo", "T-04", "0.5 jam", "server/lib/prisma.ts"),
    ("T-07", "Express entry + static + health", "Backend", "High", "Todo", "T-01", "2 jam", "server/index.ts"),
    ("T-08", "Clerk auth middleware", "Backend", "High", "Todo", "T-07", "1.5 jam", "server/middleware/auth.ts"),
    ("T-09", "GET /api/profile (upsert anonymous)", "Backend", "High", "Todo", "T-08,T-06", "1.5 jam", "server/routes/profile.ts"),
    ("T-10", "PUT /api/profile/display-name", "Backend", "High", "Todo", "T-09", "1 jam", "server/routes/profile.ts"),
    ("T-11", "Rooms API + cache", "Backend", "High", "Todo", "T-08,T-06", "2 jam", "server/routes/rooms.ts, server/lib/cache.ts"),
    ("T-12", "Socket init + handshake auth", "Realtime", "High", "Todo", "T-07,T-08", "2 jam", "server/socket/index.ts"),
    ("T-13", "Global chat events", "Realtime", "High", "Todo", "T-12,T-06", "3 jam", "server/socket/globalChat.ts, server/lib/rateLimit.ts"),
    ("T-14", "Private chat events + auto-delete", "Realtime", "High", "Todo", "T-12", "3 jam", "server/socket/privateChat.ts"),
    ("T-15", "Clerk + router + ProtectedRoute", "Frontend", "High", "Todo", "T-02", "2 jam", "src/main.tsx, src/App.tsx, src/components/ProtectedRoute.tsx"),
    ("T-16", "API client + socket client + stores", "Frontend", "High", "Todo", "T-15", "2.5 jam", "src/lib/*, src/stores/*"),
    ("T-17", "Dark mode", "Frontend", "Mid", "Todo", "T-15", "1.5 jam", "src/hooks/useTheme.ts, src/components/ThemeToggle.tsx"),
    ("T-18", "LoginPage", "Halaman", "High", "Todo", "T-15,T-16", "1.5 jam", "src/pages/LoginPage.tsx"),
    ("T-19", "OnboardingPage", "Halaman", "High", "Todo", "T-16,T-10", "1.5 jam", "src/pages/OnboardingPage.tsx"),
    ("T-20", "GlobalChatPage", "Halaman", "High", "Todo", "T-16,T-11,T-13", "4 jam", "src/pages/GlobalChatPage.tsx, src/components/MessageList.tsx, src/components/MessageInput.tsx"),
    ("T-21", "PrivateChatPage", "Halaman", "High", "Todo", "T-16,T-14", "4 jam", "src/pages/PrivateChatPage.tsx"),
    ("T-22", "Komponen nb + Phosphor icons", "UI", "High", "Todo", "T-02", "3 jam", "src/components/nb/*, src/index.css"),
    ("T-23", "Animasi GSAP", "UI", "Mid", "Todo", "T-22", "2 jam", "src/lib/motion.ts"),
    ("T-24", "Responsive mobile", "UI", "Mid", "Todo", "T-20,T-21", "2 jam", "src/pages/*, src/index.css"),
    ("T-25", "Uji 2-browser + checklist demo", "QA", "High", "Todo", "T-20,T-21", "3 jam", ""),
    ("T-26", "Clerk production config", "Deploy", "High", "Todo", "", "1 jam", "(dashboard Clerk)"),
    ("T-27", "Supabase production", "Deploy", "High", "Todo", "T-04,T-05", "1.5 jam", "(dashboard Supabase)"),
    ("T-28", "Render web service", "Deploy", "High", "Todo", "T-07,T-26,T-27", "2 jam", "render.yaml"),
    ("T-29", "Final review + sidang prep", "Deploy", "High", "Todo", "T-25,T-28", "2 jam", ""),
]

DOCS = [
    ("obs_aplikasi_chat_sederhana/1-PRD-AnonChat.md", "PRD AnonChat", "prd"),
    ("obs_aplikasi_chat_sederhana/2-TECH-SPEC-AnonChat.md", "Tech Spec (stack, arsitektur, DB)", "tech-spec"),
    ("obs_aplikasi_chat_sederhana/2a-Interface-Design.md", "Interface Design (REST, socket, halaman)", "tech-spec"),
    ("obs_aplikasi_chat_sederhana/2b-Alur-Logika.md", "Alur Logika + business rules", "tech-spec"),
    ("obs_aplikasi_chat_sederhana/2c-Keamanan-Performa-Deployment.md", "Keamanan, performa, deployment, roadmap v2", "tech-spec"),
    ("obs_aplikasi_chat_sederhana/3-UI-System-Design.md", "UI System Design (neobrutalism)", "ui"),
    ("obs_aplikasi_chat_sederhana/4-TASKS-AnonChat.md", "Task list (history, tidak dihapus)", "tasks"),
]

SEED_EVENTS = [
    ("user", "doc", "1-PRD-AnonChat.md", "PRD 6 bagian final (16 stories, 17 FR) + 7 diagram PlantUML"),
    ("user", "doc", "2-TECH-SPEC-AnonChat.md", "Tech Spec: monolith Express+Vite+Prisma, node-cache, Render+Supabase+Clerk"),
    ("user", "doc", "3-UI-System-Design.md", "UI neobrutalism: radius 8px, pink primary, dark mode V1, GSAP"),
    ("user", "tasks", "T-01..T-29", "Task Generator: 29 tasks semua modul, scope penuh"),
]


def conn():
    c = sqlite3.connect(DB)
    c.row_factory = sqlite3.Row
    return c


def cmd_init():
    if DB.exists():
        print(f"{DB} sudah ada — init dibatalkan (history tidak di-reset).")
        return
    c = conn()
    c.executescript(SCHEMA)
    today = date.today().isoformat()
    c.executemany(
        "INSERT INTO tasks(id,title,modul,priority,status,dependencies,estimate,files,created_at,updated_at)"
        " VALUES(?,?,?,?,?,?,?,?  ,?,?)".replace("  ", " "),
        [(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], today, today) for t in TASKS],
    )
    c.executemany("INSERT INTO docs(path,title,kind) VALUES(?,?,?)", DOCS)
    c.executemany(
        "INSERT INTO events(actor,kind,ref,note) VALUES(?,?,?,?)", SEED_EVENTS
    )
    c.commit()
    print(f"OK: {DB} dibuat — {len(TASKS)} tasks, {len(DOCS)} docs, {len(SEED_EVENTS)} events.")


def cmd_list(status=None):
    c = conn()
    q = "SELECT id,title,modul,priority,status FROM tasks"
    args: list = []
    if status:
        q += " WHERE status=? COLLATE NOCASE"
        args.append(status)
    q += " ORDER BY id"
    for r in c.execute(q, args):
        print(f"{r['id']} [{r['status']}] ({r['modul']}/{r['priority']}) {r['title']}")


def cmd_show(tid):
    c = conn()
    r = c.execute("SELECT * FROM tasks WHERE id=? COLLATE NOCASE", (tid,)).fetchone()
    if not r:
        print(f"Task {tid} tidak ditemukan.")
        return
    for k in r.keys():
        print(f"{k}: {r[k]}")


def cmd_set_status(tid, status):
    c = conn()
    r = c.execute("SELECT id FROM tasks WHERE id=? COLLATE NOCASE", (tid,)).fetchone()
    if not r:
        print(f"Task {tid} tidak ditemukan.")
        return
    c.execute(
        "UPDATE tasks SET status=?, updated_at=? WHERE id=?",
        (status, date.today().isoformat(), r["id"]),
    )
    c.execute(
        "INSERT INTO events(actor,kind,ref,note) VALUES(?,?,?,?)",
        ("ai", "status", r["id"], f"Status -> {status}"),
    )
    c.commit()
    print(f"OK: {r['id']} -> {status} (+ event tercatat)")


def cmd_log(note, ref=""):
    c = conn()
    c.execute(
        "INSERT INTO events(actor,kind,ref,note) VALUES(?,?,?,?)",
        ("ai", "note", ref, note),
    )
    c.commit()
    print("OK: event tercatat.")


def cmd_events(n=10):
    c = conn()
    for r in c.execute(
        "SELECT id,ts,actor,kind,ref,note FROM events ORDER BY id DESC LIMIT ?", (n,)
    ):
        print(f"#{r['id']} {r['ts']} [{r['actor']}/{r['kind']}] {r['ref']} — {r['note']}")


def cmd_search(kw):
    c = conn()
    like = f"%{kw}%"
    print("== tasks ==")
    for r in c.execute(
        "SELECT id,title,status FROM tasks WHERE id LIKE ? OR title LIKE ? OR files LIKE ? ORDER BY id",
        (like, like, like),
    ):
        print(f"{r['id']} [{r['status']}] {r['title']}")
    print("== events ==")
    for r in c.execute(
        "SELECT id,ts,ref,note FROM events WHERE ref LIKE ? OR note LIKE ? ORDER BY id DESC LIMIT 20",
        (like, like),
    ):
        print(f"#{r['id']} {r['ts']} {r['ref']} — {r['note']}")
    print("== docs ==")
    for r in c.execute(
        "SELECT path,title FROM docs WHERE path LIKE ? OR title LIKE ?", (like, like)
    ):
        print(f"{r['path']} — {r['title']}")


def cmd_docs():
    c = conn()
    for r in c.execute("SELECT path,title,kind FROM docs ORDER BY path"):
        print(f"[{r['kind']}] {r['path']} — {r['title']}")


def main(argv):
    if not DB.exists() and (not argv or argv[0] != "init"):
        print(f"{DB} belum ada. Jalankan: python scripts/history.py init")
        return
    if not argv or argv[0] in ("-h", "--help", "help"):
        print(__doc__)
        return
    cmd, rest = argv[0], argv[1:]
    if cmd == "init":
        cmd_init()
    elif cmd == "list":
        status = rest[1] if len(rest) == 2 and rest[0] == "--status" else (rest[0] if rest else None)
        cmd_list(status)
    elif cmd == "show" and rest:
        cmd_show(rest[0])
    elif cmd == "set-status" and len(rest) == 2:
        cmd_set_status(rest[0], rest[1])
    elif cmd == "log" and rest:
        cmd_log(" ".join(rest))
    elif cmd == "events":
        cmd_events(int(rest[0]) if rest else 10)
    elif cmd == "search" and rest:
        cmd_search(" ".join(rest))
    elif cmd == "docs":
        cmd_docs()
    else:
        print(__doc__)


if __name__ == "__main__":
    main(sys.argv[1:])
