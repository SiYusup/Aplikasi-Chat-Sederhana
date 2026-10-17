// Jendela sesi login (T-31): login tercatat 3 hari. Setiap aktivitas
// (pindah halaman, kirim pesan) memperbarui catatan; lewat 3 hari tanpa
// aktivitas -> ProtectedRoute mengeluarkan user (wajib login ulang).
// Nilai tetap 3 hari sesuai permintaan — bukan konfigurasi.

const KEY = 'anonchat:lastActive';
export const SESSION_ACTIVE_DAYS = 3;
const WINDOW_MS = SESSION_ACTIVE_DAYS * 24 * 60 * 60 * 1000;

function readTs(): number | null {
  try {
    const raw = localStorage.getItem(KEY);
    const ts = raw ? Number(raw) : NaN;
    return Number.isFinite(ts) && ts > 0 ? ts : null;
  } catch {
    return null;
  }
}

/** Catat aktivitas sekarang (dipanggil saat login tiba & tiap aktivitas). */
export function touchSessionActivity(): void {
  try {
    localStorage.setItem(KEY, String(Date.now()));
  } catch {
    // localStorage penuh/diblokir: abaikan, sesi Clerk tetap penentu akhir.
  }
}

/** True bila ada catatan dan umurnya lewat 3 hari. Tanpa catatan = sesi baru. */
export function isSessionStale(): boolean {
  const ts = readTs();
  if (ts === null) return false;
  return Date.now() - ts > WINDOW_MS;
}

export function clearSessionActivity(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // abaikan
  }
}
