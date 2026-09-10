import { describe, it, expect } from 'vitest';
import {
  initializeBlockTimer,
  startTimerPhase,
  pauseTimer,
  resumeTimer,
  adjustTimerSeconds,
  transitionOnTimerExpired,
  skipCurrentPhase,
  getBlockTargetUnits,
} from '@/lib/timer/timerEngine';
import { WorkoutBlock } from '@/lib/types';

describe('Máquina de Estados y Transiciones del Temporizador', () => {
  const ulacBlock: WorkoutBlock = {
    id: 'b1',
    position: 0,
    title: 'ULAC',
    type: 'intervals',
    sets: 3,
    workDurationSeconds: 180,
    restDurationSeconds: 60,
  };

  it('Inicializa el temporizador en estado idle con los segundos configurados', () => {
    const timer = initializeBlockTimer(ulacBlock);
    expect(timer.phase).toBe('idle');
    expect(timer.currentSet).toBe(1);
    expect(timer.secondsRemaining).toBe(180);
    expect(timer.isRunning).toBe(false);
  });

  it('Inicia la fase de trabajo calculando los timestamps absolutos', () => {
    const initial = initializeBlockTimer(ulacBlock);
    const mockNow = 1000000;
    const started = startTimerPhase(initial, ulacBlock, 'work', mockNow);

    expect(started.phase).toBe('work');
    expect(started.isRunning).toBe(true);
    expect(started.phaseStartTime).toBe(mockNow);
    expect(started.phaseTargetEnd).toBe(mockNow + 180 * 1000);
    expect(started.secondsRemaining).toBe(180);
  });

  it('Al expirar el tiempo de trabajo pasa automáticamente a descanso', () => {
    const initial = initializeBlockTimer(ulacBlock);
    const mockNow = 1000000;
    const working = startTimerPhase(initial, ulacBlock, 'work', mockNow);

    const expiredTime = mockNow + 180 * 1000;
    const result = transitionOnTimerExpired(working, ulacBlock, expiredTime);

    expect(result.nextState.phase).toBe('rest');
    expect(result.nextState.secondsRemaining).toBe(60);
    expect(result.nextState.phaseTargetEnd).toBe(expiredTime + 60 * 1000);
    expect(result.event).toBe('rest_started');
    expect(result.soundToPlay).toBe('rest');
    expect(result.nextState.totalWorkSecondsLogged).toBe(180);
  });

  it('Al expirar el descanso pasa a la siguiente serie (Set 2) y reinicia el trabajo', () => {
    const mockNow = 2000000;
    const restingState = {
      ...initializeBlockTimer(ulacBlock),
      phase: 'rest' as const,
      currentSet: 1,
      phaseDurationSeconds: 60,
      phaseStartTime: mockNow,
      phaseTargetEnd: mockNow + 60 * 1000,
      secondsRemaining: 0,
      isRunning: true,
    };

    const result = transitionOnTimerExpired(restingState, ulacBlock, mockNow + 60 * 1000);

    expect(result.nextState.phase).toBe('work');
    expect(result.nextState.currentSet).toBe(2);
    expect(result.nextState.completedSetsInBlock).toBe(1);
    expect(result.nextState.secondsRemaining).toBe(180);
    expect(result.event).toBe('work_started');
    expect(result.soundToPlay).toBe('work');
  });

  it('Finaliza el bloque cuando se completan todas las series (Set 3 -> blockCompleted)', () => {
    const mockNow = 3000000;
    const lastRestingState = {
      ...initializeBlockTimer(ulacBlock),
      phase: 'rest' as const,
      currentSet: 3, // Última serie
      completedSetsInBlock: 2,
      phaseDurationSeconds: 60,
      secondsRemaining: 0,
      isRunning: true,
    };

    const result = transitionOnTimerExpired(lastRestingState, ulacBlock, mockNow);

    expect(result.nextState.phase).toBe('blockCompleted');
    expect(result.nextState.completedSetsInBlock).toBe(3);
    expect(result.nextState.isRunning).toBe(false);
    expect(result.event).toBe('block_finished');
    expect(result.soundToPlay).toBe('success');
  });

  it('Permite pausar y reanudar sin perder la precisión del tiempo restante', () => {
    const initial = initializeBlockTimer(ulacBlock);
    const startMs = 5000000;
    const started = startTimerPhase(initial, ulacBlock, 'work', startMs);

    // 40 segundos después, el usuario pausa
    const pauseMs = startMs + 40 * 1000;
    const paused = pauseTimer(started, pauseMs);

    expect(paused.isPaused).toBe(true);
    expect(paused.isRunning).toBe(false);
    expect(paused.secondsRemaining).toBe(140); // 180 - 40 = 140

    // El usuario espera 10 minutos pausado y luego reanuda
    const resumeMs = pauseMs + 600 * 1000;
    const resumed = resumeTimer(paused, resumeMs);

    expect(resumed.isPaused).toBe(false);
    expect(resumed.isRunning).toBe(true);
    expect(resumed.secondsRemaining).toBe(140);
    expect(resumed.phaseTargetEnd).toBe(resumeMs + 140 * 1000);
  });

  it('Permite saltar fase en 1 toque (Skip)', () => {
    const initial = initializeBlockTimer(ulacBlock);
    const startMs = 6000000;
    const working = startTimerPhase(initial, ulacBlock, 'work', startMs);

    // Saltar trabajo anticipadamente -> va directo a descanso
    const result = skipCurrentPhase(working, ulacBlock, startMs + 10 * 1000);
    expect(result.nextState.phase).toBe('rest');
    expect(result.nextState.secondsRemaining).toBe(60);
  });

  it('Permite sumar y restar 15 segundos dinámicamente', () => {
    const initial = initializeBlockTimer(ulacBlock);
    const startMs = 7000000;
    const working = startTimerPhase(initial, ulacBlock, 'work', startMs);

    // Añadir +15s
    const plus15 = adjustTimerSeconds(working, 15, startMs);
    expect(plus15.secondsRemaining).toBe(195);

    // Restar -30s
    const minus30 = adjustTimerSeconds(plus15, -30, startMs);
    expect(minus30.secondsRemaining).toBe(165);
  });
});
