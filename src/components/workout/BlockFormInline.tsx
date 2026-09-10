'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Sparkles, Check, X } from 'lucide-react';
import { BlockType, WorkoutBlock } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatBlockSummary, BLOCK_TYPE_CONFIG } from '@/lib/timer/durationHelper';
import { generateUUID } from '@/lib/store/workoutStore';

const BLOCK_TYPES: BlockType[] = ['intervals', 'reps', 'problems', 'attempts', 'free'];

interface PrescriptionFormValues {
  title: string;
  sets: string;
  workMinutes: string;
  workSeconds: string;
  restSetsMinutes: string;
  restSetsSeconds: string;
  repetitions: string;
  restRepsMinutes: string;
  restRepsSeconds: string;
  problems: string;
  movements: string;
  attemptsPerProblem: string;
  attempts: string;
  load: string;
  target: string;
  notes: string;
}

interface BlockFormInlineProps {
  initialBlock?: WorkoutBlock | null;
  onSave: (block: WorkoutBlock) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

function toNum(value: string): number | undefined {
  const n = parseInt(value, 10);
  return isNaN(n) || n <= 0 ? undefined : n;
}

function toSeconds(min: string, sec: string): number | undefined {
  const total = (toNum(min) || 0) * 60 + (toNum(sec) || 0);
  return total > 0 ? total : undefined;
}

function secToMinSec(totalSeconds?: number): { min: string; sec: string } {
  if (!totalSeconds || totalSeconds <= 0) return { min: '', sec: '' };
  return {
    min: String(Math.floor(totalSeconds / 60)),
    sec: String(totalSeconds % 60),
  };
}

const emptyValues: PrescriptionFormValues = {
  title: '',
  sets: '',
  workMinutes: '',
  workSeconds: '',
  restSetsMinutes: '',
  restSetsSeconds: '',
  repetitions: '',
  restRepsMinutes: '',
  restRepsSeconds: '',
  problems: '',
  movements: '',
  attemptsPerProblem: '',
  attempts: '',
  load: '',
  target: '',
  notes: '',
};

function blockToFormValues(block: WorkoutBlock): PrescriptionFormValues {
  const work = secToMinSec(block.workDurationSeconds);
  const restSets = secToMinSec(block.restDurationSeconds);
  const restReps = secToMinSec(block.restBetweenRepsSeconds);

  return {
    title: block.title || '',
    sets: block.sets ? String(block.sets) : '',
    workMinutes: work.min,
    workSeconds: work.sec,
    restSetsMinutes: restSets.min,
    restSetsSeconds: restSets.sec,
    repetitions: block.repetitions ? String(block.repetitions) : '',
    restRepsMinutes: restReps.min,
    restRepsSeconds: restReps.sec,
    problems: block.problems ? String(block.problems) : '',
    movements: block.movements ? String(block.movements) : '',
    attemptsPerProblem: block.type === 'problems' && block.attempts ? String(block.attempts) : '',
    attempts: block.type === 'attempts' && block.attempts ? String(block.attempts) : '',
    load: block.load || '',
    target: block.type === 'free' ? block.target || '' : '',
    notes: block.notes || '',
  };
}

export function BlockFormInline({
  initialBlock,
  onSave,
  onCancel,
  submitLabel = 'Guardar Ejercicio',
}: BlockFormInlineProps) {
  // El tipo viene fijo de la plantilla (o del bloque que se está editando); solo se elige
  // manualmente cuando se crea un ejercicio suelto sin plantilla asociada.
  const [adHocType, setAdHocType] = useState<BlockType>(initialBlock?.type || 'intervals');
  const activeType = initialBlock?.type || adHocType;
  const isTypeLocked = Boolean(initialBlock);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<PrescriptionFormValues>({
    defaultValues: initialBlock ? blockToFormValues(initialBlock) : emptyValues,
  });

  useEffect(() => {
    if (initialBlock) {
      setAdHocType(initialBlock.type);
      reset(blockToFormValues(initialBlock));
    } else {
      reset(emptyValues);
    }
  }, [initialBlock, reset]);

  const watchedValues = watch();

  const onSubmit = (data: PrescriptionFormValues) => {
    const block: WorkoutBlock = {
      id: initialBlock?.id || generateUUID(),
      templateId: initialBlock?.templateId,
      templateTitle: initialBlock?.templateTitle,
      position: initialBlock?.position ?? 0,
      title: data.title.trim(),
      type: activeType,
      sets: activeType === 'free' ? undefined : toNum(data.sets),
      workDurationSeconds: activeType === 'intervals' ? toSeconds(data.workMinutes, data.workSeconds) : undefined,
      restDurationSeconds:
        activeType === 'free' ? undefined : toSeconds(data.restSetsMinutes, data.restSetsSeconds),
      repetitions: activeType === 'reps' || activeType === 'intervals' ? toNum(data.repetitions) : undefined,
      restBetweenRepsSeconds: activeType === 'intervals' ? toSeconds(data.restRepsMinutes, data.restRepsSeconds) : undefined,
      problems: activeType === 'problems' ? toNum(data.problems) : undefined,
      movements: activeType === 'problems' ? toNum(data.movements) : undefined,
      attempts:
        activeType === 'problems'
          ? toNum(data.attemptsPerProblem)
          : activeType === 'attempts'
          ? toNum(data.attempts)
          : undefined,
      load: data.load.trim() || undefined,
      target: activeType === 'free' ? data.target.trim() || undefined : data.load.trim() || undefined,
      notes: data.notes.trim() || undefined,
    };

    onSave(block);
  };

  // Previsualización en vivo
  const previewBlock: WorkoutBlock = {
    id: 'preview',
    position: 0,
    title: watchedValues.title || 'Nombre del ejercicio',
    type: activeType,
    sets: toNum(watchedValues.sets),
    workDurationSeconds: activeType === 'intervals' ? toSeconds(watchedValues.workMinutes, watchedValues.workSeconds) : undefined,
    restDurationSeconds: toSeconds(watchedValues.restSetsMinutes, watchedValues.restSetsSeconds),
    repetitions: activeType === 'reps' || activeType === 'intervals' ? toNum(watchedValues.repetitions) : undefined,
    restBetweenRepsSeconds: activeType === 'intervals' ? toSeconds(watchedValues.restRepsMinutes, watchedValues.restRepsSeconds) : undefined,
    problems: activeType === 'problems' ? toNum(watchedValues.problems) : undefined,
    movements: activeType === 'problems' ? toNum(watchedValues.movements) : undefined,
    attempts:
      activeType === 'problems'
        ? toNum(watchedValues.attemptsPerProblem)
        : activeType === 'attempts'
        ? toNum(watchedValues.attempts)
        : undefined,
    load: watchedValues.load,
    target: activeType === 'free' ? watchedValues.target : watchedValues.load,
    notes: watchedValues.notes,
  };

  const typeConfig = BLOCK_TYPE_CONFIG[activeType];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* 1. Nombre del ejercicio */}
      <Input
        label="Ejercicio"
        placeholder="Ej: Suspensiones 7/3, Dominadas con lastre, Bloques de 4 movimientos..."
        {...register('title', { required: true })}
        error={errors.title ? 'El nombre del ejercicio es obligatorio' : undefined}
        className="text-base font-bold"
      />

