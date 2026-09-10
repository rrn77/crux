'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sparkles, Check, X, Dumbbell, Layers, Clock } from 'lucide-react';
import { BlockType, WorkoutBlock } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatBlockSummary, formatSecondsToTime } from '@/lib/timer/durationHelper';
import { generateUUID } from '@/lib/store/workoutStore';

const exerciseInSessionSchema = z.object({
  title: z.string().min(1, 'El nombre del ejercicio o plantilla es obligatorio'),
  sets: z.coerce.number().min(1, 'Mínimo 1 serie').default(4),
  repetitions: z.coerce.number().min(1, 'Mínimo 1 repetición / bloque').default(5),
  load: z.string().optional(),
  notes: z.string().optional(),
});

type ExerciseInSessionFormData = z.infer<typeof exerciseInSessionSchema>;

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
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExerciseInSessionFormData>({
    resolver: zodResolver(exerciseInSessionSchema),
    defaultValues: {
      title: initialBlock?.title || '',
      sets: initialBlock?.sets || 4,
      repetitions: initialBlock?.repetitions || (initialBlock?.problems ? initialBlock.problems : 5),
      load: initialBlock?.load || initialBlock?.target || '',
      notes: initialBlock?.notes || '',
    },
  });

  useEffect(() => {
    if (initialBlock) {
      reset({
        title: initialBlock.title,
        sets: initialBlock.sets || 4,
        repetitions: initialBlock.repetitions || (initialBlock.problems ? initialBlock.problems : 5),
        load: initialBlock.load || initialBlock.target || '',
        notes: initialBlock.notes || '',
      });
    } else {
      reset({
        title: '',
        sets: 4,
        repetitions: 5,
        load: '',
        notes: '',
      });
    }
  }, [initialBlock, reset]);

  const watchedValues = watch();

  const onSubmit = (data: ExerciseInSessionFormData) => {
    const inferredType: BlockType = initialBlock?.workDurationSeconds && initialBlock.workDurationSeconds > 0
      ? 'intervals'
      : 'reps';

    const block: WorkoutBlock = {
      id: initialBlock?.id || generateUUID(),
      templateId: initialBlock?.templateId,
      templateTitle: initialBlock?.templateTitle || initialBlock?.title,
      position: initialBlock?.position ?? 0,
      title: data.title.trim(),
      type: inferredType,
      sets: data.sets,
      repetitions: data.repetitions,
      workDurationSeconds: initialBlock?.workDurationSeconds,
      restBetweenRepsSeconds: initialBlock?.restBetweenRepsSeconds,
      restDurationSeconds: initialBlock?.restDurationSeconds ?? 120,
      load: data.load?.trim() || undefined,
      target: data.load?.trim() || initialBlock?.target || undefined,
      notes: data.notes?.trim() || undefined,
    };

    onSave(block);
  };

  // Previsualización
  const previewBlock: WorkoutBlock = {
    id: 'preview',
    position: 0,
    title: watchedValues.title || 'Nombre del ejercicio',
    type: initialBlock?.type || 'reps',
    sets: watchedValues.sets || 1,
    repetitions: watchedValues.repetitions || 1,
    workDurationSeconds: initialBlock?.workDurationSeconds,
    restBetweenRepsSeconds: initialBlock?.restBetweenRepsSeconds,
    restDurationSeconds: initialBlock?.restDurationSeconds ?? 120,
    load: watchedValues.load,
    target: watchedValues.load,
    notes: watchedValues.notes,
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* 1. Nombre / Plantilla Asociada */}
      <div>
        <Input
          label="Ejercicio / Plantilla Asociada"
          placeholder="Ej: Suspensiones 7/3, Dominadas con lastre, Bloques de 4 movimientos..."
          {...register('title')}
          error={errors.title?.message}
          className="text-base font-bold"
        />

        {/* Ficha resumen con los descansos heredados de la plantilla */}
        {initialBlock && (initialBlock.restDurationSeconds || initialBlock.restBetweenRepsSeconds || initialBlock.workDurationSeconds) && (
          <div className="mt-2 p-2.5 bg-chalk-100 dark:bg-graphite-800 rounded-xl flex items-center gap-3 text-xs text-graphite-600 dark:text-graphite-300 font-mono">
            {initialBlock.workDurationSeconds && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-terracotta" />
                Trabajo: {formatSecondsToTime(initialBlock.workDurationSeconds)}
              </span>
            )}
            {initialBlock.restBetweenRepsSeconds && initialBlock.restBetweenRepsSeconds > 0 && (
              <span>&bull; Pausa reps: {formatSecondsToTime(initialBlock.restBetweenRepsSeconds)}</span>
            )}
            {initialBlock.restDurationSeconds && (
              <span>&bull; Descanso series: {formatSecondsToTime(initialBlock.restDurationSeconds)}</span>
            )}
          </div>
        )}
      </div>

      {/* 2. Parámetros del Día: Series y Repeticiones */}
      <div className="grid grid-cols-2 gap-3 p-4 bg-chalk-50 dark:bg-graphite-850 rounded-2xl border border-chalk-200 dark:border-graphite-750">
        <Input
          type="number"
          label="Series del Día"
          min={1}
          placeholder="Ej: 4"
          {...register('sets')}
          error={errors.sets?.message}
        />

        <Input
          type="number"
          label="Repeticiones / Bloques"
          min={1}
          placeholder="Ej: 5"
          {...register('repetitions')}
          error={errors.repetitions?.message}
        />
      </div>

      {/* 3. Lastre / Carga y Notas */}
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

      {/* 4. Vista Previa en Vivo */}
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

      {/* 5. Botones de Acción */}
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
