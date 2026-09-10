'use client';

import React from 'react';
import { TimerPhase, WorkoutBlock } from '@/lib/types';
import { formatSecondsToTime } from '@/lib/timer/durationHelper';
import { getBlockTargetUnits } from '@/lib/timer/timerEngine';
import { Flame, Coffee, CheckCircle2, Pause } from 'lucide-react';

interface TimerDisplayProps {
  block: WorkoutBlock;
  phase: TimerPhase;
  secondsRemaining: number;
  phaseDuration: number;
  currentSet: number;
  currentProblemIndex?: number;
  currentAttempt?: number;
  isPaused: boolean;
  isRunning: boolean;
}

export function TimerDisplay({
  block,
  phase,
  secondsRemaining,
  phaseDuration,
  currentSet,
  currentProblemIndex = 1,
  currentAttempt = 1,
  isPaused,
  isRunning,
}: TimerDisplayProps) {
  const { totalSets, totalProblems, totalAttempts } = getBlockTargetUnits(block);

  // Progreso circular (0 a 100)
  const progressPercent = phaseDuration > 0
    ? Math.max(0, Math.min(100, ((phaseDuration - secondsRemaining) / phaseDuration) * 100))
    : 0;

  // Parámetros de color y etiqueta según la fase
  let phaseLabel = 'LISTO PARA COMENZAR';
  let phaseColor = 'text-graphite-700 dark:text-graphite-300';
  let phaseBg = 'bg-chalk-200 dark:bg-graphite-800';
  let strokeColor = '#636E7D';
  let PhaseIcon = Flame;

  if (phase === 'work') {
    phaseLabel = 'TRABAJO ACTIVO';
    phaseColor = 'text-white';
    phaseBg = 'bg-terracotta shadow-lg shadow-terracotta/30 animate-pulse-fast';
    strokeColor = '#D9532F';
    PhaseIcon = Flame;
  } else if (phase === 'rest') {
    phaseLabel = 'DESCANSO';
    phaseColor = 'text-white';
    phaseBg = 'bg-moss shadow-lg shadow-moss/30';
    strokeColor = '#4E8252';
    PhaseIcon = Coffee;
  } else if (phase === 'blockCompleted') {
    phaseLabel = 'BLOQUE COMPLETADO';
    phaseColor = 'text-white';
    phaseBg = 'bg-amber-600';
    strokeColor = '#D9822B';
    PhaseIcon = CheckCircle2;
  }

  if (isPaused) {
    phaseLabel = 'EN PAUSA';
    phaseBg = 'bg-graphite-600 text-white';
    PhaseIcon = Pause;
  }

  // Radio y circunferencia para SVG circular
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center text-center select-none py-2">
      {/* Badge de Fase Actual */}
      <div
        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase transition-all duration-200 ${phaseBg} ${phaseColor} mb-4`}
      >
        <PhaseIcon className="w-4 h-4 shrink-0" />
        <span>{phaseLabel}</span>
      </div>

      {/* Anillo de progreso y Contador Gigante */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 300 300">
          {/* Fondo del círculo */}
          <circle
            cx="150"
            cy="150"
            r={radius}
            stroke="currentColor"
            strokeWidth="14"
            className="text-chalk-300 dark:text-graphite-800"
            fill="transparent"
          />
          {/* Progreso del temporizador */}
          <circle
            cx="150"
            cy="150"
            r={radius}
            stroke={strokeColor}
            strokeWidth="14"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-linear"
            fill="transparent"
          />
        </svg>

        {/* Texto central del temporizador */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-mono font-black tracking-tighter tabular-nums leading-none ${
              secondsRemaining <= 3 && isRunning && !isPaused
                ? 'text-7xl sm:text-8xl text-red-500 scale-110 animate-ping'
                : 'text-6xl sm:text-7xl text-graphite-950 dark:text-white'
            }`}
          >
            {formatSecondsToTime(secondsRemaining)}
          </span>

          {/* Subtítulo de progreso de series / intentos */}
          <div className="mt-2 text-xs font-bold text-graphite-500 dark:text-graphite-400 uppercase tracking-wider">
            {block.type === 'problems' ? (
              <span>
                Bloque {currentProblemIndex}/{totalProblems} &bull; Intento {currentAttempt}/{totalAttempts}
              </span>
            ) : block.type === 'attempts' ? (
              <span>Intento {currentSet} de {totalSets}</span>
            ) : block.type === 'free' ? (
              <span>Registro Libre</span>
            ) : (
              <span>Serie {currentSet} de {totalSets}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
