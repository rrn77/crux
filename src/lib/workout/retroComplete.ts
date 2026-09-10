import { WorkoutSession, BlockLog } from '../types';
import { getBlockTargetUnits } from '../timer/timerEngine';
import { calculateBlockEstimatedDuration } from '../timer/durationHelper';
import { generateUUID } from '../store/workoutStore';

/**
 * Construye una sesión "completada" a partir de una sesión planificada que nunca se
 * ejecutó en vivo (ej. una planificación de una semana pasada). No hay datos reales de
 * temporizador, así que actualWorkSeconds/actualRestSeconds quedan a 0 y la duración total
 * se estima proporcionalmente a las series marcadas como completadas por bloque.
 */
export function buildRetroCompletedSession(
  session: WorkoutSession,
  completions: Record<string, number>,
  overallRpe: number,
  notes?: string
): WorkoutSession {
  let totalDurationSeconds = 0;

  const logs: BlockLog[] = session.blocks.map((block, idx) => {
    const { totalSets } = getBlockTargetUnits(block);
    const completedSets = Math.min(Math.max(completions[block.id] ?? totalSets, 0), totalSets);
    const ratio = totalSets > 0 ? completedSets / totalSets : 0;

    totalDurationSeconds += Math.round(calculateBlockEstimatedDuration(block) * ratio);

    const status: BlockLog['status'] =
      completedSets >= totalSets ? 'completed' : completedSets > 0 ? 'in_progress' : 'skipped';

    return {
      id: generateUUID(),
      sessionId: session.id,
      blockId: block.id,
      position: idx,
      blockTitle: block.title,
      blockType: block.type,
      status,
      completedSets,
      targetSets: totalSets,
      actualWorkSeconds: 0,
      actualRestSeconds: 0,
    };
  });

  return {
    ...session,
    status: 'completed',
    completedAt: new Date().toISOString(),
    durationSeconds: totalDurationSeconds,
    overallRpe,
    notes: notes || session.notes,
    logs,
  };
}
