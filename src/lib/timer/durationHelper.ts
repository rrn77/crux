import type { WorkoutBlock, BlockType } from '../types/index';

/**
 * Calcula la duración estimada en segundos de un bloque individual
 */
export function calculateBlockEstimatedDuration(block: WorkoutBlock): number {
  const rest = block.restDurationSeconds ?? 60;
  const sets = block.sets ?? 1;

  if (block.workDurationSeconds && block.workDurationSeconds > 0) {
    return sets * (block.workDurationSeconds + rest);
  }

  if (block.problems && block.problems > 0) {
    const attempts = block.attempts ?? 1;
    const moves = block.movements ?? 4;
    const estimatedWorkPerAttempt = Math.max(15, moves * 3);
    return sets * block.problems * attempts * (estimatedWorkPerAttempt + rest);
  }

  if (block.repetitions && block.repetitions > 0) {
    const estimatedWorkPerRep = 3.5;
    const work = Math.round(block.repetitions * estimatedWorkPerRep);
    return sets * (work + rest);
  }

  if (block.attempts && block.attempts > 0) {
    const estimatedWorkPerAttempt = 25;
    return sets * block.attempts * (estimatedWorkPerAttempt + rest);
  }

  switch (block.type) {
    case 'intervals': {
      const work = block.workDurationSeconds ?? 30;
      return sets * (work + rest);
    }
    case 'reps': {
      const reps = block.repetitions ?? 10;
      const work = Math.round(reps * 3.5);
      return sets * (work + rest);
    }
    case 'attempts': {
      const attempts = block.attempts ?? 3;
      return attempts * (25 + rest);
    }
    case 'problems': {
      const problems = block.problems ?? 1;
      const attempts = block.attempts ?? 1;
      const moves = block.movements ?? 5;
      const work = Math.max(15, moves * 3);
      return problems * attempts * (work + rest);
    }
    case 'free':
    default:
      return 300;
  }
}

/**
 * Calcula la duración total estimada de una lista de bloques
 */
export function calculateTotalEstimatedDuration(blocks: WorkoutBlock[]): number {
  return blocks.reduce((acc, block) => acc + calculateBlockEstimatedDuration(block), 0);
}

/**
 * Formatea segundos a formato MM:SS o HH:MM:SS
 */
export function formatSecondsToTime(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (num: number) => num.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Formatea duración a texto amigable ("45 min", "1h 15m")
 */
export function formatDurationHuman(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0 min';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${Math.max(1, minutes)} min`;
}

/**
 * Genera el resumen visual y legible de la estructura y prescripción del ejercicio
 * Ej: "4 series × 4 bloques (4 movs) / descanso 02:00"
 */
export function formatBlockSummary(block: WorkoutBlock): string {
  const parts: string[] = [];
  const sets = block.sets || 1;

  const restStr = block.restDurationSeconds !== undefined && block.restDurationSeconds > 0
    ? `descanso ${formatSecondsToTime(block.restDurationSeconds)}`
    : '';

  // 1. Si tiene bloques / búlder
  if (block.problems && block.problems > 0) {
    const movs = block.movements ? ` de ${block.movements} movs` : '';
    const atts = block.attempts && block.attempts > 1 ? ` × ${block.attempts} intentos c/u` : '';
    const setsPrefix = sets > 1 ? `${sets} series × ` : '';
    parts.push(`${setsPrefix}${block.problems} ${block.problems === 1 ? 'bloque' : 'bloques'}${movs}${atts}`);
  }
  // 2. Si tiene tiempo de trabajo directo (ej. suspensiones 10s, ARC 15 min, ULAC 3 min)
  else if (block.workDurationSeconds && block.workDurationSeconds > 0) {
    const work = formatSecondsToTime(block.workDurationSeconds);
    parts.push(`${sets} ${sets === 1 ? 'serie' : 'series'} × ${work}`);
  }
  // 3. Si tiene repeticiones (ej. dominadas 5 reps)
  else if (block.repetitions && block.repetitions > 0) {
    parts.push(`${sets} ${sets === 1 ? 'serie' : 'series'} × ${block.repetitions} reps`);
  }
  // 4. Si solo tiene intentos
  else if (block.attempts && block.attempts > 0) {
    const setsPrefix = sets > 1 ? `${sets} series × ` : '';
    parts.push(`${setsPrefix}${block.attempts} ${block.attempts === 1 ? 'intento' : 'intentos'}`);
  }
  // 5. Si solo tiene series
  else if (block.sets && block.sets > 1) {
    parts.push(`${block.sets} series`);
  }
  // 6. Por defecto o libre
  else if (block.target) {
    parts.push(`Objetivo: ${block.target}`);
  } else {
    parts.push('Ejercicio libre');
  }

  if (restStr) {
    parts.push(restStr);
  }

  return parts.join(' / ');
}
