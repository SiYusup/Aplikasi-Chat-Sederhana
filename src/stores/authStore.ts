import { create } from 'zustand';

// Profil lokal hasil GET /api/profile (T-09). Diisi setelah login (Alur 1).
interface AuthState {
  displayName: string;
  isNew: boolean;
  loaded: boolean;
  setProfile: (displayName: string, isNew: boolean) => void;
  rename: (displayName: string) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  displayName: 'anonymous',
  isNew: false,
  loaded: false,
  setProfile: (displayName, isNew) => set({ displayName, isNew, loaded: true }),
  rename: (displayName) => set({ displayName }),
  reset: () => set({ displayName: 'anonymous', isNew: false, loaded: false }),
}));
