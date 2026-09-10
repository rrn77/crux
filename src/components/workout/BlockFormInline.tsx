'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sparkles, Check, X, Clock, Layers, Dumbbell, Zap, Activity, HeartPulse } from 'lucide-react';
import { BlockType, WorkoutBlock } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatBlockSummary } from '@/lib/timer/durationHelper';
import { generateUUID } from '@/lib/store/workoutStore';

const CLIMBING_CATEGORIES = [
  { id: 'fingers', label: 'Fuerza de Dedos', icon: Zap, color: 'text-amber-500' },
  { id: 'boulder', label: 'Bloque / Plafón', icon: Layers, color: 'text-moss' },
  { id: 'endurance', label: 'Continuidad / ARC', icon: HeartPulse, color: 'text-terracotta' },
  { id: 'power', label: 'Potencia / Campus', icon: Activity, color: 'text-blue-500' },
  { id: 'strength', label: 'Fuerza / Dominadas / Core', icon: Dumbbell, color: 'text-purple-500' },
];

const blockSchema = z.object({
  title: z.string().min(1, 'El nombre del ejercicio es obligatorio'),
  sets: z.coerce.number().min(1, 'Mínimo 1 serie').default(4),
  workMinutes: z.coerce.number().min(0).default(0),
  workSeconds: z.coerce.number().min(0).max(59).default(0),
  restMinutes: z.coerce.number().min(0).default(1),
  restSeconds: z.coerce.number().min(0).max(59).default(0),
  problems: z.coerce.number().min(0).optional(),
  movements: z.coerce.number().min(0).optional(),
  repetitions: z.coerce.number().min(0).optional(),
  attempts: z.coerce.number().min(0).optional(),
  target: z.string().optional(),
  notes: z.string().optional(),
});

type BlockFormData = z.infer<typeof blockSchema>;

