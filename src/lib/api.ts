// Fetch wrapper REST → backend Express (T-16).
// Token Clerk disuntik pemanggil (dari useAuth().getToken) agar lib tetap murni.

export async function api<T>(
  getToken: () => Promise<string | null>,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = await getToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? 'Terjadi kesalahan. Coba lagi.');
  return data;
}

export async function getProfile(getToken: () => Promise<string | null>) {
  return api<{ isNew: boolean; user: { id: string; displayName: string } }>(
    getToken,
    '/api/profile',
  );
}

export async function setDisplayName(
  getToken: () => Promise<string | null>,
  displayName: string,
) {
  return api<{ user: { id: string; displayName: string } }>(
    getToken,
    '/api/profile/',
    { method: 'PUT', body: JSON.stringify({ displayName }) },
  );
}

export interface RoomInfo {
  id: string;
  name: string;
  messageCount: number;
}

export async function getRooms(getToken: () => Promise<string | null>) {
  return api<{ rooms: RoomInfo[] }>(getToken, '/api/rooms/global');
}

export interface HistoryMessage {
  id: string;
  displayNameSnapshot: string;
  body: string;
  createdAt: string;
}

export async function getHistory(
  getToken: () => Promise<string | null>,
  roomId: string,
  limit = 50,
) {
  return api<{ room: RoomInfo; messages: HistoryMessage[] }>(
    getToken,
    `/api/rooms/global/${roomId}/messages?limit=${limit}`,
  );
}
