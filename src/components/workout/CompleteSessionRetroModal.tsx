'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, Check, X as XIcon } from 'lucide-react';
import { WorkoutSession } from '@/lib/types';
import { getBlockTargetUnits } from '@/lib/timer/timerEngine';
import { formatBlockSummary, BLOCK_TYPE_CONFIG, RPE_LEVELS } from '@/lib/timer/durationHelper';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface CompleteSessionRetroModalProps {
  isOpen: boolean;
  session: WorkoutSession | null;
  onSave: (data: { completions: Record<string, number>; overallRpe: number; notes?: string }) => void;
  onCancel: () => void;
}

export function CompleteSessionRetroModal({
  isOpen,
  session,
  onSave,
  onCancel,
}: CompleteSessionRetroModalProps) {
  const [completions, setCompletions] = useState<Record<string, number>>({});
  const [selectedRpe, setSelectedRpe] = useState<number>(7);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (session) {
      // Por defecto se asume que todo se hizo como estaba planificado; se ajusta lo que faltó
      const initial: Record<string, number> = {};
      session.blocks.forEach((b) => {
        initial[b.id] = getBlockTargetUnits(b).totalSets;
      });
      setCompletions(initial);
      setSelectedRpe(7);
      setNotes('');
    }
  }, [session]);

  if (!isOpen || !session) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ completions, overallRpe: selectedRpe, notes: notes.trim() || undefined });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Marcar Sesión como Completada"
      description="Indica qué series conseguiste hacer de cada ejercicio de esta sesión planificada"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Desglose por ejercicio */}
        <div className="space-y-2.5">
          {session.blocks.map((block) => {
            const typeConfig = BLOCK_TYPE_CONFIG[block.type];
            const totalSets = getBlockTargetUnits(block).totalSets;
            const completed = completions[block.id] ?? totalSets;

            return (
              <div
                key={block.id}
                className="p-3.5 rounded-2xl bg-chalk-50 dark:bg-graphite-850 border border-chalk-200 dark:border-graphite-750 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-graphite-900 dark:text-graphite-100 truncate">
                        {block.title}
                      </h4>
                      <Badge variant={typeConfig.variant} size="sm">
                        {typeConfig.label}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-graphite-500 mt-0.5">{formatBlockSummary(block)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <input
                    type="range"
                    min={0}
                    max={totalSets}
                    step={1}
                    value={completed}
                    onChange={(e) => setCompletions((prev) => ({ ...prev, [block.id]: Number(e.target.value) }))}
                    className="flex-1 accent-terracotta"
                  />
                  <span className="font-mono font-bold text-sm text-graphite-900 dark:text-graphite-100 shrink-0 w-14 text-right">
                    {completed} / {totalSets}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCompletions((prev) => ({ ...prev, [block.id]: totalSets }))}
                    className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors ${
                      completed === totalSets
                        ? 'bg-moss text-white'
                        : 'bg-white dark:bg-graphite-900 text-graphite-600 dark:text-graphite-300 border border-chalk-300 dark:border-graphite-700'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Completo
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompletions((prev) => ({ ...prev, [block.id]: 0 }))}
                    className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors ${
                      completed === 0
                        ? 'bg-red-500 text-white'
                        : 'bg-white dark:bg-graphite-900 text-graphite-600 dark:text-graphite-300 border border-chalk-300 dark:border-graphite-700'
                    }`}
                  >
                    <XIcon className="w-3.5 h-3.5" />
                    No me dio tiempo
                  </button>
                </div>
              </div>
            );
          })}
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

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
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
        </div>

        {/* Notas generales de la sesión */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-graphite-600 dark:text-graphite-400 mb-1.5">
            Notas de la Sesión
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: No me dio tiempo a la última serie de dominadas, el resto salió bien..."
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-chalk-100 dark:bg-graphite-800 text-graphite-900 dark:text-graphite-100 border border-chalk-300 dark:border-graphite-700 focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta"
          />
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
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
