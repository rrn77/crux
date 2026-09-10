import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WorkoutSession, WorkoutBlock, BlockLog, TimerPhase } from '../types';
import {
  TimerEngineState,
  initializeBlockTimer,
  startTimerPhase,
  pauseTimer,
  resumeTimer,
  calculateRemainingSeconds,
  adjustTimerSeconds,
  transitionOnTimerExpired,
  skipCurrentPhase,
  recoverFromBackground,
  getBlockTargetUnits,
} from '../timer/timerEngine';
import { audioFeedback } from '../timer/audioService';
import { useSettingsStore } from './settingsStore';
import { useWorkoutStore, generateUUID } from './workoutStore';

interface ActiveWorkoutStore {
  session: WorkoutSession | null;
  currentBlockIndex: number;
  timerState: TimerEngineState;
  isActive: boolean;
  totalSessionElapsedSeconds: number;
  lastTickTimestamp: number | null;

  // Acciones
  startWorkout: (
    title: string,
    blocks: WorkoutBlock[],
    existingSessionId?: string,
    scheduledDate?: string
  ) => void;
  startTimer: (phaseOverride?: 'work' | 'rest') => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  tick: () => void;
  skipPhase: () => void;
  adjustSeconds: (delta: number) => void;
  nextBlock: () => void;
  prevBlock: () => void;
  finishCurrentBlock: () => void;
  setBlockNote: (notes: string) => void;
  setBlockRpe: (rpe: number) => void;
  completeSession: (overallRpe: number, sessionNotes?: string) => WorkoutSession | null;
  abandonSession: () => void;
  syncBackground: () => void;
}

