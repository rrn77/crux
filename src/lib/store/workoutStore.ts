import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WorkoutTemplate, WorkoutSession } from '../types';

interface WorkoutStore {
  templates: WorkoutTemplate[];
  sessions: WorkoutSession[];
  
  // Plantillas de ejercicios
  addTemplate: (template: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>) => WorkoutTemplate;
  updateTemplate: (id: string, template: Partial<WorkoutTemplate>) => void;
  deleteTemplate: (id: string) => void;
  getTemplateById: (id: string) => WorkoutTemplate | undefined;
  
  // Sesiones planificadas e historial
  scheduleSession: (sessionData: Omit<WorkoutSession, 'id'> & { id?: string }) => WorkoutSession;
  saveSession: (session: WorkoutSession) => void;
  updateSession: (id: string, data: Partial<WorkoutSession>) => void;
  deleteSession: (id: string) => void;
  getSessionById: (id: string) => WorkoutSession | undefined;
  getSessionsByDate: (dateStr: string) => WorkoutSession[];
  getTodaySession: () => WorkoutSession | undefined;

  // Limpieza de datos
  clearWorkoutStore: () => void;
}

export function getLocalDateIsoString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      templates: [],
      sessions: [],

      addTemplate: (templateData) => {
        const id = `template-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const now = new Date().toISOString();
        const newTemplate: WorkoutTemplate = {
          ...templateData,
          id,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          templates: [newTemplate, ...state.templates],
        }));

        return newTemplate;
      },

      updateTemplate: (id, data) => {
        set((state) => ({
          templates: state.templates.map((tpl) =>
            tpl.id === id
              ? { ...tpl, ...data, updatedAt: new Date().toISOString() }
              : tpl
          ),
        }));
      },

      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((tpl) => tpl.id !== id),
        }));
      },

      getTemplateById: (id) => {
        return get().templates.find((tpl) => tpl.id === id);
      },

      scheduleSession: (sessionData) => {
        const id = sessionData.id || `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
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

        return scheduledSession;
      },

      saveSession: (session) => {
        const scheduledDate =
          session.scheduledDate ||
          getLocalDateIsoString(new Date(session.startedAt || Date.now()));

        const enrichedSession: WorkoutSession = {
          ...session,
          scheduledDate,
        };

        set((state) => ({
          sessions: [enrichedSession, ...state.sessions.filter((s) => s.id !== session.id)],
        }));
      },

      updateSession: (id, data) => {
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...data } : s)),
        }));
      },

      deleteSession: (id) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
        }));
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
        set({ templates: [], sessions: [] });
      },
    }),
    {
      name: 'crux-workouts-store',
    }
  )
);
