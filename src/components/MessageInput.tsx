import { PaperPlaneRight } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';

// Batas server R6: 500 karakter — dijaga di klien + counter (T-34).
const MAX_BODY = 500;
const MAX_ROWS_PX = 152;

// Input pesan: Enter kirim, Shift+Enter baris baru (T-20).
// Textarea tumbuh otomatis 1–6 baris lalu scroll di dalam.
export function MessageInput({
  onSend,
  disabled,
}: {
  onSend: (body: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);

  const fit = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, MAX_ROWS_PX) + 'px';
  };

  useEffect(() => {
    fit();
  }, [value]);

  const send = () => {
    const body = value.trim();
    if (!body || disabled) return;
    onSend(body);
    setValue('');
  };

  return (
    <div className="nb-inputbar">
      <div className="nb-inputwrap">
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, MAX_BODY))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ketik pesan… (Enter untuk kirim)"
          rows={1}
          maxLength={MAX_BODY}
          disabled={disabled}
          aria-label="Ketik pesan"
          className="nb-input"
        />
        <p className="nb-count" aria-hidden="true">
          {value.length}/{MAX_BODY}
        </p>
      </div>
      <button
        type="button"
        onClick={send}
        disabled={disabled || !value.trim()}
        aria-label="Kirim pesan"
        className="nb-btn"
      >
        <PaperPlaneRight weight="bold" />
      </button>
    </div>
  );
}
