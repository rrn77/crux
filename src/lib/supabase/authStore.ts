import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './client';
import { useWorkoutStore } from '../store/workoutStore';
import { useTestStore } from '../store/testStore';

function loadUserData(userId: string) {
  useWorkoutStore.getState().setUserId(userId);
  useTestStore.getState().setUserId(userId);
  useWorkoutStore.getState().fetchAll(userId).catch(() => {});
  useTestStore.getState().fetchAll(userId).catch(() => {});
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  errorMessage: string | null;
  
  initAuth: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isConfigured: isSupabaseConfigured,
  errorMessage: null,

  initAuth: async () => {
    if (!supabase) {
      set({ isLoading: false, isConfigured: false });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({
        session,
        user: session?.user || null,
        isLoading: false,
        isConfigured: true,
      });

      if (session?.user) {
        loadUserData(session.user.id);
      }

      // Escuchar cambios de autenticación
      supabase.auth.onAuthStateChange(async (_event, newSession) => {
        set({
          session: newSession,
          user: newSession?.user || null,
          isLoading: false,
        });

        if (newSession?.user) {
          loadUserData(newSession.user.id);
        }
      });
    } catch {
      set({ isLoading: false });
    }
  },

  signInWithEmail: async (email, password) => {
    if (!supabase) {
      return { success: false, error: 'Supabase no está configurado en las variables de entorno.' };
    }

    set({ isLoading: true, errorMessage: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ isLoading: false, errorMessage: error.message });
        return { success: false, error: error.message };
      }

      set({
        user: data.user,
        session: data.session,
        isLoading: false,
        errorMessage: null,
      });

      if (data.user) {
        loadUserData(data.user.id);
      }

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al iniciar sesión';
      set({ isLoading: false, errorMessage: msg });
      return { success: false, error: msg };
    }
  },

  signUpWithEmail: async (email, password, name) => {
    if (!supabase) {
      return { success: false, error: 'Supabase no está configurado en las variables de entorno.' };
    }

    set({ isLoading: true, errorMessage: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name || email.split('@')[0],
          },
        },
      });

      if (error) {
        set({ isLoading: false, errorMessage: error.message });
        return { success: false, error: error.message };
      }

      set({
        user: data.user,
        session: data.session,
        isLoading: false,
        errorMessage: null,
      });

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al registrarse';
      set({ isLoading: false, errorMessage: msg });
      return { success: false, error: msg };
    }
  },

  signOut: async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    useWorkoutStore.getState().clearWorkoutStore();
    useTestStore.getState().clearTestStore();
    set({ user: null, session: null, errorMessage: null });
  },

  clearError: () => set({ errorMessage: null }),
}));
