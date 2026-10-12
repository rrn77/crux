import { create } from 'zustand';
import { RockSession } from '../types';
import { supabase } from '../supabase/client';

interface RockSessionStore {
  rockSessions: RockSession[];
  userId: string | null;
  isLoading: boolean;

  setUserId: (userId: string | null) => void;
  fetchAll: (userId: string) => Promise<void>;

  addRockSession: (data: Omit<RockSession, 'id' | 'createdAt'>) => Promise<RockSession>;
  updateRockSession: (id: string, data: Partial<RockSession>) => Promise<void>;
  deleteRockSession: (id: string) => Promise<void>;
  getRockSessionsByDate: (dateStr: string) => RockSession[];
  getUniqueTitles: () => string[];
  clearRockSessionStore: () => void;
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function mapRemoteRockSession(r: Record<string, unknown>): RockSession {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    title: r.title as string,
    date: r.session_date as string,
    notes: r.notes as string | undefined,
    rating: r.rating ? Number(r.rating) : undefined,
    createdAt: r.created_at as string,
  };
}

export const useRockSessionStore = create<RockSessionStore>()((set, get) => ({
  rockSessions: [],
  userId: null,
  isLoading: false,

  setUserId: (userId) => set({ userId }),

  fetchAll: async (userId) => {
    if (!supabase) return;
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('rock_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('session_date', { ascending: false });
      if (error) throw error;
      set({ rockSessions: (data || []).map(mapRemoteRockSession) });
    } catch (err) {
      console.warn('Error al cargar sesiones de roca desde Supabase:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  addRockSession: async (data) => {
    const userId = get().userId;
    const id = generateUUID();
    const newSession: RockSession = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({ rockSessions: [newSession, ...state.rockSessions] }));

    if (supabase && userId) {
      try {
        const { error } = await supabase.from('rock_sessions').insert({
          id,
          user_id: userId,
          title: newSession.title,
          session_date: newSession.date,
          notes: newSession.notes,
          rating: newSession.rating,
        });
        if (error) throw error;
      } catch (err) {
        console.warn('Error al guardar sesión de roca en Supabase:', err);
      }
    }

    return newSession;
  },

  updateRockSession: async (id, data) => {
    set((state) => ({
      rockSessions: state.rockSessions.map((r) => (r.id === id ? { ...r, ...data } : r)),
    }));

    if (!supabase) return;
    try {
      const session = get().rockSessions.find((r) => r.id === id);
      if (!session) return;

      const { error } = await supabase
        .from('rock_sessions')
        .update({
          title: session.title,
          session_date: session.date,
          notes: session.notes,
          rating: session.rating,
        })
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.warn('Error al actualizar sesión de roca en Supabase:', err);
    }
  },

  deleteRockSession: async (id) => {
    set((state) => ({ rockSessions: state.rockSessions.filter((r) => r.id !== id) }));

    if (!supabase) return;
    try {
      const { error } = await supabase.from('rock_sessions').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.warn('Error al eliminar sesión de roca en Supabase:', err);
    }
  },

  getRockSessionsByDate: (dateStr) => {
    return get().rockSessions.filter((r) => r.date === dateStr);
  },

  getUniqueTitles: () => {
    const titles = get().rockSessions.map((r) => r.title);
    return Array.from(new Set(titles));
  },

  clearRockSessionStore: () => {
    set({ rockSessions: [], userId: null, isLoading: false });
  },
}));