export const useActiveWorkoutStore = create<ActiveWorkoutStore>()(
  persist(
    (set, get) => ({
      session: null,
      currentBlockIndex: 0,
      timerState: {
        phase: 'idle',
        currentSet: 1,
        currentProblemIndex: 1,
        currentAttempt: 1,
        phaseDurationSeconds: 60,
        phaseStartTime: null,
        phaseTargetEnd: null,
        secondsRemaining: 60,
        isRunning: false,
        isPaused: false,
        pausedRemainingSeconds: null,
        completedSetsInBlock: 0,
        totalWorkSecondsLogged: 0,
        totalRestSecondsLogged: 0,
      },
      isActive: false,
      totalSessionElapsedSeconds: 0,
      lastTickTimestamp: null,

      startWorkout: (title, blocks, existingSessionId, scheduledDate) => {
        if (!blocks || blocks.length === 0) return;

        const now = new Date().toISOString();
        const sessionId = existingSessionId || generateUUID();
        const initialLogs: BlockLog[] = blocks.map((b, idx) => {
          const { totalSets } = getBlockTargetUnits(b);
          return {
            id: generateUUID(),
            sessionId,
            blockId: b.id,
            position: idx,
            blockTitle: b.title,
            blockType: b.type,
            status: idx === 0 ? 'in_progress' : 'pending',
            completedSets: 0,
            targetSets: totalSets,
            actualWorkSeconds: 0,
            actualRestSeconds: 0,
            notes: b.notes || '',
          };
        });

        const newSession: WorkoutSession = {
          id: sessionId,
          title: title || 'Sesión de Entrenamiento',
          scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
          startedAt: now,
          durationSeconds: 0,
          status: 'in_progress',
          blocks,
          logs: initialLogs,
        };

        if (existingSessionId) {
          useWorkoutStore.getState().updateSession(existingSessionId, {
            status: 'in_progress',
            startedAt: now,
          });
        }

        const initialTimer = initializeBlockTimer(blocks[0]);

        set({
          session: newSession,
          currentBlockIndex: 0,
          timerState: initialTimer,
          isActive: true,
          totalSessionElapsedSeconds: 0,
          lastTickTimestamp: Date.now(),
        });
      },

      startTimer: (phaseOverride) => {
        const { session, currentBlockIndex, timerState } = get();
        if (!session || !session.blocks[currentBlockIndex]) return;

        const currentBlock = session.blocks[currentBlockIndex];
        const nextState = startTimerPhase(timerState, currentBlock, phaseOverride);

        const settings = useSettingsStore.getState();
        if (settings.soundEnabled) {
          if (nextState.phase === 'work') audioFeedback.playWorkStart();
          else if (nextState.phase === 'rest') audioFeedback.playRestStart();
        }
        if (settings.vibrationEnabled) {
          if (nextState.phase === 'work') audioFeedback.vibrateWork();
          else if (nextState.phase === 'rest') audioFeedback.vibrateRest();
        }

        set({ timerState: nextState });
      },

      pauseTimer: () => {
        const { timerState } = get();
        const nextState = pauseTimer(timerState);
        set({ timerState: nextState });
      },

      resumeTimer: () => {
        const { timerState } = get();
        const nextState = resumeTimer(timerState);
        set({ timerState: nextState });
      },

      tick: () => {
        const { session, currentBlockIndex, timerState, lastTickTimestamp, totalSessionElapsedSeconds } = get();
        if (!session || !session.blocks[currentBlockIndex]) return;

        const now = Date.now();
        const block = session.blocks[currentBlockIndex];
        const deltaSessionSec = lastTickTimestamp ? Math.floor((now - lastTickTimestamp) / 1000) : 1;
        const newTotalElapsed = totalSessionElapsedSeconds + (deltaSessionSec > 0 && deltaSessionSec < 5 ? deltaSessionSec : 1);

        if (!timerState.isRunning || timerState.isPaused) {
          set({
            totalSessionElapsedSeconds: newTotalElapsed,
            lastTickTimestamp: now,
          });
          return;
        }

        const remaining = calculateRemainingSeconds(timerState, now);

        // Alerta sonora en los últimos 3 segundos
        const settings = useSettingsStore.getState();
        if (remaining > 0 && remaining <= 3 && remaining !== timerState.secondsRemaining) {
          if (settings.soundEnabled) audioFeedback.playCountdown();
          if (settings.vibrationEnabled) audioFeedback.vibrateCountdown();
        }

        if (remaining > 0) {
          set({
            timerState: { ...timerState, secondsRemaining: remaining },
            totalSessionElapsedSeconds: newTotalElapsed,
            lastTickTimestamp: now,
          });
          return;
        }

        // El tiempo expiró -> Ejecutar transición
        const transition = transitionOnTimerExpired(timerState, block, now);

        if (settings.soundEnabled) {
          if (transition.soundToPlay === 'rest') audioFeedback.playRestStart();
          else if (transition.soundToPlay === 'work') audioFeedback.playWorkStart();
          else if (transition.soundToPlay === 'success') audioFeedback.playSuccess();
        }
        if (settings.vibrationEnabled) {
          if (transition.soundToPlay === 'rest') audioFeedback.vibrateRest();
          else if (transition.soundToPlay === 'work') audioFeedback.vibrateWork();
        }

        // Actualizar el log del bloque correspondiente
        const updatedLogs = session.logs.map((log, idx) => {
          if (idx === currentBlockIndex) {
            return {
              ...log,
              completedSets: transition.nextState.completedSetsInBlock,
              actualWorkSeconds: transition.nextState.totalWorkSecondsLogged,
              actualRestSeconds: transition.nextState.totalRestSecondsLogged,
              status: transition.nextState.phase === 'blockCompleted' ? 'completed' : 'in_progress',
            } as BlockLog;
          }
          return log;
        });

        set({
          timerState: transition.nextState,
          session: { ...session, logs: updatedLogs },
          totalSessionElapsedSeconds: newTotalElapsed,
          lastTickTimestamp: now,
        });
      },

      skipPhase: () => {
        const { session, currentBlockIndex, timerState } = get();
        if (!session || !session.blocks[currentBlockIndex]) return;

        const now = Date.now();
        const block = session.blocks[currentBlockIndex];
        const transition = skipCurrentPhase(timerState, block, now);

        const settings = useSettingsStore.getState();
        if (settings.soundEnabled) {
          if (transition.soundToPlay === 'rest') audioFeedback.playRestStart();
          else if (transition.soundToPlay === 'work') audioFeedback.playWorkStart();
          else if (transition.soundToPlay === 'success') audioFeedback.playSuccess();
        }
        if (settings.vibrationEnabled) {
          if (transition.soundToPlay === 'rest') audioFeedback.vibrateRest();
          else if (transition.soundToPlay === 'work') audioFeedback.vibrateWork();
        }

        const updatedLogs = session.logs.map((log, idx) => {
          if (idx === currentBlockIndex) {
            return {
              ...log,
              completedSets: transition.nextState.completedSetsInBlock,
              actualWorkSeconds: transition.nextState.totalWorkSecondsLogged,
              actualRestSeconds: transition.nextState.totalRestSecondsLogged,
              status: transition.nextState.phase === 'blockCompleted' ? 'completed' : 'in_progress',
            } as BlockLog;
          }
          return log;
        });

        set({
          timerState: transition.nextState,
          session: { ...session, logs: updatedLogs },
        });
      },

      adjustSeconds: (delta) => {
        const { timerState } = get();
        const nextState = adjustTimerSeconds(timerState, delta);
        set({ timerState: nextState });
      },

      nextBlock: () => {
        const { session, currentBlockIndex } = get();
        if (!session) return;

        const nextIndex = currentBlockIndex + 1;
        if (nextIndex < session.blocks.length) {
          const nextBlock = session.blocks[nextIndex];
          const newTimer = initializeBlockTimer(nextBlock);

          const updatedLogs = session.logs.map((log, idx) => {
            if (idx === currentBlockIndex && log.status === 'in_progress') {
              return { ...log, status: 'completed' as const };
            }
            if (idx === nextIndex) {
              return { ...log, status: 'in_progress' as const };
            }
            return log;
          });

          set({
            currentBlockIndex: nextIndex,
            timerState: newTimer,
            session: { ...session, logs: updatedLogs },
          });
        }
      },

      prevBlock: () => {
        const { session, currentBlockIndex } = get();
        if (!session || currentBlockIndex <= 0) return;

        const prevIndex = currentBlockIndex - 1;
        const prevBlock = session.blocks[prevIndex];
        const newTimer = initializeBlockTimer(prevBlock);

        set({
          currentBlockIndex: prevIndex,
          timerState: newTimer,
        });
      },

      finishCurrentBlock: () => {
        const { session, currentBlockIndex, timerState } = get();
        if (!session) return;

        const updatedLogs = session.logs.map((log, idx) => {
          if (idx === currentBlockIndex) {
            return {
              ...log,
              status: 'completed' as const,
              completedSets: timerState.completedSetsInBlock || log.targetSets,
            };
          }
          return log;
        });

        set({
          timerState: {
            ...timerState,
            phase: 'blockCompleted',
            isRunning: false,
            isPaused: false,
          },
          session: { ...session, logs: updatedLogs },
        });

        const settings = useSettingsStore.getState();
        if (settings.soundEnabled) audioFeedback.playSuccess();
      },

      setBlockNote: (notes) => {
        const { session, currentBlockIndex } = get();
        if (!session) return;

        const updatedLogs = session.logs.map((log, idx) => {
          if (idx === currentBlockIndex) {
            return { ...log, notes };
          }
          return log;
        });

        set({ session: { ...session, logs: updatedLogs } });
      },

      setBlockRpe: (rpe) => {
        const { session, currentBlockIndex } = get();
        if (!session) return;

        const updatedLogs = session.logs.map((log, idx) => {
          if (idx === currentBlockIndex) {
            return { ...log, rpe };
          }
          return log;
        });

        set({ session: { ...session, logs: updatedLogs } });
      },

      completeSession: (overallRpe, sessionNotes) => {
        const { session, totalSessionElapsedSeconds } = get();
        if (!session) return null;

        const completedSession: WorkoutSession = {
          ...session,
          completedAt: new Date().toISOString(),
          durationSeconds: totalSessionElapsedSeconds,
          overallRpe,
          notes: sessionNotes || session.notes,
          status: 'completed',
        };

        // Guardar en el histórico de sesiones
        useWorkoutStore.getState().saveSession(completedSession);

        const settings = useSettingsStore.getState();
        if (settings.soundEnabled) audioFeedback.playSuccess();

        set({
          session: null,
          isActive: false,
          currentBlockIndex: 0,
          totalSessionElapsedSeconds: 0,
        });

        return completedSession;
      },

      abandonSession: () => {
        set({
          session: null,
          isActive: false,
          currentBlockIndex: 0,
          totalSessionElapsedSeconds: 0,
        });
      },

      syncBackground: () => {
        const { session, currentBlockIndex, timerState } = get();
        if (!session || !session.blocks[currentBlockIndex]) return;

        const block = session.blocks[currentBlockIndex];
        const { updatedState, phaseChanged } = recoverFromBackground(timerState, block);

        if (phaseChanged) {
          const settings = useSettingsStore.getState();
          if (settings.soundEnabled) audioFeedback.playSuccess();
        }

        set({ timerState: updatedState });
      },
    }),
    {
      name: 'crux-active-workout',
    }
  )
);
