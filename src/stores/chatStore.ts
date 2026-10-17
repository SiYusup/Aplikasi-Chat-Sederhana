import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  name: string;
  body: string;
  createdAt: string;
}

// State chat global per-room (T-16, dipakai GlobalChatPage T-20).
interface ChatState {
  activeRoomId: string | null;
  messagesByRoom: Record<string, ChatMessage[]>;
  connected: boolean;
  setActiveRoom: (roomId: string | null) => void;
  setHistory: (roomId: string, messages: ChatMessage[]) => void;
  pushMessage: (roomId: string, message: ChatMessage) => void;
  setConnected: (connected: boolean) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeRoomId: null,
  messagesByRoom: {},
  connected: false,
  setActiveRoom: (activeRoomId) => set({ activeRoomId }),
  setHistory: (roomId, messages) =>
    set((s) => ({
      messagesByRoom: { ...s.messagesByRoom, [roomId]: messages },
    })),
  pushMessage: (roomId, message) =>
    set((s) => ({
      messagesByRoom: {
        ...s.messagesByRoom,
        [roomId]: [...(s.messagesByRoom[roomId] ?? []), message],
      },
    })),
  setConnected: (connected) => set({ connected }),
  reset: () =>
    set({ activeRoomId: null, messagesByRoom: {}, connected: false }),
}));
