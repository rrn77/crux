import { create } from 'zustand';
import { WorkoutSession, WorkoutBlock, BlockLog } from '../types';
import { supabase } from '../supabase/client';

interface WorkoutStore {
  sessions: WorkoutSession[];
  userId: string | null;
  isLoading: boolean;

  // Sesión de usuario y carga de datos desde Supabase
  setUserId: (userId: string | null) => void;
  fetchAll: (userId: string) => Promise<void>;

  // Sesiones planificadas e historial
  scheduleSession: (sessionData: Omit<WorkoutSession, 'id'> & { id?: string }) => Promise<WorkoutSession>;
  saveSession: (session: WorkoutSession) => Promise<void>;
  updateSession: (id: string, data: Partial<WorkoutSession>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  getSessionById: (id: string) => WorkoutSession | undefined;
  getSessionsByDate: (dateStr: string) => WorkoutSession[];
  getTodaySession: () => WorkoutSession | undefined;

  // Limpieza de datos (cierre de sesión)
  clearWorkoutStore: () => void;
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getLocalDateIsoString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// El esquema de Supabase no tiene columnas propias para scheduledDate / status='scheduled' /
// la copia embebida de los bloques de la sesión, así que viajan serializados dentro de `notes`.
function serializeSessionNotes(
  notes?: string,
  scheduledDate?: string,
  status?: string,
  blocks?: WorkoutBlock[]
): string | undefined {
  if (!scheduledDate && (!blocks || blocks.length === 0) && status !== 'scheduled') {
    return notes;
  }
  return `[CRUX_SESSION]:${JSON.stringify({ notes: notes || '', scheduledDate, status, blocks })}`;
}

function deserializeSessionNotes(rawNotes?: string): {
  notes?: string;
  scheduledDate?: string;
  status?: WorkoutSession['status'];
  blocks?: WorkoutBlock[];
} {
  if (!rawNotes) return {};
  if (rawNotes.startsWith('[CRUX_SESSION]:')) {
    try {
      const parsed = JSON.parse(rawNotes.slice(15));
      return {
        notes: parsed.notes || undefined,
        scheduledDate: parsed.scheduledDate || undefined,
        status: parsed.status || undefined,
        blocks: parsed.blocks || undefined,
      };
    } catch {
      return { notes: rawNotes };
    }
  }
  return { notes: rawNotes };
}

function mapRemoteSession(s: Record<string, unknown>): WorkoutSession {
  const rawNotes = s.notes as string | undefined;
  const meta = deserializeSessionNotes(rawNotes);

  const scheduledDate =
    meta.scheduledDate ||
    (s.started_at ? getLocalDateIsoString(new Date(s.started_at as string)) : undefined);

  const realStatus = meta.status || (s.status as WorkoutSession['status']);

  return {
    id: s.id as string,
    userId: s.user_id as string,
    title: s.title as string,
    scheduledDate,
    startedAt: s.started_at as string,
    completedAt: s.completed_at as string | undefined,
    durationSeconds: Number(s.duration_seconds) || 0,
    overallRpe: s.overall_rpe ? Number(s.overall_rpe) : undefined,
    status: realStatus,
    notes: meta.notes,
    blocks: meta.blocks || [],
    logs: ((s.block_logs as Array<Record<string, unknown>>) || []).map((l) => ({
      id: l.id as string,
      sessionId: l.session_id as string,
      position: Number(l.position) || 0,
      blockTitle: l.block_title as string,
      blockType: l.block_type as WorkoutBlock['type'],
      status: l.status as BlockLog['status'],
      completedSets: Number(l.completed_sets) || 0,
      targetSets: Number(l.completed_sets) || 0,
      actualWorkSeconds: Number(l.actual_work_seconds) || 0,
      actualRestSeconds: Number(l.actual_rest_seconds) || 0,
      rpe: l.rpe ? Number(l.rpe) : undefined,
      notes: l.notes as string | undefined,
    })),
  };
}

async function pushSessionRow(session: WorkoutSession, userId: string) {
  if (!supabase) return;

  const remoteDbStatus = session.status === 'scheduled' ? 'in_progress' : session.status;

  const { error } = await supabase.from('workout_sessions').upsert({
    id: session.id,
    user_id: userId,
    title: session.title,
    started_at: session.startedAt,
    completed_at: session.completedAt,
    duration_seconds: session.durationSeconds,
    overall_rpe: session.overallRpe,
    status: remoteDbStatus,
    notes: serializeSessionNotes(session.notes, session.scheduledDate, session.status, session.blocks),
  });

  if (error) throw error;

  await supabase.from('block_logs').delete().eq('session_id', session.id);

  if (session.logs && session.logs.length > 0) {
    const logsToInsert = session.logs.map((log, idx) => ({
      session_id: session.id,
      position: idx,
      block_title: log.blockTitle,
      block_type: log.blockType,
      status: log.status,
      completed_sets: log.completedSets,
      actual_work_seconds: log.actualWorkSeconds,
      actual_rest_seconds: log.actualRestSeconds,
      rpe: log.rpe,
      notes: log.notes,
    }));

    const { error: logsErr } = await supabase.from('block_logs').insert(logsToInsert);
    if (logsErr) throw logsErr;
  }
}

export const useWorkoutStore = create<WorkoutStore>()((set, get) => ({
  sessions: [],
  userId: null,
  isLoading: false,

  setUserId: (userId) => set({ userId }),

  fetchAll: async (userId) => {
    if (!supabase) return;
    set({ isLoading: true });
    try {
      const { data: remoteSessions, error: sessErr } = await supabase
        .from('workout_sessions')
        .select('*, block_logs(*)')
        .eq('user_id', userId)
        .order('started_at', { ascending: false });

      if (sessErr) throw sessErr;

      set({ sessions: (remoteSessions || []).map(mapRemoteSession) });
    } catch (err) {
      console.warn('Error al cargar datos desde Supabase:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  scheduleSession: async (sessionData) => {
    const userId = get().userId;
    const id = sessionData.id || generateUUID();
    const scheduledSession: WorkoutSession = {
      ...sessionData,
      id,
      status: sessionData.status || 'scheduled',
      scheduledDate: sessionData.scheduledDate || getLocalDateIsoString(new Date(sessionData.startedAt || Date.now())),
      startedAt: sessionData.startedAt || new Date().toISOString(),
      durationSeconds: sessionData.durationSeconds || 0,
      blocks: sessionData.blocks || [],
      logs: sessionData.logs || [],
    };

    set((state) => ({
      sessions: [scheduledSession, ...state.sessions.filter((s) => s.id !== id)],
    }));

    if (supabase && userId) {
      try {
        await pushSessionRow(scheduledSession, userId);
      } catch (err) {
        console.warn('Error al guardar sesión en Supabase:', err);
      }
    }

    return scheduledSession;
  },

  saveSession: async (session) => {
    const userId = get().userId;
    const scheduledDate = session.scheduledDate || getLocalDateIsoString(new Date(session.startedAt || Date.now()));
    const enrichedSession: WorkoutSession = { ...session, scheduledDate };

    set((state) => ({
      sessions: [enrichedSession, ...state.sessions.filter((s) => s.id !== session.id)],
    }));

    if (supabase && userId) {
      try {
        await pushSessionRow(enrichedSession, userId);
      } catch (err) {
        console.warn('Error al guardar sesión en Supabase:', err);
      }
    }
  },

  updateSession: async (id, data) => {
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...data } : s)),
    }));

    if (!supabase) return;
    try {
      const session = get().sessions.find((s) => s.id === id);
      if (!session) return;

      const remoteDbStatus = session.status === 'scheduled' ? 'in_progress' : session.status;
      const { error } = await supabase
        .from('workout_sessions')
        .update({
          title: session.title,
          started_at: session.startedAt,
          completed_at: session.completedAt,
          duration_seconds: session.durationSeconds,
          overall_rpe: session.overallRpe,
          status: remoteDbStatus,
          notes: serializeSessionNotes(session.notes, session.scheduledDate, session.status, session.blocks),
        })
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.warn('Error al actualizar sesión en Supabase:', err);
    }
  },

