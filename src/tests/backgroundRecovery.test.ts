import { describe, it, expect } from 'vitest';
import {
  initializeBlockTimer,
  startTimerPhase,
  recoverFromBackground,
  calculateRemainingSeconds,
} from '@/lib/timer/timerEngine';
import { WorkoutBlock } from '@/lib/types';

describe('Recuperación del Temporizador ante Segundo Plano / Bloqueo de Pantalla', () => {
  const hangboardBlock: WorkoutBlock = {
    id: 'b1',
    position: 0,
    title: 'Suspensiones 20 mm',
    type: 'intervals',
    sets: 6,
    workDurationSeconds: 7,
    restDurationSeconds: 180, // 3 min
  };

  it('Calcula con total exactitud los segundos transcurridos tras un apagado de pantalla', () => {
    const startMs = 10000000;
    const initial = initializeBlockTimer(hangboardBlock);
    const started = startTimerPhase(initial, hangboardBlock, 'rest', startMs);

    // El teléfono se bloquea por 45 segundos
    const unlockMs = startMs + 45 * 1000;
    const remaining = calculateRemainingSeconds(started, unlockMs);

    // 180s - 45s = 135s restantes
    expect(remaining).toBe(135);
  });

  it('Sincroniza y transiciona automáticamente si la fase expiró durante el segundo plano', () => {
    const startMs = 20000000;
    const initial = initializeBlockTimer(hangboardBlock);
    // Iniciar trabajo de 7 segundos
    const working = startTimerPhase(initial, hangboardBlock, 'work', startMs);

    // El usuario cambia de app o apaga pantalla durante 15 segundos (más de los 7s de trabajo)
    const returnMs = startMs + 15 * 1000;
    const { updatedState, phaseChanged } = recoverFromBackground(working, hangboardBlock, returnMs);

    // Debe haber avanzado automáticamente a descanso
    expect(phaseChanged).toBe(true);
    expect(updatedState.phase).toBe('rest');
    expect(updatedState.totalWorkSecondsLogged).toBe(7);
  });

  it('Mantiene el estado inalterado si el temporizador estaba en pausa mientras estaba en segundo plano', () => {
    const startMs = 30000000;
    const pausedState = {
      ...initializeBlockTimer(hangboardBlock),
      phase: 'rest' as const,
      isPaused: true,
      isRunning: false,
      pausedRemainingSeconds: 95,
      secondsRemaining: 95,
    };

    // Pasan 30 minutos con la app en segundo plano
    const returnMs = startMs + 1800 * 1000;
    const { updatedState, phaseChanged } = recoverFromBackground(pausedState, hangboardBlock, returnMs);

    expect(phaseChanged).toBe(false);
    expect(updatedState.secondsRemaining).toBe(95);
    expect(updatedState.isPaused).toBe(true);
  });
});
