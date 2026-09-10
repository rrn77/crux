import type { WorkoutBlock, TimerPhase } from '../types/index';

export interface TimerEngineState {
  phase: TimerPhase;
  currentSet: number;          // 1-indexed (Serie actual)
  currentProblemIndex: number; // 1-indexed (para tipo problems)
  currentAttempt: number;      // 1-indexed (para attempts por problema)
  phaseDurationSeconds: number;
  phaseStartTime: number | null; // ms (Date.now())
  phaseTargetEnd: number | null; // ms (Date.now() + duration * 1000)
  secondsRemaining: number;
  isRunning: boolean;
  isPaused: boolean;
  pausedRemainingSeconds: number | null;
  completedSetsInBlock: number;
  totalWorkSecondsLogged: number;
  totalRestSecondsLogged: number;
}

export interface TransitionResult {
  nextState: TimerEngineState;
  event: 'work_started' | 'rest_started' | 'block_finished' | 'set_advanced' | 'none';
  soundToPlay?: 'work' | 'rest' | 'success';
}

/**
 * Obtiene el número total de series/intentos/bloques objetivo de un bloque
 */
export function getBlockTargetUnits(block: WorkoutBlock): { totalSets: number; totalAttempts: number; totalProblems: number } {
  switch (block.type) {
    case 'intervals':
    case 'reps':
      return { totalSets: block.sets ?? 1, totalAttempts: 1, totalProblems: 1 };
    case 'attempts':
      return { totalSets: block.attempts ?? 1, totalAttempts: block.attempts ?? 1, totalProblems: 1 };
    case 'problems':
      return {
        totalSets: (block.problems ?? 1) * (block.attempts ?? 1),
        totalAttempts: block.attempts ?? 1,
        totalProblems: block.problems ?? 1
      };
    case 'free':
    default:
      return { totalSets: 1, totalAttempts: 1, totalProblems: 1 };
  }
}

/**
 * Inicializa el estado del temporizador para un bloque
 */
export function initializeBlockTimer(block: WorkoutBlock): TimerEngineState {
  const isInterval = block.type === 'intervals';
  const initialDuration = isInterval
    ? (block.workDurationSeconds ?? 30)
    : (block.restDurationSeconds ?? 60);

  return {
    phase: 'idle',
    currentSet: 1,
    currentProblemIndex: 1,
    currentAttempt: 1,
    phaseDurationSeconds: initialDuration,
    phaseStartTime: null,
    phaseTargetEnd: null,
    secondsRemaining: initialDuration,
    isRunning: false,
    isPaused: false,
    pausedRemainingSeconds: null,
    completedSetsInBlock: 0,
    totalWorkSecondsLogged: 0,
    totalRestSecondsLogged: 0,
  };
}

/**
 * Inicia la fase de trabajo o descanso para el bloque actual
 */
export function startTimerPhase(
  currentState: TimerEngineState,
  block: WorkoutBlock,
  phaseOverride?: 'work' | 'rest',
  now: number = Date.now()
): TimerEngineState {
  let targetPhase: TimerPhase = phaseOverride || (block.type === 'intervals' ? 'work' : 'rest');
  let duration = 0;

  if (targetPhase === 'work') {
    duration = block.workDurationSeconds ?? 30;
  } else if (targetPhase === 'rest') {
    duration = block.restDurationSeconds ?? 60;
  }

  return {
    ...currentState,
    phase: targetPhase,
    phaseDurationSeconds: duration,
    phaseStartTime: now,
    phaseTargetEnd: now + duration * 1000,
    secondsRemaining: duration,
    isRunning: true,
    isPaused: false,
    pausedRemainingSeconds: null,
  };
}

/**
 * Pausa el temporizador guardando el tiempo restante exacto
 */
export function pauseTimer(currentState: TimerEngineState, now: number = Date.now()): TimerEngineState {
  if (!currentState.isRunning || currentState.isPaused) return currentState;

  const remaining = calculateRemainingSeconds(currentState, now);

  return {
    ...currentState,
    isRunning: false,
    isPaused: true,
    secondsRemaining: remaining,
    pausedRemainingSeconds: remaining,
  };
}

/**
 * Reanuda el temporizador desde la pausa recalculando los timestamps
 */
export function resumeTimer(currentState: TimerEngineState, now: number = Date.now()): TimerEngineState {
  if (!currentState.isPaused) return currentState;

  const remaining = currentState.pausedRemainingSeconds ?? currentState.secondsRemaining;

  return {
    ...currentState,
    isRunning: true,
    isPaused: false,
    secondsRemaining: remaining,
    phaseStartTime: now,
    phaseTargetEnd: now + remaining * 1000,
    pausedRemainingSeconds: null,
  };
}

/**
 * Calcula los segundos restantes a partir del timestamp objetivo (resiliente a segundo plano)
 */
export function calculateRemainingSeconds(state: TimerEngineState, now: number = Date.now()): number {
  if (state.isPaused && state.pausedRemainingSeconds !== null) {
    return state.pausedRemainingSeconds;
  }

  if (!state.isRunning || !state.phaseTargetEnd) {
    return state.secondsRemaining;
  }

  const diffMs = state.phaseTargetEnd - now;
  return Math.max(0, Math.ceil(diffMs / 1000));
}

/**
 * Ajusta el tiempo (+15s / -15s) recalculando el timestamp de fin
 */