  deleteSession: async (id) => {
    const { useActiveWorkoutStore } = await import('./activeWorkoutStore');
    const activeSession = useActiveWorkoutStore.getState().session;
    if (activeSession?.id === id) {
      useActiveWorkoutStore.getState().abandonSession();
    }

    set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) }));

    if (!supabase) return;
    try {
      await supabase.from('block_logs').delete().eq('session_id', id);
      const { error } = await supabase.from('workout_sessions').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.warn('Error al eliminar sesión en Supabase:', err);
    }
  },

  getSessionById: (id) => {
    return get().sessions.find((s) => s.id === id);
  },

  getSessionsByDate: (dateStr) => {
    // dateStr en formato YYYY-MM-DD
    return get().sessions.filter((s) => {
      if (s.scheduledDate === dateStr) return true;
      if (s.startedAt) {
        const startedIso = getLocalDateIsoString(new Date(s.startedAt));
        if (startedIso === dateStr) return true;
      }
      return false;
    });
  },

  getTodaySession: () => {
    const todayIso = getLocalDateIsoString();
    const sessionsToday = get().getSessionsByDate(todayIso);
    if (sessionsToday.length === 0) return undefined;

    // Prioridad: 1. Sesión en progreso o programada, 2. Última sesión completada
    const pending = sessionsToday.find((s) => s.status === 'in_progress' || s.status === 'scheduled');
    if (pending) return pending;

    return sessionsToday[0];
  },

  clearWorkoutStore: () => {
    set({ sessions: [], userId: null, isLoading: false });
  },
}));
