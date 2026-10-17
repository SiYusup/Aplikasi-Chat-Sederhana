import { useEffect, useRef, useState } from 'react';
import { popMessage } from '../lib/motion';

export interface BubbleMessage {
  id: string;
  name: string;
  body: string;
  createdAt: string;
}

// Batas "dekat bawah" (px): pesan baru hanya auto-scroll bila user sudah di sini.
const NEAR_BOTTOM_PX = 120;
const AVATAR_COLORS = [
  'var(--primary)',
  'var(--secondary)',
  'var(--accent)',
  'var(--mint)',
];

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function timeOf(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  if (sameDay(d, now)) return 'Hari ini';
  if (sameDay(d, new Date(now.getTime() - 86_400_000))) return 'Kemarin';
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Daftar pesan + auto-scroll cerdas (T-20, T-34): hanya lompat ke bawah bila
// user sudah dekat bawah; bila sedang baca riwayat, tampilkan tombol
// "N pesan baru". Pesan beruntun dari nama sama digabung rapat.
export function MessageList({
  messages,
  ownName,
}: {
  messages: BubbleMessage[];
  ownName: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(0);
  const [unread, setUnread] = useState(0);

  const nearBottom = (): boolean => {
    const box = boxRef.current;
    if (!box) return true;
    return box.scrollHeight - box.scrollTop - box.clientHeight <= NEAR_BOTTOM_PX;
  };

  const scrollToBottom = (smooth: boolean): void => {
    const box = boxRef.current;
    if (!box) return;
    if (smooth) box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
    else box.scrollTop = box.scrollHeight;
  };

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    if (messages.length <= prevCount.current) {
      prevCount.current = messages.length;
      return;
    }
    const added = messages.length - prevCount.current;
    if (prevCount.current === 0) {
      // Muat awal (history): langsung ke bawah tanpa tombol.
      scrollToBottom(false);
    } else if (nearBottom()) {
      scrollToBottom(false);
      setUnread(0);
      const rows = box.querySelectorAll('.nb-row');
      const last = rows[rows.length - 1] as HTMLElement | undefined;
      if (last) popMessage(last);
    } else {
      setUnread((u) => u + added);
    }
    prevCount.current = messages.length;
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="nb-messages" role="log" aria-label="Riwayat pesan">
        <div className="nb-empty">
          <p className="font-head text-lg font-bold">Belum ada pesan.</p>
          <p className="mt-1 text-sm opacity-80">
            Jadilah yang pertama menyapa!
          </p>
        </div>
      </div>
    );
  }

  let prevDay = '';
  let prevName = '';

  return (
    <div
      ref={boxRef}
      className="nb-messages"
      role="log"
      aria-live="polite"
      aria-label="Riwayat pesan"
      onScroll={() => {
        if (nearBottom()) setUnread(0);
      }}
    >
      {messages.map((m) => {
        const own = m.name === ownName;
        const day = dayLabel(m.createdAt);
        const showDay = day !== prevDay;
        const sameAsPrev = !showDay && m.name === prevName && prevName !== '';
        prevDay = day;
        prevName = m.name;
        const initial = (m.name.trim().charAt(0) || '?').toUpperCase();
        return (
          <div key={`frag-${m.id}`} className="nb-frag">
            {showDay && day !== '' && (
              <p className="nb-day" aria-label={day}>
                {day}
              </p>
            )}
            <div
              className={`nb-row${own ? ' nb-row-own' : ''}${sameAsPrev ? ' nb-same' : ''}`}
            >
              {!own &&
                (sameAsPrev ? (
                  <span className="nb-avatar nb-avatar-hide" aria-hidden="true" />
                ) : (
                  <span
                    className="nb-avatar"
                    style={{ background: avatarColor(m.name) }}
                    aria-hidden="true"
                  >
                    {initial}
                  </span>
                ))}
              <div className={own ? 'nb-bubble-own' : 'nb-bubble'}>
                {!own && !sameAsPrev && (
                  <p className="nb-bubble-name">{m.name}</p>
                )}
                <p className="nb-bubble-body">{m.body}</p>
                <p className="nb-timestamp">{timeOf(m.createdAt)}</p>
              </div>
            </div>
          </div>
        );
      })}
      {unread > 0 && (
        <button
          type="button"
          className="nb-newmsg"
          onClick={() => {
            scrollToBottom(true);
            setUnread(0);
          }}
        >
          ↓ {unread} pesan baru
        </button>
      )}
    </div>
  );
}
