import assert from 'node:assert';
import {
  calculateBlockEstimatedDuration,
  calculateTotalEstimatedDuration,
  formatSecondsToTime,
  formatDurationHuman,
  formatBlockSummary,
} from '../lib/timer/durationHelper';
import {
  initializeBlockTimer,
  startTimerPhase,
  pauseTimer,
  resumeTimer,
  adjustTimerSeconds,
  transitionOnTimerExpired,
  skipCurrentPhase,
  recoverFromBackground,
  calculateRemainingSeconds,
} from '../lib/timer/timerEngine';
import type { WorkoutBlock } from '../lib/types';

console.log('🧗 Iniciando suite de pruebas de CRUX...\n');

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(err);
    failed++;
  }
}

// 1. Tests de Duración
test('ULAC duración estimada', () => {
  const block: WorkoutBlock = { id: '1', position: 0, title: 'ULAC', type: 'intervals', sets: 4, workDurationSeconds: 180, restDurationSeconds: 60 };
  assert.strictEqual(calculateBlockEstimatedDuration(block), 960);
  assert.strictEqual(formatBlockSummary(block), '4 series × 03:00 / descanso 01:00');
  assert.strictEqual(formatDurationHuman(960), '16 min');
});

test('BLOQUES CORTOS duración estimada', () => {
  const block: WorkoutBlock = { id: '2', position: 0, title: 'BLOQUES CORTOS', type: 'problems', problems: 4, movements: 5, attempts: 4, restDurationSeconds: 90 };
  assert.strictEqual(calculateBlockEstimatedDuration(block), 1680);
  assert.strictEqual(formatBlockSummary(block), '4 bloques de 5 movs × 4 intentos c/u / descanso 01:30');
});

test('Suspensiones 20mm duración estimada', () => {
  const block: WorkoutBlock = { id: '3', position: 0, title: 'Suspensiones 20 mm', type: 'intervals', sets: 6, workDurationSeconds: 7, restDurationSeconds: 180 };
  assert.strictEqual(calculateBlockEstimatedDuration(block), 1122);
  assert.strictEqual(formatBlockSummary(block), '6 series × 00:07 / descanso 03:00');
});

test('Core 3x12 duración estimada', () => {
  const block: WorkoutBlock = { id: '4', position: 0, title: 'Core', type: 'reps', sets: 3, repetitions: 12, restDurationSeconds: 60 };
  assert.strictEqual(calculateBlockEstimatedDuration(block), 306);
  assert.strictEqual(formatBlockSummary(block), '3 series × 12 reps / descanso 01:00');
});

// 2. Tests de Máquina de Estados del Temporizador
test('Inicialización de temporizador', () => {
  const block: WorkoutBlock = { id: '1', position: 0, title: 'ULAC', type: 'intervals', sets: 3, workDurationSeconds: 180, restDurationSeconds: 60 };
  const timer = initializeBlockTimer(block);
  assert.strictEqual(timer.phase, 'idle');
  assert.strictEqual(timer.currentSet, 1);
  assert.strictEqual(timer.secondsRemaining, 180);
  assert.strictEqual(timer.isRunning, false);
});

test('Transición trabajo -> descanso al expirar', () => {
  const block: WorkoutBlock = { id: '1', position: 0, title: 'ULAC', type: 'intervals', sets: 3, workDurationSeconds: 180, restDurationSeconds: 60 };
  const startMs = 100000;
  const started = startTimerPhase(initializeBlockTimer(block), block, 'work', startMs);
  const trans = transitionOnTimerExpired(started, block, startMs + 180000);
  assert.strictEqual(trans.nextState.phase, 'rest');
  assert.strictEqual(trans.nextState.secondsRemaining, 60);
  assert.strictEqual(trans.event, 'rest_started');
  assert.strictEqual(trans.soundToPlay, 'rest');
});

test('Transición descanso -> serie 2 trabajo', () => {
  const block: WorkoutBlock = { id: '1', position: 0, title: 'ULAC', type: 'intervals', sets: 3, workDurationSeconds: 180, restDurationSeconds: 60 };
  const startMs = 200000;
  const resting = {
    ...initializeBlockTimer(block),
    phase: 'rest' as const,
    currentSet: 1,
    phaseDurationSeconds: 60,
    phaseStartTime: startMs,
    phaseTargetEnd: startMs + 60000,
    secondsRemaining: 0,
    isRunning: true,
  };
  const trans = transitionOnTimerExpired(resting, block, startMs + 60000);
  assert.strictEqual(trans.nextState.phase, 'work');
  assert.strictEqual(trans.nextState.currentSet, 2);
  assert.strictEqual(trans.nextState.completedSetsInBlock, 1);
});

