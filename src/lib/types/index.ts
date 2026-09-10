export type BlockType = 'intervals' | 'reps' | 'attempts' | 'problems' | 'free';

export type TimerPhase = 'idle' | 'work' | 'rest' | 'blockCompleted' | 'sessionCompleted';

export interface WorkoutBlock {
  id: string;
  templateId?: string;
  templateTitle?: string;
  position: number;
  title: string;
  type: BlockType;
  // Campos del modelo unificado
  sets?: number;                  // Series
  repetitions?: number;           // Repeticiones / bloques
  workDurationSeconds?: number;   // Tiempo de trabajo (si es por tiempo)
  restBetweenRepsSeconds?: number;// Descanso entre repeticiones
  restDurationSeconds?: number;   // Descanso entre series
  load?: string;                  // Lastre / Carga (ej. "+15 kg", "20 mm")
  target?: string;                // Objetivo / Lastre libre
  notes?: string;                 // Notas o indicaciones
  attempts?: number;
  problems?: number;
  movements?: number;
}

export interface WorkoutTemplate {
  id: string;
  userId?: string;
  title: string;
  type: BlockType;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'abandoned';

export interface BlockLog {
  id: string;
  sessionId: string;
  blockId?: string;
  position: number;
  blockTitle: string;
  blockType: BlockType;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedSets: number;
  targetSets: number;
  actualWorkSeconds: number;
  actualRestSeconds: number;
  rpe?: number; // 1 - 10
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  userId?: string;
  templateId?: string;
  title: string;
  scheduledDate?: string; // Fecha asignada (YYYY-MM-DD) para planificación
  startedAt: string;
  completedAt?: string;
  durationSeconds: number;
  overallRpe?: number; // 1 - 10
  status: SessionStatus;
  notes?: string;
  blocks: WorkoutBlock[];
  logs: BlockLog[];
}

export interface TestSet {
  setNumber: number;
  value: number;
  notes?: string;
}

export interface TestRecord {
  id: string;
  userId?: string;
  title: string;          // Ej: "Hangboard 20 mm", "Dominada lastrada", "Máximo grado"
  protocol?: string;       // Ej: "7s suspensión monobrazo", "1RM con cinto", "A vista"
  value: number;          // Mejor marca / Valor principal (ej: 25.5, 8.1, etc.)
  unit: string;           // "kg", "s", "rep", "grado", "%", "mm"
  testedAt: string;       // ISO date
  notes?: string;
  sets?: TestSet[];       // Múltiples series para análisis de fatiga rápida
  targetMetric?: 'higher_is_better' | 'lower_is_better';
  createdAt: string;
}

export interface UserSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  darkMode: boolean;
  autoStartRest: boolean;
  voiceCountdown: boolean;
}

export interface ActiveWorkoutState {
  session: WorkoutSession | null;
  currentBlockIndex: number;
  currentSet: number; // 1-indexed (Serie o Intento actual)
  currentProblemIndex?: number; // 1-indexed para problemas
  phase: TimerPhase;
  phaseStartTime: number | null; // Timestamp en ms (Date.now())
  phaseTargetDuration: number;   // Duración en segundos de la fase actual
  phaseTargetEnd: number | null; // Timestamp esperado de fin en ms
  secondsRemaining: number;     // Tiempo restante en segundos
  isRunning: boolean;
  isPaused: boolean;
  pausedAt: number | null;
  elapsedBeforePause: number;
  totalSessionElapsedSeconds: number;
}
