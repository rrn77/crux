import type { WorkoutBlock, BlockType } from '../types/index';

/**
 * Calcula la duración estimada en segundos de un bloque individual
 */
export function calculateBlockEstimatedDuration(block: WorkoutBlock): number {
  const rest = block.restDurationSeconds ?? 60;

  switch (block.type) {
    case 'intervals': {
      const sets = block.sets ?? 1;
      const work = block.workDurationSeconds ?? 30;
      return sets * (work + rest);
    }
    case 'reps': {
      const sets = block.sets ?? 1;
      const reps = block.repetitions ?? 10;
      const estimatedWorkPerRep = 3.5; // Segundos promedio por repetición
      const work = Math.round(reps * estimatedWorkPerRep);
      return sets * (work + rest);
    }
    case 'attempts': {
      const attempts = block.attempts ?? 3;
      const estimatedWorkPerAttempt = 25; // 25s por intento en bloque/vía
      return attempts * (estimatedWorkPerAttempt + rest);
    }
    case 'problems': {
      const problems = block.problems ?? 1;
      const attempts = block.attempts ?? 3;
      const moves = block.movements ?? 5;
      const estimatedWorkPerAttempt = Math.max(15, moves * 3);
      return problems * attempts * (estimatedWorkPerAttempt + rest);
    }
    case 'free': {
      return 300; // 5 minutos por defecto para registro libre
    }
    default:
      return 0;
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
 * Genera el resumen visual y legible de la estructura del bloque
 * Ej: "4 series × 3:00 / descanso 1:00"
 */
export function formatBlockSummary(block: WorkoutBlock): string {
  const restStr = block.restDurationSeconds !== undefined
    ? `descanso ${formatSecondsToTime(block.restDurationSeconds)}`
    : '';

  switch (block.type) {
    case 'intervals': {
      const sets = block.sets ?? 1;
      const work = formatSecondsToTime(block.workDurationSeconds ?? 0);
      return `${sets} series × ${work}${restStr ? ` / ${restStr}` : ''}`;
    }
    case 'reps': {
      const sets = block.sets ?? 1;
      const reps = block.repetitions ?? 0;
      return `${sets} series × ${reps} reps${restStr ? ` / ${restStr}` : ''}`;
    }
    case 'attempts': {
      const attempts = block.attempts ?? 1;
      return `${attempts} intentos${restStr ? ` / ${restStr}` : ''}`;
    }
    case 'problems': {
      const problems = block.problems ?? 1;
      const attempts = block.attempts ?? 1;
      const movs = block.movements ? ` de ${block.movements} movs` : '';
      return `${problems} bloques${movs} × ${attempts} intentos c/u${restStr ? ` / ${restStr}` : ''}`;
    }
    case 'free': {
      if (block.target) return `Objetivo: ${block.target}`;
      return 'Registro libre sin temporizador';
    }
    default:
      return '';
  }
}
