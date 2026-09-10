import { describe, it, expect } from 'vitest';
import {
  calculateBlockEstimatedDuration,
  calculateTotalEstimatedDuration,
  formatSecondsToTime,
  formatDurationHuman,
  formatBlockSummary,
} from '@/lib/timer/durationHelper';
import { WorkoutBlock } from '@/lib/types';

describe('Cálculo y formateo de duraciones en CRUX', () => {
  it('Calcula correctamente la duración de un bloque tipo INTERVALOS (ULAC 4x3:00 / 1:00)', () => {
    const ulacBlock: WorkoutBlock = {
      id: 'b1',
      position: 0,
      title: 'ULAC',
      type: 'intervals',
      sets: 4,
      workDurationSeconds: 180, // 3 min
      restDurationSeconds: 60,  // 1 min
    };

    const duration = calculateBlockEstimatedDuration(ulacBlock);
    // 4 series * (180 + 60) = 960 segundos (16 min)
    expect(duration).toBe(960);
    expect(formatBlockSummary(ulacBlock)).toBe('4 series × 03:00 / descanso 01:00');
    expect(formatDurationHuman(duration)).toBe('16 min');
  });

  it('Calcula correctamente la duración de un bloque tipo BLOQUES/PROBLEMAS (BLOQUES CORTOS)', () => {
    const bloquesCortos: WorkoutBlock = {
      id: 'b2',
      position: 0,
      title: 'BLOQUES CORTOS',
      type: 'problems',
      problems: 4,
      movements: 5,
      attempts: 4,
      restDurationSeconds: 90, // 1:30
    };

    const duration = calculateBlockEstimatedDuration(bloquesCortos);
    // 4 problemas * 4 intentos * (Math.max(15, 5*3)=15 + 90) = 16 * 105 = 1680 segundos (28 min)
    expect(duration).toBe(1680);
    expect(formatBlockSummary(bloquesCortos)).toBe('4 bloques de 5 movs × 4 intentos c/u / descanso 01:30');
    expect(formatDurationHuman(duration)).toBe('28 min');
  });

  it('Calcula correctamente la duración de SUSPENSIONES 20mm (6 series × 7s / 3:00 descanso)', () => {
    const hangboardBlock: WorkoutBlock = {
      id: 'b3',
      position: 0,
      title: 'Suspensiones 20 mm',
      type: 'intervals',
      sets: 6,
      workDurationSeconds: 7,
      restDurationSeconds: 180, // 3 min
    };

    const duration = calculateBlockEstimatedDuration(hangboardBlock);
    // 6 * (7 + 180) = 1122 segundos (~19 min)
    expect(duration).toBe(1122);
    expect(formatBlockSummary(hangboardBlock)).toBe('6 series × 00:07 / descanso 03:00');
  });

  it('Calcula correctamente la duración de un bloque tipo REPETICIONES (Core 3x12 / 1:00 descanso)', () => {
    const coreBlock: WorkoutBlock = {
      id: 'b4',
      position: 0,
      title: 'Core',
      type: 'reps',
      sets: 3,
      repetitions: 12,
      restDurationSeconds: 60,
    };

    const duration = calculateBlockEstimatedDuration(coreBlock);
    // 3 series * (Math.round(12 * 3.5)=42 + 60) = 3 * 102 = 306 segundos (~5 min)
    expect(duration).toBe(306);
    expect(formatBlockSummary(coreBlock)).toBe('3 series × 12 reps / descanso 01:00');
  });

  it('Calcula la duración total estimada de una sesión compuesta por múltiples bloques', () => {
    const blocks: WorkoutBlock[] = [
      { id: '1', position: 0, title: 'ULAC', type: 'intervals', sets: 4, workDurationSeconds: 180, restDurationSeconds: 60 },
      { id: '2', position: 1, title: 'Core', type: 'reps', sets: 3, repetitions: 10, restDurationSeconds: 60 },
      { id: '3', position: 2, title: 'Libre', type: 'free' },
    ];

    const total = calculateTotalEstimatedDuration(blocks);
    // 960 (ULAC) + 285 (Core) + 300 (Libre) = 1545 segundos
    expect(total).toBe(1545);
    expect(formatSecondsToTime(total)).toBe('25:45');
    expect(formatDurationHuman(total)).toBe('26 min');
  });

  it('Formatea segundos a formato MM:SS y HH:MM:SS de manera precisa', () => {
    expect(formatSecondsToTime(0)).toBe('00:00');
    expect(formatSecondsToTime(59)).toBe('00:59');
    expect(formatSecondsToTime(90)).toBe('01:30');
    expect(formatSecondsToTime(3600)).toBe('1:00:00');
    expect(formatSecondsToTime(3665)).toBe('1:01:05');
  });
});