test('Fin de bloque tras última serie', () => {
  const block: WorkoutBlock = { id: '1', position: 0, title: 'ULAC', type: 'intervals', sets: 2, workDurationSeconds: 180, restDurationSeconds: 60 };
  const startMs = 300000;
  const lastRest = {
    ...initializeBlockTimer(block),
    phase: 'rest' as const,
    currentSet: 2,
    completedSetsInBlock: 1,
    phaseDurationSeconds: 60,
    phaseStartTime: startMs,
    phaseTargetEnd: startMs + 60000,
    secondsRemaining: 0,
    isRunning: true,
  };
  const trans = transitionOnTimerExpired(lastRest, block, startMs + 60000);
  assert.strictEqual(trans.nextState.phase, 'blockCompleted');
  assert.strictEqual(trans.nextState.completedSetsInBlock, 2);
  assert.strictEqual(trans.event, 'block_finished');
});

test('Pausar y reanudar con timestamps', () => {
  const block: WorkoutBlock = { id: '1', position: 0, title: 'ULAC', type: 'intervals', sets: 2, workDurationSeconds: 180, restDurationSeconds: 60 };
  const startMs = 400000;
  const started = startTimerPhase(initializeBlockTimer(block), block, 'work', startMs);
  const paused = pauseTimer(started, startMs + 30000);
  assert.strictEqual(paused.secondsRemaining, 150);
  assert.strictEqual(paused.isPaused, true);

  const resumed = resumeTimer(paused, startMs + 100000);
  assert.strictEqual(resumed.secondsRemaining, 150);
  assert.strictEqual(resumed.phaseTargetEnd, startMs + 100000 + 150000);
});

test('Salto de fase (1 tap skip)', () => {
  const block: WorkoutBlock = { id: '1', position: 0, title: 'ULAC', type: 'intervals', sets: 2, workDurationSeconds: 180, restDurationSeconds: 60 };
  const startMs = 450000;
  const started = startTimerPhase(initializeBlockTimer(block), block, 'work', startMs);
  const skipped = skipCurrentPhase(started, block, startMs + 10000);
  assert.strictEqual(skipped.nextState.phase, 'rest');
  assert.strictEqual(skipped.nextState.secondsRemaining, 60);
});

// 3. Tests de Recuperación de Segundo Plano
test('Recuperación precisa tras bloqueo de pantalla', () => {
  const block: WorkoutBlock = { id: '1', position: 0, title: 'Suspensiones 20mm', type: 'intervals', sets: 6, workDurationSeconds: 7, restDurationSeconds: 180 };
  const startMs = 500000;
  const resting = startTimerPhase(initializeBlockTimer(block), block, 'rest', startMs);
  const remaining = calculateRemainingSeconds(resting, startMs + 40000);
  assert.strictEqual(remaining, 140);
});

test('Recuperación con auto-transición tras expiración en background', () => {
  const block: WorkoutBlock = { id: '1', position: 0, title: 'Suspensiones 20mm', type: 'intervals', sets: 6, workDurationSeconds: 7, restDurationSeconds: 180 };
  const startMs = 600000;
  const working = startTimerPhase(initializeBlockTimer(block), block, 'work', startMs);
  const { updatedState, phaseChanged } = recoverFromBackground(working, block, startMs + 20000);
  assert.strictEqual(phaseChanged, true);
  assert.strictEqual(updatedState.phase, 'rest');
});

import { calculateTestDelta, calculateTestFatigue } from '../lib/store/testStore';
import { getLocalDateIsoString, useWorkoutStore } from '../lib/store/workoutStore';

// 4. Tests de Test Delta y Fatiga con Criterio de Mejora (higher_is_better vs lower_is_better)
test('calculateTestDelta: higher_is_better (más es mejor: kg, reps)', () => {
  // Aumento de peso (mejora)
  const delta1 = calculateTestDelta(30, 25, 'kg', 'higher_is_better');
  assert.strictEqual(delta1?.isImprovement, true);
  assert.strictEqual(delta1?.isPositive, true);
  assert.strictEqual(delta1?.deltaValue, 5);

  // Disminución de peso (empeoramiento)
  const delta2 = calculateTestDelta(20, 25, 'kg', 'higher_is_better');
  assert.strictEqual(delta2?.isImprovement, false);
  assert.strictEqual(delta2?.isPositive, false);
  assert.strictEqual(delta2?.deltaValue, -5);
});

