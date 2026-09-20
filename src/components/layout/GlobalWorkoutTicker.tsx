'use client';

import { useEffect } from 'react';
import { useActiveWorkoutStore } from '@/lib/store/activeWorkoutStore';

/**
 * Mantiene vivo el temporizador de la sesión activa independientemente de la pantalla
 * en la que esté el usuario dentro de la app (no solo en /workout/active), y resincroniza
 * al volver de segundo plano o de un cambio de pestaña.
 */
export function GlobalWorkoutTicker() {
  const isActive = useActiveWorkoutStore((s) => s.isActive);
  const session = useActiveWorkoutStore((s) => s.session);

  useEffect(() => {
    if (!isActive || !session) return;

    const intervalId = setInterval(() => {
      useActiveWorkoutStore.getState().tick();
    }, 250);

    return () => clearInterval(intervalId);
  }, [isActive, session]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        useActiveWorkoutStore.getState().syncBackground();
      }
    };

    const handleFocus = () => {
      useActiveWorkoutStore.getState().syncBackground();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return null;
}
