'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Timer, Repeat, Target, Layers, FileText, Sparkles, Check, X } from 'lucide-react';
import { BlockType, WorkoutBlock } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatBlockSummary } from '@/lib/timer/durationHelper';
import { generateUUID } from '@/lib/store/workoutStore';

const blockSchema = z.object({
  title: z.string().min(1, 'El título del ejercicio es obligatorio'),
  type: z.enum(['intervals', 'reps', 'attempts', 'problems', 'free']),
  sets: z.coerce.number().min(1, 'Mínimo 1 serie').optional(),
  workMinutes: z.coerce.number().min(0).default(0),
  workSeconds: z.coerce.number().min(0).max(59).default(0),
  restMinutes: z.coerce.number().min(0).default(0),
  restSeconds: z.coerce.number().min(0).max(59).default(0),
  repetitions: z.coerce.number().min(1, 'Mínimo 1 repetición').optional(),
  attempts: z.coerce.number().min(1, 'Mínimo 1 intento').optional(),
  problems: z.coerce.number().min(1, 'Mínimo 1 problema').optional(),
  movements: z.coerce.number().min(1).optional(),
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
  const [selectedType, setSelectedType] = useState<BlockType>(initialBlock?.type || 'intervals');

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
      type: initialBlock?.type || 'intervals',
      sets: initialBlock?.sets || 4,
      workMinutes: Math.floor((initialBlock?.workDurationSeconds || 180) / 60),
      workSeconds: (initialBlock?.workDurationSeconds || 180) % 60,
      restMinutes: Math.floor((initialBlock?.restDurationSeconds || 60) / 60),
      restSeconds: (initialBlock?.restDurationSeconds || 60) % 60,
      repetitions: initialBlock?.repetitions || 10,
      attempts: initialBlock?.attempts || 4,
      problems: initialBlock?.problems || 4,
      movements: initialBlock?.movements || 5,
      target: initialBlock?.target || '',
      notes: initialBlock?.notes || '',
    },
  });

  useEffect(() => {
    if (initialBlock) {
      setSelectedType(initialBlock.type);
      reset({
        title: initialBlock.title,
        type: initialBlock.type,
        sets: initialBlock.sets || 4,
        workMinutes: Math.floor((initialBlock.workDurationSeconds || 0) / 60),
        workSeconds: (initialBlock.workDurationSeconds || 0) % 60,
        restMinutes: Math.floor((initialBlock.restDurationSeconds || 0) / 60),
        restSeconds: (initialBlock.restDurationSeconds || 0) % 60,
        repetitions: initialBlock.repetitions || 10,
        attempts: initialBlock.attempts || 4,
        problems: initialBlock.problems || 4,
        movements: initialBlock.movements || 5,
        target: initialBlock.target || '',
        notes: initialBlock.notes || '',
      });
    } else {
      setSelectedType('intervals');
      reset({
        title: '',
        type: 'intervals',
        sets: 4,
        workMinutes: 3,
        workSeconds: 0,
        restMinutes: 1,
        restSeconds: 0,
        repetitions: 10,
        attempts: 4,
        problems: 4,
        movements: 5,
        target: '',
        notes: '',
      });
    }
  }, [initialBlock, reset]);

  const watchedValues = watch();

  const handleTypeSelect = (type: BlockType) => {
    setSelectedType(type);
    setValue('type', type);

    if (type === 'intervals' && (!watchedValues.title || watchedValues.title.startsWith('Ejercicio'))) {
      setValue('title', 'Intervalos / ULAC');
      setValue('sets', 4);
      setValue('workMinutes', 3);
      setValue('workSeconds', 0);
      setValue('restMinutes', 1);
      setValue('restSeconds', 0);
    } else if (type === 'problems' && (!watchedValues.title || watchedValues.title.startsWith('Ejercicio'))) {
      setValue('title', 'Bloques de Calidad');
      setValue('problems', 4);
      setValue('attempts', 4);
      setValue('movements', 5);
      setValue('restMinutes', 1);
      setValue('restSeconds', 30);
    } else if (type === 'reps' && (!watchedValues.title || watchedValues.title.startsWith('Ejercicio'))) {
      setValue('title', 'Fuerza / Core');
      setValue('sets', 3);
      setValue('repetitions', 12);
      setValue('restMinutes', 1);
      setValue('restSeconds', 0);
    } else if (type === 'attempts' && (!watchedValues.title || watchedValues.title.startsWith('Ejercicio'))) {
      setValue('title', 'Intentos a Proyectos');
      setValue('attempts', 5);
      setValue('restMinutes', 3);
      setValue('restSeconds', 0);
    } else if (type === 'free' && (!watchedValues.title || watchedValues.title.startsWith('Ejercicio'))) {
      setValue('title', 'Calentamiento y Movilidad');
      setValue('target', 'Activar dedos y hombros');
    }
  };

  const onSubmit = (data: BlockFormData) => {
    const totalWorkSec = (data.workMinutes || 0) * 60 + (data.workSeconds || 0);
    const totalRestSec = (data.restMinutes || 0) * 60 + (data.restSeconds || 0);

    const block: WorkoutBlock = {
      id: initialBlock?.id || generateUUID(),
      position: initialBlock?.position ?? 0,
      title: data.title.trim(),
      type: data.type,
      sets: data.type === 'intervals' || data.type === 'reps' ? data.sets : undefined,
      workDurationSeconds: data.type === 'intervals' ? totalWorkSec : undefined,
      restDurationSeconds: data.type !== 'free' ? totalRestSec : undefined,
      repetitions: data.type === 'reps' ? data.repetitions : undefined,
      attempts: data.type === 'attempts' || data.type === 'problems' ? data.attempts : undefined,
      problems: data.type === 'problems' ? data.problems : undefined,
      movements: data.type === 'problems' ? data.movements : undefined,
      target: data.target?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
    };

    onSave(block);
  };

  const previewBlock: WorkoutBlock = {
    id: 'preview',
    position: 0,
    title: watchedValues.title || 'Nombre del ejercicio',
    type: selectedType,
    sets: watchedValues.sets,
    workDurationSeconds: (watchedValues.workMinutes || 0) * 60 + (watchedValues.workSeconds || 0),
    restDurationSeconds: (watchedValues.restMinutes || 0) * 60 + (watchedValues.restSeconds || 0),
    repetitions: watchedValues.repetitions,
    attempts: watchedValues.attempts,
    problems: watchedValues.problems,
    movements: watchedValues.movements,
    target: watchedValues.target,
    notes: watchedValues.notes,
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Selector de Tipo de Estructura */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-graphite-700 dark:text-graphite-300 mb-2">
          Estructura del Ejercicio
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <button
            type="button"
            onClick={() => handleTypeSelect('intervals')}
            className={`p-3 rounded-2xl border text-left flex flex-col items-start gap-1 transition-all ${
              selectedType === 'intervals'
                ? 'border-terracotta bg-terracotta-50/70 dark:bg-terracotta-950/30 text-terracotta ring-1 ring-terracotta'
                : 'border-chalk-300 dark:border-graphite-750 bg-chalk-50 dark:bg-graphite-850 hover:bg-chalk-100 dark:hover:bg-graphite-800 text-graphite-800 dark:text-graphite-200'
            }`}
          >
            <Timer className="w-5 h-5 text-terracotta" />
            <span className="text-xs font-bold">Intervalos</span>
            <span className="text-[10px] text-graphite-500">Trabajo + Pausa</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeSelect('problems')}
            className={`p-3 rounded-2xl border text-left flex flex-col items-start gap-1 transition-all ${
              selectedType === 'problems'
                ? 'border-terracotta bg-terracotta-50/70 dark:bg-terracotta-950/30 text-terracotta ring-1 ring-terracotta'
                : 'border-chalk-300 dark:border-graphite-750 bg-chalk-50 dark:bg-graphite-850 hover:bg-chalk-100 dark:hover:bg-graphite-800 text-graphite-800 dark:text-graphite-200'
            }`}
          >
            <Layers className="w-5 h-5 text-moss" />
            <span className="text-xs font-bold">Búlder</span>
            <span className="text-[10px] text-graphite-500">Bloques + Intentos</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeSelect('reps')}
            className={`p-3 rounded-2xl border text-left flex flex-col items-start gap-1 transition-all ${
              selectedType === 'reps'
                ? 'border-terracotta bg-terracotta-50/70 dark:bg-terracotta-950/30 text-terracotta ring-1 ring-terracotta'
                : 'border-chalk-300 dark:border-graphite-750 bg-chalk-50 dark:bg-graphite-850 hover:bg-chalk-100 dark:hover:bg-graphite-800 text-graphite-800 dark:text-graphite-200'
            }`}
          >
            <Repeat className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-bold">Repeticiones</span>
            <span className="text-[10px] text-graphite-500">Series + Reps</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeSelect('attempts')}
            className={`p-3 rounded-2xl border text-left flex flex-col items-start gap-1 transition-all ${
              selectedType === 'attempts'
                ? 'border-terracotta bg-terracotta-50/70 dark:bg-terracotta-950/30 text-terracotta ring-1 ring-terracotta'
                : 'border-chalk-300 dark:border-graphite-750 bg-chalk-50 dark:bg-graphite-850 hover:bg-chalk-100 dark:hover:bg-graphite-800 text-graphite-800 dark:text-graphite-200'
            }`}
          >
            <Target className="w-5 h-5 text-blue-500" />
            <span className="text-xs font-bold">Intentos</span>
            <span className="text-[10px] text-graphite-500">Intentos libres</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeSelect('free')}
            className={`p-3 rounded-2xl border text-left flex flex-col items-start gap-1 transition-all col-span-2 sm:col-span-1 ${
              selectedType === 'free'
                ? 'border-terracotta bg-terracotta-50/70 dark:bg-terracotta-950/30 text-terracotta ring-1 ring-terracotta'
                : 'border-chalk-300 dark:border-graphite-750 bg-chalk-50 dark:bg-graphite-850 hover:bg-chalk-100 dark:hover:bg-graphite-800 text-graphite-800 dark:text-graphite-200'
            }`}
          >
            <FileText className="w-5 h-5 text-purple-500" />
            <span className="text-xs font-bold">Libre</span>
            <span className="text-[10px] text-graphite-500">Registro libre</span>
          </button>
        </div>
      </div>

      {/* Nombre del Ejercicio */}
      <Input
        label="Nombre del Ejercicio"
        placeholder="Ej: Suspensiones 20mm, ULAC, Dominadas con lastre, Bloques Desplome..."
        {...register('title')}
        error={errors.title?.message}
        className="text-base font-bold"
      />

      {/* Parámetros Específicos según Tipo */}
      {selectedType === 'intervals' && (
        <div className="p-4 bg-chalk-50 dark:bg-graphite-850 rounded-2xl space-y-3 border border-chalk-200 dark:border-graphite-750">
          <Input
            type="number"
            label="Número de Series"
            min={1}
            {...register('sets')}
            error={errors.sets?.message}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-graphite-700 dark:text-graphite-300 mb-1.5">
                Tiempo de Trabajo
              </label>
              <div className="flex items-center gap-2">
                <Input type="number" min={0} placeholder="Min" {...register('workMinutes')} />
                <span className="text-sm font-bold text-graphite-400">:</span>
                <Input type="number" min={0} max={59} placeholder="Seg" {...register('workSeconds')} />
              </div>
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
            </div>
          </div>
        </div>
      )}

      {selectedType === 'problems' && (
        <div className="p-4 bg-chalk-50 dark:bg-graphite-850 rounded-2xl space-y-3 border border-chalk-200 dark:border-graphite-750">
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              label="Número de Bloques"
              min={1}
              {...register('problems')}
              error={errors.problems?.message}
            />
            <Input
              type="number"
              label="Movimientos por Bloque"
              min={1}
              placeholder="Ej: 5"
              {...register('movements')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              label="Intentos por Bloque"
              min={1}
              {...register('attempts')}
              error={errors.attempts?.message}
            />
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-graphite-700 dark:text-graphite-300 mb-1.5">
                Descanso entre Intentos
              </label>
              <div className="flex items-center gap-2">
                <Input type="number" min={0} placeholder="Min" {...register('restMinutes')} />
                <span className="text-sm font-bold text-graphite-400">:</span>
                <Input type="number" min={0} max={59} placeholder="Seg" {...register('restSeconds')} />
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedType === 'reps' && (
        <div className="p-4 bg-chalk-50 dark:bg-graphite-850 rounded-2xl space-y-3 border border-chalk-200 dark:border-graphite-750">
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              label="Número de Series"
              min={1}
              {...register('sets')}
              error={errors.sets?.message}
            />
            <Input
              type="number"
              label="Repeticiones"
              min={1}
              {...register('repetitions')}
              error={errors.repetitions?.message}
            />
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
          </div>
        </div>
      )}

      {selectedType === 'attempts' && (
        <div className="p-4 bg-chalk-50 dark:bg-graphite-850 rounded-2xl space-y-3 border border-chalk-200 dark:border-graphite-750">
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              label="Número de Intentos"
              min={1}
              {...register('attempts')}
              error={errors.attempts?.message}
            />
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-graphite-700 dark:text-graphite-300 mb-1.5">
                Descanso entre Intentos
              </label>
              <div className="flex items-center gap-2">
                <Input type="number" min={0} placeholder="Min" {...register('restMinutes')} />
                <span className="text-sm font-bold text-graphite-400">:</span>
                <Input type="number" min={0} max={59} placeholder="Seg" {...register('restSeconds')} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Objetivo y Notas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Objetivo o Intensidad (Opcional)"
          placeholder="Ej: 7a+, RPE 8, Lastre +10kg, Semiarqueo..."
          {...register('target')}
        />
        <Input
          label="Indicaciones o Notas (Opcional)"
          placeholder="Ej: Mantener ritmo constante, reposar pies en placa..."
          {...register('notes')}
        />
      </div>

      {/* Vista Previa del Ejercicio */}
      <div className="p-3.5 bg-chalk-100 dark:bg-graphite-800 rounded-2xl border border-chalk-200 dark:border-graphite-750 flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-terracotta shrink-0" />
        <div className="text-xs">
          <span className="font-semibold text-graphite-500">Resumen: </span>
          <span className="font-bold text-graphite-900 dark:text-graphite-100">
            {formatBlockSummary(previewBlock) || 'Configura los parámetros del ejercicio'}
          </span>
        </div>
      </div>

      {/* Botones de Acción */}
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