test('calculateTestDelta: lower_is_better (menos es mejor: mm, tiempo)', () => {
  // Reducción de regleta de 14mm a 10mm (MEJORA en verde)
  const delta1 = calculateTestDelta(10, 14, 'mm', 'lower_is_better');
  assert.strictEqual(delta1?.isImprovement, true, '10mm vs 14mm debe ser MEJORA');
  assert.strictEqual(delta1?.isPositive, false, '10mm vs 14mm tiene deltaValue negativo (-4)');
  assert.strictEqual(delta1?.deltaValue, -4);

  // Aumento de regleta de 10mm a 14mm (EMPEORAMIENTO en rojo)
  const delta2 = calculateTestDelta(14, 10, 'mm', 'lower_is_better');
  assert.strictEqual(delta2?.isImprovement, false, '14mm vs 10mm debe ser EMPEORAMIENTO');
  assert.strictEqual(delta2?.isPositive, true, '14mm vs 10mm tiene deltaValue positivo (+4)');
  assert.strictEqual(delta2?.deltaValue, 4);
});

test('calculateTestFatigue: peakValue y pérdida según targetMetric', () => {
  // Suspensiones: 10mm en S1, 12mm en S2, 14mm en S3 (pico = 10mm)
  const setsSuspensiones = [
    { setNumber: 1, value: 10 },
    { setNumber: 2, value: 12 },
    { setNumber: 3, value: 14 },
  ];
  const fatigueSusp = calculateTestFatigue(setsSuspensiones, 'lower_is_better');
  assert.strictEqual(fatigueSusp?.peakValue, 10, 'El pico en regletas debe ser la menor regleta (10mm)');
  assert.strictEqual(fatigueSusp?.isTotalLoss, true, 'Pasar de 10mm a 14mm es pérdida de rendimiento por fatiga');

  // Dominada: 30kg en S1, 28kg en S2, 25kg en S3 (pico = 30kg)
  const setsDominadas = [
    { setNumber: 1, value: 30 },
    { setNumber: 2, value: 28 },
    { setNumber: 3, value: 25 },
  ];
  const fatigueDom = calculateTestFatigue(setsDominadas, 'higher_is_better');
  assert.strictEqual(fatigueDom?.peakValue, 30, 'El pico en dominadas debe ser el mayor lastre (30kg)');
  assert.strictEqual(fatigueDom?.isTotalLoss, true, 'Pasar de 30kg a 25kg es pérdida de rendimiento por fatiga');
});

// 5. Tests de Planificación de Sesiones y Calendario (workoutStore)
test('getLocalDateIsoString: formato YYYY-MM-DD correcto', () => {
  const d = new Date(2026, 8, 15); // Septiembre 15, 2026
  const iso = getLocalDateIsoString(d);
  assert.strictEqual(iso, '2026-09-15');
});

test('workoutStore: scheduleSession y getSessionsByDate', () => {
  const store = useWorkoutStore.getState();
  store.clearWorkoutStore();

  const sessionTomorrow = store.scheduleSession({
    title: 'Fuerza de Dedos - Miércoles',
    scheduledDate: '2026-09-16',
    status: 'scheduled',
    blocks: [],
    logs: [],
    durationSeconds: 0,
    startedAt: '2026-09-16T10:00:00.000Z',
  });

  assert.strictEqual(sessionTomorrow.status, 'scheduled');
  assert.strictEqual(sessionTomorrow.scheduledDate, '2026-09-16');

  const fetched = useWorkoutStore.getState().getSessionsByDate('2026-09-16');
  assert.strictEqual(fetched.length, 1);
  assert.strictEqual(fetched[0].title, 'Fuerza de Dedos - Miércoles');

  const empty = useWorkoutStore.getState().getSessionsByDate('2026-09-20');
  assert.strictEqual(empty.length, 0);
});

test('workoutStore: getTodaySession prioridad programada/en progreso', () => {
  const store = useWorkoutStore.getState();
  store.clearWorkoutStore();

  const todayStr = getLocalDateIsoString();

  // Guardar sesión completada anterior de hoy
  store.saveSession({
    id: 's-done',
    title: 'Movilidad Mañana',
    scheduledDate: todayStr,
    status: 'completed',
    blocks: [],
    logs: [],
    durationSeconds: 900,
    startedAt: `${todayStr}T08:00:00.000Z`,
    completedAt: `${todayStr}T08:15:00.000Z`,
  });

  // Guardar sesión programada para la tarde de hoy
  store.scheduleSession({
    id: 's-pending',
    title: 'Bloques Tarde',
    scheduledDate: todayStr,
    status: 'scheduled',
    blocks: [],
    logs: [],
    durationSeconds: 0,
    startedAt: `${todayStr}T18:00:00.000Z`,
  });

  const todaySession = useWorkoutStore.getState().getTodaySession();
  assert.ok(todaySession);
  assert.strictEqual(todaySession?.id, 's-pending', 'Debe priorizar la sesión pendiente/programada');
});

console.log(`\n🎉 Resumen: ${passed} pruebas superadas, ${failed} fallidas.\n`);
if (failed > 0) process.exit(1);