interface BlockFormInlineProps {
  initialBlock?: WorkoutBlock | null;
  onSave: (block: WorkoutBlock) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

export function BlockFormInline({
  initialBlock,
  onSave,
  onCancel,
  submitLabel = 'Guardar Ejercicio',
}: BlockFormInlineProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BlockFormData>({
    resolver: zodResolver(blockSchema),
    defaultValues: {
      title: initialBlock?.title || '',
      sets: initialBlock?.sets || 4,
      workMinutes: Math.floor((initialBlock?.workDurationSeconds || 0) / 60),
      workSeconds: (initialBlock?.workDurationSeconds || 0) % 60,
      restMinutes: Math.floor((initialBlock?.restDurationSeconds || 90) / 60),
      restSeconds: (initialBlock?.restDurationSeconds || 90) % 60,
      problems: initialBlock?.problems || undefined,
      movements: initialBlock?.movements || undefined,
      repetitions: initialBlock?.repetitions || undefined,
      attempts: initialBlock?.attempts || undefined,
      target: initialBlock?.target || '',
      notes: initialBlock?.notes || '',
    },
  });

  useEffect(() => {
    if (initialBlock) {
      reset({
        title: initialBlock.title,
        sets: initialBlock.sets || 4,
        workMinutes: Math.floor((initialBlock.workDurationSeconds || 0) / 60),
        workSeconds: (initialBlock.workDurationSeconds || 0) % 60,
        restMinutes: Math.floor((initialBlock.restDurationSeconds || 90) / 60),
        restSeconds: (initialBlock.restDurationSeconds || 90) % 60,
        problems: initialBlock.problems || undefined,
        movements: initialBlock.movements || undefined,
        repetitions: initialBlock.repetitions || undefined,
        attempts: initialBlock.attempts || undefined,
        target: initialBlock.target || '',
        notes: initialBlock.notes || '',
      });
    } else {
      reset({
        title: '',
        sets: 4,
        workMinutes: 0,
        workSeconds: 0,
        restMinutes: 1,
        restSeconds: 30,
        problems: undefined,
        movements: undefined,
        repetitions: undefined,
        attempts: undefined,
        target: '',
        notes: '',
      });
    }
  }, [initialBlock, reset]);

  const watchedValues = watch();

  // Inferencia inteligente del tipo de bloque para compatibilidad con el motor de temporizadores
  const inferBlockType = (data: BlockFormData): BlockType => {
    const totalWorkSec = (data.workMinutes || 0) * 60 + (data.workSeconds || 0);
    if (totalWorkSec > 0) return 'intervals';
    if (data.problems && data.problems > 0) return 'problems';
    if (data.repetitions && data.repetitions > 0) return 'reps';
    if (data.attempts && data.attempts > 0) return 'attempts';
    return 'free';
  };

  const onSubmit = (data: BlockFormData) => {
    const totalWorkSec = (data.workMinutes || 0) * 60 + (data.workSeconds || 0);
    const totalRestSec = (data.restMinutes || 0) * 60 + (data.restSeconds || 0);
    const inferredType = inferBlockType(data);

    const block: WorkoutBlock = {
      id: initialBlock?.id || generateUUID(),
      position: initialBlock?.position ?? 0,
      title: data.title.trim(),
      type: inferredType,
      sets: data.sets || 1,
      workDurationSeconds: totalWorkSec > 0 ? totalWorkSec : undefined,
      restDurationSeconds: totalRestSec > 0 ? totalRestSec : undefined,
      repetitions: data.repetitions && data.repetitions > 0 ? data.repetitions : undefined,
      attempts: data.attempts && data.attempts > 0 ? data.attempts : undefined,
      problems: data.problems && data.problems > 0 ? data.problems : undefined,
      movements: data.movements && data.movements > 0 ? data.movements : undefined,
      target: data.target?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
    };

    onSave(block);
  };

  // Previsualización en tiempo real
  const totalWorkPreview = (watchedValues.workMinutes || 0) * 60 + (watchedValues.workSeconds || 0);
  const totalRestPreview = (watchedValues.restMinutes || 0) * 60 + (watchedValues.restSeconds || 0);

  const previewBlock: WorkoutBlock = {
    id: 'preview',
    position: 0,
    title: watchedValues.title || 'Nombre del ejercicio',
    type: inferBlockType(watchedValues),
    sets: watchedValues.sets || 1,
    workDurationSeconds: totalWorkPreview > 0 ? totalWorkPreview : undefined,
    restDurationSeconds: totalRestPreview > 0 ? totalRestPreview : undefined,
    repetitions: watchedValues.repetitions,
    attempts: watchedValues.attempts,
    problems: watchedValues.problems,
    movements: watchedValues.movements,
    target: watchedValues.target,
    notes: watchedValues.notes,
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* 1. Nombre del Ejercicio */}
      <Input
        label="Nombre del Ejercicio"
        placeholder="Ej: Bloques de 3-4 movimientos, Dominadas con lastre, Suspensiones 7/3, Continuidad ARC..."
        {...register('title')}
        error={errors.title?.message}
        className="text-base font-bold"
      />

      {/* 2. Sugerencias rápidas de categoría (Opcional para autocompletar nombre si está vacío) */}
      {!watchedValues.title && (
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-graphite-500">
            Sugerencias de Disciplina:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CLIMBING_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    if (cat.id === 'boulder') {
                      setValue('title', 'Bloques de 3-4 movimientos');
                      setValue('problems', 4);
                      setValue('movements', 4);
                      setValue('sets', 4);
                      setValue('restMinutes', 2);
                      setValue('restSeconds', 0);
                    } else if (cat.id === 'fingers') {
                      setValue('title', 'Suspensiones 7/3 en regleta 20mm');
                      setValue('sets', 5);
                      setValue('workMinutes', 0);
                      setValue('workSeconds', 10);
                      setValue('restMinutes', 2);
                      setValue('restSeconds', 0);
                    } else if (cat.id === 'endurance') {
                      setValue('title', 'Continuidad Aeróbica (ARC)');
                      setValue('sets', 2);
                      setValue('workMinutes', 15);
                      setValue('workSeconds', 0);
                      setValue('restMinutes', 5);
                      setValue('restSeconds', 0);
                    } else if (cat.id === 'strength') {
                      setValue('title', 'Dominadas con lastre');
                      setValue('sets', 4);
                      setValue('repetitions', 5);
                      setValue('restMinutes', 2);
                      setValue('restSeconds', 30);
                    } else if (cat.id === 'power') {
                      setValue('title', 'Campus Board 1-4-7');
                      setValue('sets', 5);
                      setValue('attempts', 3);
                      setValue('restMinutes', 3);
                      setValue('restSeconds', 0);
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-chalk-100 dark:bg-graphite-800 border border-chalk-200 dark:border-graphite-700 text-graphite-700 dark:text-graphite-300 hover:border-terracotta hover:text-terracotta transition-colors flex items-center gap-1.5"
                >
                  <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Panel de Prescripción del Ejercicio */}
      <div className="p-4 bg-chalk-50 dark:bg-graphite-850 rounded-2xl border border-chalk-200 dark:border-graphite-750 space-y-3.5">
        <label className="text-xs font-bold uppercase tracking-wider text-graphite-700 dark:text-graphite-300 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-terracotta" />
          Prescripción del Ejercicio (Series, Bloques, Trabajo y Descanso)
        </label>

        {/* Fila A: Series, Bloques y Movimientos/Reps */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Input
            type="number"
            label="Series / Rondas"
            min={1}
            placeholder="Ej: 4"
            {...register('sets')}
            error={errors.sets?.message}
          />

          <Input
            type="number"
            label="Bloques (Opcional)"
            min={1}
            placeholder="Ej: 4"
            {...register('problems')}
          />

          <Input
            type="number"
            label="Movimientos por bloque"
            min={1}
            placeholder="Ej: 4"
            {...register('movements')}
          />

          <Input
            type="number"
            label="Reps por serie (Opcional)"
            min={1}
            placeholder="Ej: 5"
            {...register('repetitions')}
          />
        </div>

        {/* Fila B: Tiempo de Trabajo y Tiempo de Descanso */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-graphite-700 dark:text-graphite-300 mb-1.5">
              Tiempo de Trabajo (Opcional)
            </label>
            <div className="flex items-center gap-2">
              <Input type="number" min={0} placeholder="Min" {...register('workMinutes')} />
              <span className="text-sm font-bold text-graphite-400">:</span>
              <Input type="number" min={0} max={59} placeholder="Seg" {...register('workSeconds')} />
            </div>
            <p className="text-[10px] text-graphite-500 mt-1">Para suspensiones por tiempo, ARC o intervalos (ej. 0:10 o 3:00)</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-graphite-700 dark:text-graphite-300 mb-1.5">
              Tiempo de Descanso
            </label>
            <div className="flex items-center gap-2">
              <Input type="number" min={0} placeholder="Min" {...register('restMinutes')} />
              <span className="text-sm font-bold text-graphite-400">:</span>
              <Input type="number" min={0} max={59} placeholder="Seg" {...register('restSeconds')} />
            </div>
            <p className="text-[10px] text-graphite-500 mt-1">Descanso entre series o bloques (ej. 1:30 o 2:00)</p>
          </div>
        </div>
      </div>

      {/* 4. Objetivo e Indicaciones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Objetivo o Intensidad (Opcional)"
          placeholder="Ej: Regleta 20mm, +15kg lastre, 7a+, Muro 45°..."
          {...register('target')}
        />
        <Input
          label="Notas o Indicaciones (Opcional)"
          placeholder="Ej: Máxima calidad técnica, reposar pies en placa..."
          {...register('notes')}
        />
      </div>

      {/* 5. Vista Previa en Vivo */}
      <div className="p-3.5 bg-chalk-100 dark:bg-graphite-800 rounded-2xl border border-chalk-200 dark:border-graphite-750 flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-terracotta shrink-0" />
        <div className="text-xs">
          <span className="font-semibold text-graphite-500">Resumen: </span>
          <span className="font-bold text-graphite-900 dark:text-graphite-100">
            {formatBlockSummary(previewBlock) || 'Configura la prescripción del ejercicio'}
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
