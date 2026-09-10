import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WorkoutTemplate, WorkoutSession } from '../types';
import { DEFAULT_TEMPLATES } from '@/data/defaultTemplates';

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
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      templates: DEFAULT_TEMPLATES,
      sessions: [
        {
          id: 'demo-session-1',
          title: 'ULAC (Umbral Láctico Acumulado)',
          startedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          completedAt: new Date(Date.now() - 86400000 * 2 + 1020000).toISOString(),
          durationSeconds: 1020,
          overallRpe: 8,
          status: 'completed',
          notes: 'Buena sensación en la 3ª serie, antebrazos inflados pero buen control.',
          blocks: [DEFAULT_TEMPLATES[0].blocks[0]],
          logs: [
            {
              id: 'log-1',
              sessionId: 'demo-session-1',
              position: 0,
              blockTitle: 'ULAC 3x1',
              blockType: 'intervals',
              status: 'completed',
              completedSets: 4,
              targetSets: 4,
              actualWorkSeconds: 720,
              actualRestSeconds: 240,
              rpe: 8,
              notes: 'Cumplidas las 4 series completas.',
            },
          ],
        },
        {
          id: 'demo-session-2',
          title: 'BLOQUES CORTOS',
          startedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
          completedAt: new Date(Date.now() - 86400000 * 4 + 1850000).toISOString(),
          durationSeconds: 1850,
          overallRpe: 9,
          status: 'completed',
          notes: 'Encadené el 2º bloque al 3er intento. Muy buena sesión de bloque.',
          blocks: [DEFAULT_TEMPLATES[1].blocks[0]],
          logs: [
            {
              id: 'log-2',
              sessionId: 'demo-session-2',
              position: 0,
              blockTitle: 'Bloques de Alta Intensidad',
              blockType: 'problems',
              status: 'completed',
              completedSets: 16,
              targetSets: 16,
              actualWorkSeconds: 400,
              actualRestSeconds: 1440,
              rpe: 9,
              notes: '4 bloques completados.',
            },
          ],
        },
      ],

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
    }),
    {
      name: 'crux-workouts-store',
    }
  )
);
