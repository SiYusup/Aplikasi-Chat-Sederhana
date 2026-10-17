import { useAuth, useClerk } from '@clerk/react';
import { ChatCircle, PencilSimple, SignOut } from '@phosphor-icons/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { MessageInput } from '../components/MessageInput';
import { MessageList } from '../components/MessageList';
import { ThemeToggle } from '../components/ThemeToggle';
import { getProfile, getRooms, setDisplayName } from '../lib/api';
import { touchSessionActivity } from '../lib/sessionActivity';
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  rememberRoom,
} from '../lib/socket';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';

// / — chat global room Umum + MessageList + MessageInput (T-20, Alur 2).
// T-32: tanpa sidebar room — langsung room Umum; kartu konfirmasi nama
// saat masuk (kosong = "anonymous").
export function GlobalChatPage() {
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const displayName = useAuthStore((s) => s.displayName);
  const profileLoaded = useAuthStore((s) => s.loaded);
  const setProfile = useAuthStore((s) => s.setProfile);
  const rename = useAuthStore((s) => s.rename);
  const resetAuth = useAuthStore((s) => s.reset);
  const activeRoomId = useChatStore((s) => s.activeRoomId);
  const messagesByRoom = useChatStore((s) => s.messagesByRoom);
  const connected = useChatStore((s) => s.connected);
  const setActiveRoom = useChatStore((s) => s.setActiveRoom);
  const setHistory = useChatStore((s) => s.setHistory);
  const pushMessage = useChatStore((s) => s.pushMessage);
  const setConnected = useChatStore((s) => s.setConnected);
  const resetChat = useChatStore((s) => s.reset);

  const [error, setError] = useState('');
  const [nameCard, setNameCard] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardBusy, setCardBusy] = useState(false);
  const activeRoomRef = useRef<string | null>(null);
  activeRoomRef.current = activeRoomId;

  // Profil + daftar room + koneksi socket (sekali per login).

  // Profil + daftar room + koneksi socket (sekali per login).
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const profile = await getProfile(getToken);
        if (!alive) return;
        setProfile(profile.user.displayName, profile.isNew);
        if (profile.isNew) {
          setCardName('');
          setNameCard(true);
        }
        const { rooms } = await getRooms(getToken);
        if (!alive) return;
        const umum =
          rooms.find((r) => r.name.toLowerCase() === 'umum') ?? rooms[0];
        if (umum && !useChatStore.getState().activeRoomId) {
          setActiveRoom(umum.id);
        }
        const token = await getToken();
        if (!alive || !token) return;
        const socket = connectSocket(token);
        setConnected(socket.connected);
        socket.on('connect', () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));
        socket.on(
          'global:history',
          (p: {
            roomId: string;
            messages: {
              id: string;
              displayNameSnapshot: string;
              body: string;
              createdAt: string;
            }[];
          }) => {
            setHistory(
              p.roomId,
              p.messages.map((m) => ({
                id: m.id,
                name: m.displayNameSnapshot,
                body: m.body,
                createdAt: m.createdAt,
              })),
            );
          },
        );
        socket.on(
          'global:message',
          (m: {
            id: string;
            displayNameSnapshot: string;
            body: string;
            createdAt: string;
            roomId?: string;
          }) => {
            const roomId = m.roomId ?? activeRoomRef.current;
            if (!roomId) return;
            pushMessage(roomId, {
              id: m.id,
              name: m.displayNameSnapshot,
              body: m.body,
              createdAt: m.createdAt,
            });
          },
        );
        socket.on('error', (p: { message?: string }) => {
          setError(p.message ?? 'Terjadi kesalahan.');
        });
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Gagal memuat.');
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Join room aktif (tiap ganti room). Ingat room DULU agar join ulang
  // otomatis tetap jalan walau socket belum terhubung saat efek jalan.
  useEffect(() => {
    if (!activeRoomId) return;
    rememberRoom(activeRoomId);
    const socket = getSocket();
    if (!socket) return;
    const doJoin = () => socket.emit('global:join', { roomId: activeRoomId });
    if (socket.connected) doJoin();
    else socket.once('connect', doJoin);
    return () => {
      socket.off('connect', doJoin);
      socket.emit('global:leave', { roomId: activeRoomId });
    };
  }, [activeRoomId]);

  const logout = useCallback(() => {
    disconnectSocket();
    resetChat();
    resetAuth();
    void signOut({ redirectUrl: '/sign-in' });
  }, [signOut, resetChat, resetAuth]);

  const openNameCard = useCallback(() => {
    setCardName(displayName === 'anonymous' ? '' : displayName);
    setError('');
    setNameCard(true);
  }, [displayName]);

  // Simpan nama (kosong = "anonymous") lalu tutup kartu.
  const submitName = useCallback(async () => {
    const finalName = cardName.trim().slice(0, 30) || 'anonymous';
    setCardBusy(true);
    try {
      if (finalName !== displayName) {
        const res = await setDisplayName(getToken, finalName);
        rename(res.user.displayName);
      } else {
        setProfile(displayName, false);
      }
      setNameCard(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan nama.');
    } finally {
      setCardBusy(false);
    }
  }, [cardName, displayName, getToken, rename, setProfile]);

  const send = useCallback(
    (body: string) => {
      touchSessionActivity();
      getSocket()?.emit('global:message', { roomId: activeRoomId, body });
    },
    [activeRoomId],
  );

  const messages =
    (activeRoomId ? messagesByRoom[activeRoomId] : undefined) ?? [];

  return (
    <div className="nb-shell-single">
      <section className="nb-main">
        <header className="nb-header">
          <div className="nb-title">
            <h1 className="font-head text-xl font-bold"># Umum</h1>
            <p className="nb-sub">Chat global · anonim</p>
          </div>
          <span
            className={connected ? 'nb-dot-on' : 'nb-dot-off'}
            title={connected ? 'Terhubung' : 'Terputus'}
          />
          <span className="nb-me">{displayName}</span>
          <ThemeToggle />
          <button
            type="button"
            onClick={openNameCard}
            aria-label="Ganti nama tampilan"
            title="Ganti nama"
            className="nb-btn-icon"
          >
            <PencilSimple weight="bold" />
          </button>
          <Link
            to="/private"
            aria-label="Private chat"
            title="Private chat"
            className="nb-btn-icon"
          >
            <ChatCircle weight="bold" />
          </Link>
          <button
            type="button"
            onClick={logout}
            aria-label="Keluar"
            title="Keluar"
            className="nb-btn-icon"
          >
            <SignOut weight="bold" />
          </button>
        </header>

        {error && (
          <p role="alert" className="nb-error">
            {error}
          </p>
        )}
        {profileLoaded && (
          <>
            <MessageList messages={messages} ownName={displayName} />
            <MessageInput
              onSend={send}
              disabled={!connected || !activeRoomId}
            />
          </>
        )}
      </section>

      {nameCard && (
        <div className="nb-overlay" role="dialog" aria-modal="true" aria-label="Isi nama tampilan">
          <div className="nb-card">
            <h1 className="font-head text-2xl font-bold">Siapa namamu?</h1>
            <p className="mt-1 text-sm opacity-80">
              Kosongkan = tetap <b>anonymous</b>. Email/nama aslimu tidak
              pernah ditampilkan.
            </p>
            <input
              value={cardName}
              onChange={(e) => setCardName(e.target.value.slice(0, 30))}
              placeholder="cth: gamerXYZ"
              maxLength={30}
              aria-label="Nama tampilan"
              className="nb-input mt-4"
            />
            <p className="mt-1 text-right text-xs opacity-70">
              {cardName.length}/30
            </p>
            <button
              type="button"
              onClick={() => void submitName()}
              disabled={cardBusy}
              className="nb-btn mt-4 w-full"
            >
              Mulai Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
