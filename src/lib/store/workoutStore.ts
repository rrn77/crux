import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WorkoutTemplate, WorkoutSession } from '../types';

interface WorkoutStore {
  templates: WorkoutTemplate[];
  sessions: WorkoutSession[];
  
  // Plantillas
  addTemplate: (template: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>) => WorkoutTemplate;
  updateTemplate: (id: string, template: Partial<WorkoutTemplate>) => void;
  deleteTemplate: (id: string) => void;
  getTemplateById: (id: string) => WorkoutTemplate | undefined;
  
  // Sesiones de historial
  saveSession: (session: WorkoutSession) => void;
  deleteSession: (id: string) => void;
  getSessionById: (id: string) => WorkoutSession | undefined;

  // Limpieza de datos (para cambio de usuario o reset)
  clearWorkoutStore: () => void;
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

      saveSession: (session) => {
        set((state) => ({
          sessions: [session, ...state.sessions.filter((s) => s.id !== session.id)],
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

      clearWorkoutStore: () => {
        set({ templates: [], sessions: [] });
      },
    }),
    {
      name: 'crux-workouts-store',
    }
  )
);
