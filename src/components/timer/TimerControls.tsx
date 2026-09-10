'use client';

import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Plus,
  Minus,
  CheckCheck,
  StickyNote,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { TimerPhase, WorkoutBlock } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

interface TimerControlsProps {
  block: WorkoutBlock;
  phase: TimerPhase;
  isRunning: boolean;
  isPaused: boolean;
  onStart: (phase?: 'work' | 'rest') => void;
  onPause: () => void;
  onResume: () => void;
  onSkipPhase: () => void;
  onAdjustSeconds: (delta: number) => void;
  onFinishBlock: () => void;
  onNextBlock?: () => void;
  hasNextBlock: boolean;
  blockNotes: string;
  onSaveNotes: (notes: string) => void;
}

export function TimerControls({
  block,
  phase,
  isRunning,
  isPaused,
  onStart,
  onPause,
  onResume,
  onSkipPhase,
  onAdjustSeconds,
  onFinishBlock,
  onNextBlock,
  hasNextBlock,
  blockNotes,
  onSaveNotes,
}: TimerControlsProps) {
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [currentNoteText, setCurrentNoteText] = useState(blockNotes || '');

  const handleSaveNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveNotes(currentNoteText);
    setIsNoteModalOpen(false);
  };

  const isFreeType = block.type === 'free';
  const isBlockCompleted = phase === 'blockCompleted';

  return (
    <div className="w-full space-y-4 max-w-md mx-auto">
      {/* 1. Botón Principal de Gran Tamaño (Iniciar / Pausar / Reanudar) */}
      {!isBlockCompleted && !isFreeType && (
        <div className="grid grid-cols-1 gap-2">
          {!isRunning && !isPaused ? (
            <Button
              variant={block.type === 'intervals' ? 'primary' : 'success'}
              size="xl"
              fullWidth
              onClick={() => onStart(block.type === 'intervals' ? 'work' : 'rest')}
              className="py-5 text-xl font-bold uppercase tracking-wider shadow-lg"
            >
              <Play className="w-6 h-6 mr-2 fill-current" />
              {block.type === 'intervals' ? 'Iniciar Serie (Trabajo)' : 'Iniciar Descanso'}
            </Button>
          ) : isPaused ? (
            <Button
              variant="primary"
              size="xl"
              fullWidth
              onClick={onResume}
              className="py-5 text-xl font-bold uppercase tracking-wider bg-moss hover:bg-moss-600 shadow-lg"
            >
              <Play className="w-6 h-6 mr-2 fill-current" />
              Reanudar Temporizador
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="xl"
              fullWidth
              onClick={onPause}
              className="py-5 text-xl font-bold uppercase tracking-wider bg-graphite-800 text-white hover:bg-graphite-700 dark:bg-graphite-700"
            >
              <Pause className="w-6 h-6 mr-2 fill-current" />
              Pausar
            </Button>
          )}
        </div>
      )}

      {/* Si es registro libre, botón de completar bloque directamente */}
      {isFreeType && !isBlockCompleted && (
        <Button
          variant="success"
          size="xl"
          fullWidth
          onClick={onFinishBlock}
          className="py-5 text-xl font-bold uppercase tracking-wider shadow-lg"
        >
          <CheckCheck className="w-6 h-6 mr-2" />
          Completar Bloque Libre
        </Button>
      )}

      {/* Si el bloque está completado, botón para pasar al siguiente */}
      {isBlockCompleted && (
        <div className="space-y-2 animate-scale-up">
          <div className="p-3 bg-moss-100 dark:bg-moss-900/40 text-moss-900 dark:text-moss-200 rounded-xl text-center font-bold text-sm flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-moss" />
            ¡Bloque completado con éxito!
          </div>
          {hasNextBlock ? (
            <Button
              variant="primary"
              size="xl"
              fullWidth
              onClick={onNextBlock}
              className="py-5 text-lg font-bold tracking-wide"
            >
              Siguiente Bloque
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button
              variant="success"
              size="xl"
              fullWidth
              onClick={onFinishBlock}
              className="py-5 text-lg font-bold tracking-wide"
            >
              Finalizar Sesión Completa
              <CheckCheck className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      )}

      {/* 2. Botón de Acción Rápida a 1 TOQUE: Saltar fase / Completar Serie */}
      {!isBlockCompleted && !isFreeType && (
        <div className="grid grid-cols-2 gap-2.5">
          <Button
            variant="outline"
            size="lg"
            onClick={onSkipPhase}
            className="flex items-center justify-center gap-1.5 font-bold min-h-[52px] border-chalk-300 dark:border-graphite-700 bg-white dark:bg-graphite-850 text-graphite-900 dark:text-graphite-100"
          >
            <FastForward className="w-5 h-5 text-terracotta" />
            {phase === 'work' ? 'Saltar a Descanso' : 'Siguiente Serie'}
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={onFinishBlock}
            className="flex items-center justify-center gap-1.5 font-bold min-h-[52px] border-chalk-300 dark:border-graphite-700 bg-white dark:bg-graphite-850 text-graphite-900 dark:text-graphite-100"
          >
            <CheckCheck className="w-5 h-5 text-moss" />
            Terminar Bloque
          </Button>
        </div>
      )}

      {/* 3. Ajustes de Tiempo (+15s / -15s) y Notas */}
      {!isBlockCompleted && !isFreeType && (
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onAdjustSeconds(-15)}
              aria-label="Restar 15 segundos"
              className="px-3.5 py-2.5 rounded-xl border border-chalk-300 dark:border-graphite-700 bg-chalk-100 dark:bg-graphite-800 text-graphite-700 dark:text-graphite-300 font-mono font-bold text-xs hover:bg-chalk-200 dark:hover:bg-graphite-700 active:scale-95 transition-all flex items-center gap-1 min-h-[44px]"
            >
              <Minus className="w-3.5 h-3.5" /> 15s
            </button>
            <button
              type="button"
              onClick={() => onAdjustSeconds(15)}
              aria-label="Sumar 15 segundos"
              className="px-3.5 py-2.5 rounded-xl border border-chalk-300 dark:border-graphite-700 bg-chalk-100 dark:bg-graphite-800 text-graphite-700 dark:text-graphite-300 font-mono font-bold text-xs hover:bg-chalk-200 dark:hover:bg-graphite-700 active:scale-95 transition-all flex items-center gap-1 min-h-[44px]"
            >
              <Plus className="w-3.5 h-3.5" /> 15s
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setCurrentNoteText(blockNotes || '');
              setIsNoteModalOpen(true);
            }}
            aria-label="Añadir nota al bloque"
            className={`px-3.5 py-2.5 rounded-xl border font-semibold text-xs transition-all flex items-center gap-1.5 min-h-[44px] ${
              blockNotes
                ? 'border-terracotta bg-terracotta-50 dark:bg-terracotta-900/30 text-terracotta-900 dark:text-terracotta-200'
                : 'border-chalk-300 dark:border-graphite-700 bg-chalk-100 dark:bg-graphite-800 text-graphite-700 dark:text-graphite-300 hover:bg-chalk-200'
            }`}
          >
            <StickyNote className="w-4 h-4 text-terracotta" />
            {blockNotes ? 'Nota guardada' : 'Añadir nota'}
          </button>
        </div>
      )}

      {/* Modal de Notas Rápidas */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title="Notas de este Bloque"
        description="Anota sensaciones, peso extra, agarre o fallo durante el entrenamiento"
      >
        <form onSubmit={handleSaveNoteSubmit} className="space-y-4">
          <Input
            value={currentNoteText}
            onChange={(e) => setCurrentNoteText(e.target.value)}
            placeholder="Ej: Lastre +5kg en la 3ª serie, antebrazo muy inflado..."
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsNoteModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Guardar Nota
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
