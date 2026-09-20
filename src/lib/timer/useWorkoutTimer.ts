'use client';

import { useActiveWorkoutStore } from '../store/activeWorkoutStore';

/**
 * Hook principal para consumir y controlar el temporizador de la sesión activa.
 * El "tick" en sí (setInterval + resincronización con timestamps ante bloqueo de
 * pantalla o segundo plano) corre a nivel global en <GlobalWorkoutTicker />, para que
 * el conteo siga avanzando aunque el usuario salga de /workout/active dentro de la app.
 */
export function useWorkoutTimer() {
  const store = useActiveWorkoutStore();

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
