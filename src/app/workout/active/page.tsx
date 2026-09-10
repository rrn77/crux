'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Flame,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  StickyNote,
} from 'lucide-react';
import { useWorkoutTimer } from '@/lib/timer/useWorkoutTimer';
import { formatSecondsToTime, formatDurationHuman, formatBlockSummary } from '@/lib/timer/durationHelper';
import { TimerDisplay } from '@/components/timer/TimerDisplay';
import { TimerControls } from '@/components/timer/TimerControls';
import { SessionCompleteModal } from '@/components/timer/SessionCompleteModal';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export default function ActiveWorkoutPage() {
  const router = useRouter();
  const timer = useWorkoutTimer();

  const [isAbandonModalOpen, setIsAbandonModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Si no hay sesión activa, redirigir a inicio
  useEffect(() => {
    if (mounted && (!timer.isActive || !timer.session)) {
      router.replace('/');
    }
  }, [mounted, timer.isActive, timer.session, router]);

  if (!mounted || !timer.session || !timer.currentBlock) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-4 animate-fade-in">
        <div className="w-12 h-12 rounded-full border-4 border-terracotta border-t-transparent animate-spin" />
        <p className="text-sm font-bold text-graphite-600 dark:text-graphite-400">
          Cargando sesión de entrenamiento...
        </p>
      </div>
    );
  }

  const { session, currentBlock, currentLog, timerState, currentBlockIndex, totalBlocks } = timer;
  const hasNextBlock = currentBlockIndex < totalBlocks - 1;

  const handleFinishBlockAction = () => {
    timer.finishCurrentBlock();
    if (!hasNextBlock) {
      setIsCompleteModalOpen(true);
    }
  };

  const handleSaveCompleteSession = (overallRpe: number, sessionNotes?: string) => {
    const completed = timer.completeSession(overallRpe, sessionNotes);
    setIsCompleteModalOpen(false);
    if (completed) {
      router.push(`/history/${completed.id}`);
    } else {
      router.push('/history');
    }
  };

  const handleAbandonConfirm = () => {
    timer.abandonSession();
    setIsAbandonModalOpen(false);
    router.replace('/');
  };

  // Progreso general de bloques (0 a 100)
  const sessionProgressPercent = totalBlocks > 0
    ? Math.round(((currentBlockIndex + (timerState.phase === 'blockCompleted' ? 1 : 0)) / totalBlocks) * 100)
    : 0;

  return (
    <div className="min-h-screen flex flex-col justify-between py-2 sm:py-4 select-none animate-fade-in max-w-xl mx-auto">
      {/* 1. Barra Superior con Título, Tiempo Total y Salir */}
      <div className="flex items-center justify-between gap-2 px-1">
        <button
          type="button"
          onClick={() => setIsAbandonModalOpen(true)}
          aria-label="Salir o abandonar sesión"
          className="p-2 rounded-xl text-graphite-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Título de Sesión y Tiempo Total Transcurrido */}
        <div className="text-center min-w-0 flex-1">
          <h1 className="text-sm font-black text-graphite-900 dark:text-graphite-100 truncate">
            {session.title}
          </h1>
          <div className="flex items-center justify-center gap-1.5 text-xs text-graphite-500 font-mono mt-0.5">
            <Clock className="w-3.5 h-3.5 text-terracotta" />
            <span>{formatSecondsToTime(timer.totalSessionElapsedSeconds)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCompleteModalOpen(true)}
          className="text-xs font-bold text-moss dark:text-moss-400 hover:underline px-2 py-1"
        >
          Terminar
        </button>
      </div>

      {/* 2. Barra de Progreso de la Sesión */}
      <div className="my-2 px-1">
        <div className="flex items-center justify-between text-xs text-graphite-500 font-medium mb-1.5">
          <span>
            Bloque {currentBlockIndex + 1} de {totalBlocks}
          </span>
          <span className="font-mono font-bold text-terracotta">{sessionProgressPercent}%</span>
        </div>
        <div className="w-full h-2 bg-chalk-300 dark:bg-graphite-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-terracotta to-moss transition-all duration-300 rounded-full"
            style={{ width: `${sessionProgressPercent}%` }}
          />
        </div>
      </div>

      {/* 3. Tarjeta del Bloque Activo */}
      <div className="bg-white dark:bg-graphite-900 p-4 rounded-2xl border border-chalk-300 dark:border-graphite-800 shadow-sm text-center my-1 space-y-1">
        <div className="flex items-center justify-between gap-1 text-xs text-graphite-500 font-bold uppercase tracking-wider">
          <button
            type="button"
            onClick={timer.prevBlock}
            disabled={currentBlockIndex <= 0}
            className="p-1 text-graphite-400 hover:text-graphite-700 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="truncate px-2">{currentBlock.title}</span>

          <button
            type="button"
            onClick={timer.nextBlock}
            disabled={!hasNextBlock}
            className="p-1 text-graphite-400 hover:text-graphite-700 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs font-semibold text-terracotta">
          {formatBlockSummary(currentBlock)}
        </p>

        {currentBlock.target && (
          <div className="inline-block text-[11px] font-bold bg-chalk-200 dark:bg-graphite-800 px-2.5 py-0.5 rounded-full text-graphite-700 dark:text-graphite-300 mt-1">
            Objetivo: {currentBlock.target}
          </div>
        )}
      </div>

      {/* 4. Temporizador Gigante de Alto Contraste */}
      <div className="my-auto py-2">
        <TimerDisplay
          block={currentBlock}
          phase={timerState.phase}
          secondsRemaining={timerState.secondsRemaining}
          phaseDuration={timerState.phaseDurationSeconds}
          currentSet={timerState.currentSet}
          currentProblemIndex={timerState.currentProblemIndex}
          currentAttempt={timerState.currentAttempt}
          isPaused={timerState.isPaused}
          isRunning={timerState.isRunning}
        />
      </div>

      {/* 5. Controles Táctiles Rápidos */}
      <div className="mt-auto pt-2">
        <TimerControls
          block={currentBlock}
          phase={timerState.phase}
          isRunning={timerState.isRunning}
          isPaused={timerState.isPaused}
          onStart={timer.startTimer}
          onPause={timer.pauseTimer}
          onResume={timer.resumeTimer}
          onSkipPhase={timer.skipPhase}
          onAdjustSeconds={timer.adjustSeconds}
          onFinishBlock={handleFinishBlockAction}
          onNextBlock={timer.nextBlock}
          hasNextBlock={hasNextBlock}
          blockNotes={currentLog?.notes || ''}
          onSaveNotes={timer.setBlockNote}
        />
      </div>

      {/* Modal para Abandonar Sesión */}
      <Modal
        isOpen={isAbandonModalOpen}
        onClose={() => setIsAbandonModalOpen(false)}
        title="¿Abandonar entrenamiento?"
        description="Si sales ahora, los bloques no guardados se perderán."
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>El progreso de esta sesión se descartará.</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsAbandonModalOpen(false)}>
              Continuar Entrenando
            </Button>
            <Button variant="danger" onClick={handleAbandonConfirm}>
              Abandonar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Finalización con RPE */}
      <SessionCompleteModal
        isOpen={isCompleteModalOpen}
        session={session}
        totalElapsedSeconds={timer.totalSessionElapsedSeconds}
        onSave={handleSaveCompleteSession}
        onCancel={() => setIsCompleteModalOpen(false)}
      />
    </div>
  );
}
