'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useActiveWorkoutStore } from '../store/activeWorkoutStore';

/**
 * Hook principal para consumir y controlar el temporizador de la sesión activa
 * Sincronizado automáticamente mediante timestamps e inmune al bloqueo de pantalla
 */
export function useWorkoutTimer() {
  const store = useActiveWorkoutStore();
  const tickRef = useRef<number | null>(null);

  // Ciclo de reloj de alta precisión (cada 250ms para no perder transiciones ni cuenta atrás)
  useEffect(() => {
    if (!store.isActive || !store.session) return;

    const intervalId = setInterval(() => {
      store.tick();
    }, 250);

    return () => clearInterval(intervalId);
  }, [store.isActive, store.session]);

  // Listener para eventos de visibilidad (cambio de pestaña, bloqueo de móvil, etc.)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        store.syncBackground();
      }
    };

    const handleFocus = () => {
      store.syncBackground();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const currentBlock = store.session && store.session.blocks[store.currentBlockIndex]
    ? store.session.blocks[store.currentBlockIndex]
    : null;

  const currentLog = store.session && store.session.logs[store.currentBlockIndex]
    ? store.session.logs[store.currentBlockIndex]
    : null;

  return {
    session: store.session,
    currentBlock,
    currentLog,
    currentBlockIndex: store.currentBlockIndex,
    totalBlocks: store.session?.blocks.length ?? 0,
    timerState: store.timerState,
    isActive: store.isActive,
    totalSessionElapsedSeconds: store.totalSessionElapsedSeconds,

    // Acciones de control
    startWorkout: store.startWorkout,
    startTimer: store.startTimer,
    pauseTimer: store.pauseTimer,
    resumeTimer: store.resumeTimer,
    skipPhase: store.skipPhase,
    adjustSeconds: store.adjustSeconds,
    nextBlock: store.nextBlock,
    prevBlock: store.prevBlock,
    finishCurrentBlock: store.finishCurrentBlock,
    setBlockNote: store.setBlockNote,
    setBlockRpe: store.setBlockRpe,
    completeSession: store.completeSession,
    abandonSession: store.abandonSession,
  };
}