      {/* 2. Tipo de ejecución: fijo si viene de una plantilla, elegible si es un ejercicio suelto */}
      {isTypeLocked ? (
        <Badge variant={typeConfig.variant} size="sm">
          <typeConfig.icon className="w-3 h-3" />
          {typeConfig.label}
        </Badge>
      ) : (
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-graphite-700 dark:text-graphite-300">
            ¿Qué tipo de ejercicio es?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {BLOCK_TYPES.map((type) => {
              const config = BLOCK_TYPE_CONFIG[type];
              const isSelected = adHocType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAdHocType(type)}
                  className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 transition-all ${
                    isSelected
                      ? 'border-terracotta bg-terracotta-50/70 dark:bg-terracotta-950/40 text-terracotta ring-1 ring-terracotta font-bold'
                      : 'border-chalk-300 dark:border-graphite-700 bg-white dark:bg-graphite-900 text-graphite-700 dark:text-graphite-300'
                  }`}
                >
                  <config.icon className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold">{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Prescripción específica del tipo */}
      <div className="p-4 bg-chalk-50 dark:bg-graphite-850 rounded-2xl border border-chalk-200 dark:border-graphite-750 space-y-3.5">
        {activeType === 'intervals' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" min={1} label="Series" placeholder="Ej: 4" {...register('sets')} />
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite-700 dark:text-graphite-300 mb-1.5">
                  Tiempo de Trabajo
                </label>
                <div className="flex items-center gap-1.5">
                  <Input type="number" min={0} placeholder="Min" {...register('workMinutes')} />
                  <span className="text-sm font-bold text-graphite-400">:</span>
                  <Input type="number" min={0} max={59} placeholder="Seg" {...register('workSeconds')} />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-graphite-700 dark:text-graphite-300 mb-1.5">
                Descanso entre Series
              </label>
              <div className="flex items-center gap-1.5 max-w-[12rem]">
                <Input type="number" min={0} placeholder="Min" {...register('restSetsMinutes')} />
                <span className="text-sm font-bold text-graphite-400">:</span>
                <Input type="number" min={0} max={59} placeholder="Seg" {...register('restSetsSeconds')} />
              </div>
            </div>
            <div className="pt-2 border-t border-chalk-200 dark:border-graphite-800">
              <p className="text-[10px] text-graphite-500 mb-2">Opcional: para series con repeticiones dentro (ej. 7/3)</p>
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" min={1} label="Repeticiones por Serie" placeholder="Ej: 6" {...register('repetitions')} />
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-graphite-700 dark:text-graphite-300 mb-1.5">
                    Descanso entre Reps
                  </label>
                  <div className="flex items-center gap-1.5">
                    <Input type="number" min={0} placeholder="Min" {...register('restRepsMinutes')} />
                    <span className="text-sm font-bold text-graphite-400">:</span>
                    <Input type="number" min={0} max={59} placeholder="Seg" {...register('restRepsSeconds')} />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeType === 'reps' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input type="number" min={1} label="Series" placeholder="Ej: 4" {...register('sets')} />
            <Input type="number" min={1} label="Repeticiones" placeholder="Ej: 5" {...register('repetitions')} />
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-graphite-700 dark:text-graphite-300 mb-1.5">
                Descanso entre Series
              </label>
              <div className="flex items-center gap-1.5">
                <Input type="number" min={0} placeholder="Min" {...register('restSetsMinutes')} />
                <span className="text-sm font-bold text-graphite-400">:</span>
                <Input type="number" min={0} max={59} placeholder="Seg" {...register('restSetsSeconds')} />
              </div>
            </div>
          </div>
        )}

        {activeType === 'problems' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input type="number" min={1} label="Nº de Bloques" placeholder="Ej: 4" {...register('problems')} />
            <Input type="number" min={1} label="Movimientos por Bloque" placeholder="Ej: 5" {...register('movements')} />
            <Input type="number" min={1} label="Intentos por Bloque" placeholder="Ej: 4" {...register('attemptsPerProblem')} />
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-graphite-700 dark:text-graphite-300 mb-1.5">
                Descanso entre Bloques
              </label>
              <div className="flex items-center gap-1.5">
                <Input type="number" min={0} placeholder="Min" {...register('restSetsMinutes')} />
                <span className="text-sm font-bold text-graphite-400">:</span>
                <Input type="number" min={0} max={59} placeholder="Seg" {...register('restSetsSeconds')} />
              </div>
            </div>
          </div>
        )}

        {activeType === 'attempts' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input type="number" min={1} label="Nº de Intentos" placeholder="Ej: 5" {...register('attempts')} />
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-graphite-700 dark:text-graphite-300 mb-1.5">
                Descanso entre Intentos
              </label>
              <div className="flex items-center gap-1.5">
                <Input type="number" min={0} placeholder="Min" {...register('restSetsMinutes')} />
                <span className="text-sm font-bold text-graphite-400">:</span>
                <Input type="number" min={0} max={59} placeholder="Seg" {...register('restSetsSeconds')} />
              </div>
            </div>
          </div>
        )}

        {activeType === 'free' && (
          <Input
            label="Objetivo"
            placeholder="Ej: Vía a vista 7a, proyecto de bloque..."
            {...register('target')}
          />
        )}
      </div>

      {/* 4. Lastre / Carga y Notas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Lastre / Carga / Dificultad"
          placeholder="Ej: +15 kg, 20 mm, 7a+, Peso corporal..."
          {...register('load')}
        />
        <Input
          label="Notas del Día (Opcional)"
          placeholder="Ej: Buenas sensaciones, parar si cae el ritmo..."
          {...register('notes')}
        />
      </div>

      {/* 5. Vista Previa en Vivo */}
      <div className="p-3.5 bg-chalk-100 dark:bg-graphite-800 rounded-2xl border border-chalk-200 dark:border-graphite-750 flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-terracotta shrink-0" />
        <div className="text-xs">
          <span className="font-semibold text-graphite-500">Resumen para la sesión: </span>
          <span className="font-bold text-graphite-900 dark:text-graphite-100">
            {formatBlockSummary(previewBlock)}
            {watchedValues.load && ` | Lastre: ${watchedValues.load}`}
          </span>
        </div>
      </div>

      {/* 6. Botones de Acción */}
      <div className="flex items-center justify-end gap-2.5 pt-1">
        {onCancel && (
          <Button type="button" variant="outline" size="md" onClick={onCancel}>
            <X className="w-4 h-4 mr-1" />
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="primary" size="md">
          <Check className="w-4 h-4 mr-1.5 stroke-[2.5]" />
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