export function adjustTimerSeconds(state: TimerEngineState, deltaSeconds: number, now: number = Date.now()): TimerEngineState {
  const currentRemaining = calculateRemainingSeconds(state, now);
  const newRemaining = Math.max(1, currentRemaining + deltaSeconds);

  if (state.isPaused) {
    return {
      ...state,
      secondsRemaining: newRemaining,
      pausedRemainingSeconds: newRemaining,
    };
  }

  if (state.isRunning && state.phaseTargetEnd) {
    return {
      ...state,
      secondsRemaining: newRemaining,
      phaseTargetEnd: state.phaseTargetEnd + deltaSeconds * 1000,
    };
  }

  return {
    ...state,
    secondsRemaining: newRemaining,
    phaseDurationSeconds: newRemaining,
  };
}

/**
 * Transición automática de fase cuando el temporizador llega a 0
 */
export function transitionOnTimerExpired(
  state: TimerEngineState,
  block: WorkoutBlock,
  now: number = Date.now()
): TransitionResult {
  const { totalSets, totalProblems, totalAttempts } = getBlockTargetUnits(block);

  if (state.phase === 'work') {
    // Trabajo completado -> Pasar automáticamente a DESCANSO
    const workLogged = state.totalWorkSecondsLogged + state.phaseDurationSeconds;
    const restDuration = block.restDurationSeconds ?? 60;

    return {
      nextState: {
        ...state,
        phase: 'rest',
        phaseDurationSeconds: restDuration,
        phaseStartTime: now,
        phaseTargetEnd: now + restDuration * 1000,
        secondsRemaining: restDuration,
        isRunning: true,
        isPaused: false,
        totalWorkSecondsLogged: workLogged,
      },
      event: 'rest_started',
      soundToPlay: 'rest',
    };
  }

  if (state.phase === 'rest') {
    // Descanso completado -> Incrementar serie/intento
    const restLogged = state.totalRestSecondsLogged + state.phaseDurationSeconds;
    const nextSet = state.currentSet + 1;
    const completedSets = state.completedSetsInBlock + 1;

    // Verificar si el bloque ha finalizado
    if (nextSet > totalSets) {
      return {
        nextState: {
          ...state,
          phase: 'blockCompleted',
          completedSetsInBlock: completedSets,
          totalRestSecondsLogged: restLogged,
          isRunning: false,
          isPaused: false,
          secondsRemaining: 0,
        },
        event: 'block_finished',
        soundToPlay: 'success',
      };
    }

    // Avanzar a la siguiente serie
    let nextProblem = state.currentProblemIndex;
    let nextAttempt = state.currentAttempt + 1;
    if (block.type === 'problems' && nextAttempt > totalAttempts) {
      nextProblem = Math.min(totalProblems, nextProblem + 1);
      nextAttempt = 1;
    }

    if (block.type === 'intervals') {
      // Siguiente serie de intervalos -> Comienza nuevo TRABAJO
      const workDuration = block.workDurationSeconds ?? 30;
      return {
        nextState: {
          ...state,
          phase: 'work',
          currentSet: nextSet,
          currentProblemIndex: nextProblem,
          currentAttempt: nextAttempt,
          completedSetsInBlock: completedSets,
          phaseDurationSeconds: workDuration,
          phaseStartTime: now,
          phaseTargetEnd: now + workDuration * 1000,
          secondsRemaining: workDuration,
          isRunning: true,
          isPaused: false,
          totalRestSecondsLogged: restLogged,
        },
        event: 'work_started',
        soundToPlay: 'work',
      };
    } else {
      // Para reps o attempts -> Espera en reposo hasta que el usuario inicie la siguiente
      const nextRestDuration = block.restDurationSeconds ?? 60;
      return {
        nextState: {
          ...state,
          phase: 'idle',
          currentSet: nextSet,
          currentProblemIndex: nextProblem,
          currentAttempt: nextAttempt,
          completedSetsInBlock: completedSets,
          phaseDurationSeconds: nextRestDuration,
          secondsRemaining: nextRestDuration,
          isRunning: false,
          isPaused: false,
          totalRestSecondsLogged: restLogged,
        },
        event: 'set_advanced',
        soundToPlay: 'work',
      };
    }
  }

  return { nextState: state, event: 'none' };
}

/**
 * Salto manual de fase por acción del usuario (Completar serie / Saltar descanso en 1 toque)
 */
export function skipCurrentPhase(
  state: TimerEngineState,
  block: WorkoutBlock,
  now: number = Date.now()
): TransitionResult {
  return transitionOnTimerExpired(state, block, now);
}

/**
 * Recuperación inteligente cuando la aplicación vuelve de segundo plano o bloqueo de pantalla
 */
export function recoverFromBackground(
  state: TimerEngineState,
  block: WorkoutBlock,
  now: number = Date.now()
): { updatedState: TimerEngineState; phaseChanged: boolean } {
  if (!state.isRunning || state.isPaused || !state.phaseTargetEnd) {
    return { updatedState: state, phaseChanged: false };
  }

  const remaining = calculateRemainingSeconds(state, now);

  // Si todavía queda tiempo en la fase actual
  if (remaining > 0) {
    return {
      updatedState: {
        ...state,
        secondsRemaining: remaining,
      },
      phaseChanged: false,
    };
  }

  // Si el tiempo expiró mientras la app estaba en segundo plano, ejecutar transición
  const transition = transitionOnTimerExpired(state, block, now);
  return {
    updatedState: transition.nextState,
    phaseChanged: true,
  };
}
