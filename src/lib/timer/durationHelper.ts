import type { WorkoutBlock } from '../types/index';

/**
 * Calcula la duración estimada en segundos de un bloque/ejercicio individual
 */
export function calculateBlockEstimatedDuration(block: WorkoutBlock): number {
  const restBetweenSets = block.restDurationSeconds ?? 60;
  const sets = block.sets ?? 1;
  const reps = block.repetitions ?? 1;
  const restBetweenReps = block.restBetweenRepsSeconds ?? 0;
  const workSec = block.workDurationSeconds ?? 0;

  // 1. Trabajo por tiempo con repeticiones y descanso entre repeticiones (ej. suspensiones 7/3)
  if (workSec > 0 && reps > 1 && restBetweenReps > 0) {
    const timePerSet = reps * workSec + (reps - 1) * restBetweenReps;
    return sets * (timePerSet + restBetweenSets);
  }

  // 2. Trabajo por tiempo continuo (ej. suspensiones 10s o ARC 15 min)
  if (workSec > 0) {
    return sets * (workSec + restBetweenSets);
  }

  // 3. Trabajo por bloques o problemas
  if (block.problems && block.problems > 0) {
    const attempts = block.attempts ?? 1;
    const moves = block.movements ?? 5;
    const work = Math.max(15, moves * 3);
    return sets * block.problems * attempts * (work + restBetweenSets);
  }

  // 4. Trabajo por repeticiones (ej. dominadas)
  if (block.repetitions && block.repetitions > 0) {
    const estimatedWorkPerRep = 3.5;
    const work = Math.round(block.repetitions * estimatedWorkPerRep);
    return sets * (work + restBetweenSets);
  }

  // 5. Intentos
  if (block.attempts && block.attempts > 0) {
    return sets * block.attempts * (25 + restBetweenSets);
  }

  switch (block.type) {
    case 'intervals':
      return sets * ((block.workDurationSeconds ?? 30) + restBetweenSets);
    case 'reps':
      return sets * (Math.round((block.repetitions ?? 10) * 3.5) + restBetweenSets);
    case 'attempts':
      return sets * ((block.attempts ?? 3) * 25 + restBetweenSets);
    case 'problems': {
      const p = block.problems ?? 1;
      const att = block.attempts ?? 1;
      const mov = block.movements ?? 5;
      return p * att * (Math.max(15, mov * 3) + restBetweenSets);
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
 */
export function formatBlockSummary(block: WorkoutBlock): string {
  const parts: string[] = [];
  const sets = block.sets || 1;
  const reps = block.repetitions;
  const workSec = block.workDurationSeconds;
  const restBetweenReps = block.restBetweenRepsSeconds;
  const restBetweenSets = block.restDurationSeconds;

  const restSetsStr = restBetweenSets !== undefined && restBetweenSets > 0
    ? `descanso ${formatSecondsToTime(restBetweenSets)}`
    : '';

  // 1. Caso de compatibilidad con test de problemas (ej. "4 bloques de 5 movs × 4 intentos c/u")
  if (block.problems && block.problems > 0 && block.movements && block.attempts) {
    const setsPrefix = sets > 1 ? `${sets} series × ` : '';
    parts.push(`${setsPrefix}${block.problems} bloques de ${block.movements} movs × ${block.attempts} intentos c/u`);
  }
  // 2. Trabajo por tiempo con repeticiones y descanso entre reps (ej. "4 series × 6 reps (0:07 / 0:03)")
  else if (workSec && workSec > 0 && reps && reps > 1 && restBetweenReps && restBetweenReps > 0) {
    const workFormatted = formatSecondsToTime(workSec);
    const restRepsFormatted = formatSecondsToTime(restBetweenReps);
    parts.push(`${sets} series × ${reps} reps (${workFormatted} / ${restRepsFormatted})`);
  }
  // 3. Trabajo por tiempo continuo (ej. "4 series × 03:00")
  else if (workSec && workSec > 0) {
    const workFormatted = formatSecondsToTime(workSec);
    const repsInfo = reps && reps > 1 ? ` × ${reps} reps` : '';
    parts.push(`${sets} series × ${workFormatted}${repsInfo}`);
  }
  // 4. Trabajo por repeticiones (ej. "3 series × 12 reps")
  else if (reps && reps > 0) {
    parts.push(`${sets} series × ${reps} reps`);
  }
  // 5. Solo series
  else if (sets > 1) {
    parts.push(`${sets} series`);
  }
  // 6. Objetivo / Libre
  else if (block.target || block.load) {
    parts.push(`Objetivo: ${block.load || block.target}`);
  } else {
    parts.push('Ejercicio libre');
  }

  if (restSetsStr) {
    parts.push(restSetsStr);
  }

  return parts.join(' / ');
}
