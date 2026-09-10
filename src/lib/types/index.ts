export type BlockType = 'intervals' | 'reps' | 'attempts' | 'problems' | 'free';

export type TimerPhase = 'idle' | 'work' | 'rest' | 'blockCompleted' | 'sessionCompleted';

export interface WorkoutBlock {
  id: string;
  templateId?: string;
  position: number;
  title: string;
  type: BlockType;
  // Campos específicos según tipo
  sets?: number;                  // Para intervals y reps
  workDurationSeconds?: number;   // Para intervals (ej. 180 para 3:00)
  restDurationSeconds?: number;   // Para intervals, reps, attempts, problems
  repetitions?: number;           // Para reps
  attempts?: number;              // Para attempts y problems
  problems?: number;              // Para problems (número de bloques)
  movements?: number;             // Para problems (opcional: movimientos por bloque)
  target?: string;                // Objetivo libre (ej. "7a+", "20mm", "RPE 8")
  notes?: string;                 // Notas o indicaciones
}

export interface WorkoutTemplate {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  estimatedDurationSeconds: number;
  blocks: WorkoutBlock[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SessionStatus = 'in_progress' | 'completed' | 'abandoned';

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
  targetMetric?: 'higher_is_better' | 'lower_is_better'; // 'higher_is_better' (más es mejor) o 'lower_is_better' (menos es mejor: ej. mm de regleta)
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
