'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Clock, Flame, CheckCircle, Star } from 'lucide-react';
import { WorkoutSession } from '@/lib/types';
import { formatDurationHuman, formatSecondsToTime, RPE_LEVELS } from '@/lib/timer/durationHelper';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface SessionCompleteModalProps {
  isOpen: boolean;
  session: WorkoutSession | null;
  totalElapsedSeconds: number;
  onSave: (overallRpe: number, notes?: string) => void;
  onCancel: () => void;
}

export function SessionCompleteModal({
  isOpen,
  session,
  totalElapsedSeconds,
  onSave,
  onCancel,
}: SessionCompleteModalProps) {
  const [selectedRpe, setSelectedRpe] = useState<number>(7);
  const [sessionNotes, setSessionNotes] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Disparar confeti deportivo
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#D9532F', '#4E8252', '#D9822B', '#181B1E'],
        });
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen || !session) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(selectedRpe, sessionNotes);
  };

  const completedBlocksCount = session.logs.filter((l) => l.status === 'completed').length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="¡Entrenamiento Completado!"
      description="Registra la percepción de esfuerzo y tus sensaciones generales"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Cabecera resumen de la sesión */}
        <div className="bg-gradient-to-r from-terracotta-50 to-moss-50 dark:from-terracotta-950/40 dark:to-moss-950/40 p-4 rounded-2xl border border-terracotta-200 dark:border-graphite-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-terracotta text-white flex items-center justify-center shadow-md">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-graphite-900 dark:text-graphite-100 truncate">
                {session.title}
              </h3>
              <p className="text-xs text-graphite-600 dark:text-graphite-400">
                {completedBlocksCount} de {session.blocks.length} bloques completados
              </p>
            </div>
          </div>

          <div className="text-right font-mono">
            <div className="text-lg font-black text-terracotta dark:text-terracotta-400">
              {formatSecondsToTime(totalElapsedSeconds)}
            </div>
            <div className="text-[11px] text-graphite-500 font-sans">Tiempo total</div>
          </div>
        </div>

        {/* Selector de RPE (1 al 10) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-graphite-600 dark:text-graphite-400">
              Esfuerzo Percibido (RPE 1-10)
            </label>
            <span className="text-xs font-bold text-terracotta">
              {RPE_LEVELS.find((r) => r.value === selectedRpe)?.label}
            </span>
          </div>

          {/* Botones numéricos de 1 a 10 con toque rápido */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 mb-2">
            {RPE_LEVELS.map((rpe) => (
              <button
                key={rpe.value}
                type="button"
                onClick={() => setSelectedRpe(rpe.value)}
                className={`py-3 rounded-xl font-mono font-bold text-sm transition-all ${
                  selectedRpe === rpe.value
                    ? 'bg-terracotta text-white shadow-md ring-2 ring-terracotta/40 scale-105'
                    : 'bg-chalk-200 dark:bg-graphite-800 text-graphite-800 dark:text-graphite-200 hover:bg-chalk-300 dark:hover:bg-graphite-700'
                }`}
              >
                {rpe.value}
              </button>
            ))}
          </div>

          <p className="text-xs text-graphite-500 dark:text-graphite-400 italic">
            &ldquo;{RPE_LEVELS.find((r) => r.value === selectedRpe)?.desc}&rdquo;
          </p>
        </div>

        {/* Notas generales de la sesión */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-graphite-600 dark:text-graphite-400 mb-1.5">
            Notas de la Sesión
          </label>
          <textarea
            rows={3}
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            placeholder="¿Cómo te has sentido? (Ej: Buena fuerza de dedos, antebrazos congestionados, encadené el proyecto al 3er intento...)"
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-chalk-100 dark:bg-graphite-800 text-graphite-900 dark:text-graphite-100 border border-chalk-300 dark:border-graphite-700 focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta"
          />
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Volver
          </Button>
          <Button type="submit" variant="success" size="lg">
            <CheckCircle className="w-5 h-5 mr-1.5" />
            Guardar en Historial
          </Button>
        </div>
      </form>
    </Modal>
  );
}
