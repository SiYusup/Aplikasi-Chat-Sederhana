import { useAuth } from '@clerk/react';
import { ArrowLeft, Copy } from '@phosphor-icons/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { MessageInput } from '../components/MessageInput';
import { MessageList, type BubbleMessage } from '../components/MessageList';
import { bounceToast, wiggleCode } from '../lib/motion';
import { touchSessionActivity } from '../lib/sessionActivity';
import { connectSocket, getSocket } from '../lib/socket';
import { useAuthStore } from '../stores/authStore';

interface PrivateMsg {
  id: string;
  displayName: string;
  body: string;
  createdAt: string;
}

// /private — buat/gabung room 1-on-1 lalu chat (T-21, Alur 3 + FR-14–17).
export function PrivateChatPage() {
  const { getToken } = useAuth();
  const displayName = useAuthStore((s) => s.displayName);
  const [code, setCode] = useState<string | null>(null);
  const [peerCount, setPeerCount] = useState(1);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<BubbleMessage[]>([]);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const codeRef = useRef<HTMLDivElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const token = await getToken();
      if (!alive || !token) return;
      const socket = connectSocket(token);
      socket.on('private:created', (p: { code: string }) => {
        setCode(p.code);
        setPeerCount(1);
        setMessages([]);
      });
      socket.on(
        'private:joined',
        (p: { code: string; participantCount: number }) => {
          setCode(p.code);
          setPeerCount(p.participantCount);
          setMessages([]);
          setError('');
        },
      );
      socket.on('private:peer-joined', (p: { displayName: string }) => {
        setPeerCount(2);
        showToast(`${p.displayName} bergabung.`);
      });
      socket.on('private:peer-left', (p: { displayName: string }) => {
        setPeerCount(1);
        showToast(`${p.displayName} keluar.`);
      });
      socket.on('private:closed', (p: { code: string; message?: string }) => {
        showToast(p.message ?? 'Room terhapus otomatis.');
        setCode(null);
        setMessages([]);
      });
      socket.on('private:message', (m: PrivateMsg) => {
        setMessages((prev) => [...prev, { ...m, name: m.displayName }]);
      });
      socket.on('error', (p: { message?: string }) => {
        setError(p.message ?? 'Terjadi kesalahan.');
        if (codeRef.current) wiggleCode(codeRef.current);
      });
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (toast && toastRef.current) bounceToast(toastRef.current);
  }, [toast]);

  const showToast = useCallback((text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(''), 3500);
  }, []);

  const create = useCallback(() => {
    setError('');
    getSocket()?.emit('private:create');
  }, []);

  const join = useCallback(() => {
    const normalized = input.trim().toUpperCase();
    if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalized)) {
      setError('Format kode: XXXX-XXXX (huruf/angka).');
      if (codeRef.current) wiggleCode(codeRef.current);
      return;
    }
    setError('');
    getSocket()?.emit('private:join', { code: normalized });
  }, [input]);

  const leave = useCallback(() => {
    if (code) getSocket()?.emit('private:leave', { code });
    setCode(null);
    setMessages([]);
  }, [code]);

  const copy = useCallback(async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      showToast('Kode tersalin.');
    } catch {
      showToast('Gagal menyalin.');
    }
  }, [code, showToast]);

  const send = useCallback(
    (body: string) => {
      touchSessionActivity();
      getSocket()?.emit('private:message', { code, body });
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          name: displayName,
          body,
          createdAt: new Date().toISOString(),
        },
      ]);
    },
    [code, displayName],
  );

  // Mode B: di dalam room
  if (code) {
    return (
      <div className="nb-shell-single">
        <header className="nb-header">
          <Link to="/" aria-label="Kembali" className="nb-btn-icon">
            <ArrowLeft weight="bold" />
          </Link>
          <h1 className="font-head text-xl font-bold">Room {code}</h1>
          <button
            type="button"
            onClick={copy}
            aria-label="Salin kode room"
            title="Salin kode"
            className="nb-btn-icon"
          >
            <Copy weight="bold" />
          </button>
          <span className="nb-badge">
            {peerCount >= 2 ? 'Terhubung (2/2)' : 'Menunggu teman… (1/2)'}
          </span>
          <button type="button" onClick={leave} className="nb-btn-sm">
            Keluar
          </button>
        </header>
        {toast && (
          <div ref={toastRef} role="status" className="nb-toast">
            {toast}
          </div>
        )}
        <MessageList messages={messages} ownName={displayName} />
        <MessageInput onSend={send} disabled={peerCount < 2} />
      </div>
    );
  }

  // Mode A: buat / gabung
  return (
    <main className="nb-center">
      <div className="nb-card">
        <Link to="/" className="nb-link">
          ← Kembali
        </Link>
        <h1 className="font-head mt-2 text-2xl font-bold">
          Private Chat 1-on-1
        </h1>
        <div className="mt-4">
          <h2 className="font-head font-semibold">Buat Room</h2>
          <button type="button" onClick={create} className="nb-btn mt-2 w-full">
            Buat Room Baru
          </button>
        </div>
        <div className="mt-6" ref={codeRef}>
          <h2 className="font-head font-semibold">Gabung Room</h2>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX"
            maxLength={9}
            aria-label="Kode room"
            className="nb-input nb-room-code mt-2"
          />
          <button type="button" onClick={join} className="nb-btn mt-2 w-full">
            Gabung
          </button>
        </div>
        {error && (
          <p role="alert" className="nb-error mt-3">
            {error}
          </p>
        )}
        {toast && (
          <div ref={toastRef} role="status" className="nb-toast mt-3">
            {toast}
          </div>
        )}
      </div>
    </main>
  );
}
