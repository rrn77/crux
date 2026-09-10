'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  Timer,
  Repeat,
  Clock,
  Check,
  X,
} from 'lucide-react';
import { useWorkoutStore, generateUUID } from '@/lib/store/workoutStore';
import { useAuthStore } from '@/lib/supabase/authStore';
import { syncService } from '@/lib/supabase/syncService';
import { WorkoutBlock, WorkoutTemplate } from '@/lib/types';
import { calculateTotalEstimatedDuration, formatBlockSummary } from '@/lib/timer/durationHelper';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const templateSchema = z.object({
  title: z.string().min(1, 'El nombre de la plantilla es obligatorio'),
  executionMode: z.enum(['time', 'reps']),
  workMinutes: z.coerce.number().min(0).default(0),
  workSeconds: z.coerce.number().min(0).max(59).default(0),
  defaultReps: z.coerce.number().min(1).default(5),
  restBetweenRepsMinutes: z.coerce.number().min(0).default(0),
  restBetweenRepsSeconds: z.coerce.number().min(0).max(59).default(0),
  restBetweenSetsMinutes: z.coerce.number().min(0).default(2),
  restBetweenSetsSeconds: z.coerce.number().min(0).max(59).default(0),
  description: z.string().optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

function TemplateEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get('id');

  const { addTemplate, updateTemplate, getTemplateById } = useWorkoutStore();
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      title: '',
      executionMode: 'time',
      workMinutes: 0,
      workSeconds: 10,
      defaultReps: 5,
      restBetweenRepsMinutes: 0,
      restBetweenRepsSeconds: 3,
      restBetweenSetsMinutes: 2,
      restBetweenSetsSeconds: 0,
      description: '',
    },
  });

  const executionMode = watch('executionMode');
  const watchedValues = watch();

  useEffect(() => {
    if (templateIdParam) {
      const existing = getTemplateById(templateIdParam);
      if (existing) {
        setEditingTemplate(existing);
        const block = existing.blocks[0];
        const isTimeBased = Boolean(block?.workDurationSeconds && block.workDurationSeconds > 0);

        reset({
          title: existing.title,
          executionMode: isTimeBased ? 'time' : 'reps',
          workMinutes: Math.floor((block?.workDurationSeconds || 0) / 60),
          workSeconds: (block?.workDurationSeconds || 0) % 60,
          defaultReps: block?.repetitions || 5,
          restBetweenRepsMinutes: Math.floor((block?.restBetweenRepsSeconds || 0) / 60),
          restBetweenRepsSeconds: (block?.restBetweenRepsSeconds || 0) % 60,
          restBetweenSetsMinutes: Math.floor((block?.restDurationSeconds || 120) / 60),
          restBetweenSetsSeconds: (block?.restDurationSeconds || 120) % 60,
          description: existing.description || '',
        });
      }
    }
  }, [templateIdParam, getTemplateById, reset]);

  const onSubmit = (data: TemplateFormData) => {
    const totalWorkSec = data.executionMode === 'time'
      ? (data.workMinutes || 0) * 60 + (data.workSeconds || 0)
      : undefined;

    const totalRestBetweenRepsSec = (data.restBetweenRepsMinutes || 0) * 60 + (data.restBetweenRepsSeconds || 0);
    const totalRestBetweenSetsSec = (data.restBetweenSetsMinutes || 0) * 60 + (data.restBetweenSetsSeconds || 0);

    const block: WorkoutBlock = {
      id: editingTemplate?.blocks[0]?.id || generateUUID(),
      position: 0,
      title: data.title.trim(),
      type: data.executionMode === 'time' ? 'intervals' : 'reps',
      sets: 4, // Default series base
      repetitions: data.executionMode === 'reps' ? data.defaultReps : (totalRestBetweenRepsSec > 0 ? 6 : undefined),
      workDurationSeconds: totalWorkSec,
      restBetweenRepsSeconds: totalRestBetweenRepsSec > 0 ? totalRestBetweenRepsSec : undefined,
      restDurationSeconds: totalRestBetweenSetsSec,
      notes: data.description?.trim() || undefined,
    };

    const estimatedSec = calculateTotalEstimatedDuration([block]);
    const user = useAuthStore.getState().user;
    const userId = user?.id || 'local';

    if (editingTemplate) {
      const updated: WorkoutTemplate = {
        ...editingTemplate,
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        estimatedDurationSeconds: estimatedSec,
        blocks: [block],
      };
      updateTemplate(editingTemplate.id, {
        title: updated.title,
        description: updated.description,
        estimatedDurationSeconds: estimatedSec,
        blocks: updated.blocks,
      });
      syncService.pushTemplate(updated, userId);
      setSuccessMessage('¡Plantilla actualizada!');
    } else {
      const newTpl = addTemplate({
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        estimatedDurationSeconds: estimatedSec,
        blocks: [block],
      });
      syncService.pushTemplate(newTpl, userId);
      setSuccessMessage('¡Plantilla creada!');
    }

    setTimeout(() => {
      router.push('/workouts/templates');
    }, 600);
  };

  // Previsualización de la plantilla
  const previewWorkSec = (watchedValues.workMinutes || 0) * 60 + (watchedValues.workSeconds || 0);
  const previewRestRepsSec = (watchedValues.restBetweenRepsMinutes || 0) * 60 + (watchedValues.restBetweenRepsSeconds || 0);
  const previewRestSetsSec = (watchedValues.restBetweenSetsMinutes || 0) * 60 + (watchedValues.restBetweenSetsSeconds || 0);

  const previewBlock: WorkoutBlock = {
    id: 'preview',
    position: 0,
    title: watchedValues.title || 'Nombre de la plantilla',
    type: executionMode === 'time' ? 'intervals' : 'reps',
    sets: 4,
    repetitions: executionMode === 'reps' ? watchedValues.defaultReps : (previewRestRepsSec > 0 ? 6 : undefined),
    workDurationSeconds: executionMode === 'time' ? previewWorkSec : undefined,
    restBetweenRepsSeconds: previewRestRepsSec > 0 ? previewRestRepsSec : undefined,
    restDurationSeconds: previewRestSetsSec,
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <Link
          href="/workouts/templates"
          className="flex items-center gap-1.5 text-xs font-bold text-graphite-600 dark:text-graphite-400 hover:text-terracotta transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Tus Plantillas
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black tracking-tight text-graphite-950 dark:text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-moss" />
          {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
        </h1>
        <p className="text-xs text-graphite-500 mt-0.5">
          Define el ejercicio (nombre, descansos y tiempo de trabajo o repeticiones)
        </p>
      </div>

      {successMessage && (
        <div className="p-3 bg-moss-100 dark:bg-moss-900/40 text-moss-900 dark:text-moss-200 text-xs font-bold rounded-2xl flex items-center gap-2 animate-scale-up">
          <Sparkles className="w-4 h-4 text-moss" />
          {successMessage}
        </div>
      )}

      {/* Formulario de Plantilla */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white dark:bg-graphite-900 p-5 sm:p-6 rounded-3xl border border-chalk-300 dark:border-graphite-800 shadow-sm space-y-5"
      >
        {/* 1. Nombre de la Plantilla */}
        <Input
          label="Nombre de la Plantilla"
          placeholder="Ej: Suspensiones 7/3, Bloques de 4 movimientos, Dominadas con lastre, Continuidad ARC..."
          {...register('title')}
          error={errors.title?.message}
          className="text-base font-bold"
        />

        {/* 2. Modalidad: Tiempo de trabajo vs Repeticiones */}
        <div className="p-4 bg-chalk-50 dark:bg-graphite-850 rounded-2xl border border-chalk-200 dark:border-graphite-750 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-graphite-700 dark:text-graphite-300">
            ¿Cómo se ejecuta el ejercicio?
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setValue('executionMode', 'time')}
              className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                executionMode === 'time'
                  ? 'border-terracotta bg-terracotta-50/70 dark:bg-terracotta-950/40 text-terracotta ring-1 ring-terracotta font-bold'
                  : 'border-chalk-300 dark:border-graphite-700 bg-white dark:bg-graphite-900 text-graphite-700 dark:text-graphite-300'
              }`}
            >
              <Timer className="w-5 h-5 text-terracotta" />
              <div>
                <div className="text-xs font-bold">Por Tiempo de Trabajo</div>
                <div className="text-[10px] text-graphite-500">Ej: 10s, 3:00 min, 15 min...</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setValue('executionMode', 'reps')}
              className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                executionMode === 'reps'
                  ? 'border-terracotta bg-terracotta-50/70 dark:bg-terracotta-950/40 text-terracotta ring-1 ring-terracotta font-bold'
                  : 'border-chalk-300 dark:border-graphite-700 bg-white dark:bg-graphite-900 text-graphite-700 dark:text-graphite-300'
              }`}
            >
              <Repeat className="w-5 h-5 text-amber-500" />
              <div>
                <div className="text-xs font-bold">Por Repeticiones / Movs</div>
                <div className="text-[10px] text-graphite-500">Ej: 5 reps, 4 bloques/movs...</div>
              </div>
            </button>
          </div>

          {/* Campo condicional según modalidad */}
          {executionMode === 'time' ? (
            <div className="pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-graphite-700 dark:text-graphite-300 mb-1.5">
                Tiempo de Trabajo
              </label>
              <div className="flex items-center gap-2 max-w-xs">
                <Input type="number" min={0} placeholder="Min" {...register('workMinutes')} />
                <span className="text-sm font-bold text-graphite-400">:</span>
                <Input type="number" min={0} max={59} placeholder="Seg" {...register('workSeconds')} />
              </div>
              <p className="text-[10px] text-graphite-500 mt-1">Tiempo de esfuerzo activo por serie o repetición</p>
            </div>
          ) : (
            <div className="pt-2 max-w-xs">
              <Input
                type="number"
                label="Repeticiones / Movimientos base"
                min={1}
                placeholder="Ej: 5"
                {...register('defaultReps')}
              />
            </div>
          )}
        </div>

        {/* 3. Descansos (Entre repeticiones y Entre series) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 bg-chalk-50 dark:bg-graphite-850 rounded-2xl border border-chalk-200 dark:border-graphite-750">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-graphite-700 dark:text-graphite-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-moss" />
              Descanso entre Repeticiones
            </label>
            <div className="flex items-center gap-2">
              <Input type="number" min={0} placeholder="Min" {...register('restBetweenRepsMinutes')} />
              <span className="text-sm font-bold text-graphite-400">:</span>
              <Input type="number" min={0} max={59} placeholder="Seg" {...register('restBetweenRepsSeconds')} />
            </div>
            <p className="text-[10px] text-graphite-500 mt-1">Pausa breve entre repeticiones (ej. 3s en suspensiones 7/3, o 0s si no aplica)</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-graphite-700 dark:text-graphite-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-terracotta" />
              Descanso entre Series
            </label>
            <div className="flex items-center gap-2">
              <Input type="number" min={0} placeholder="Min" {...register('restBetweenSetsMinutes')} />
              <span className="text-sm font-bold text-graphite-400">:</span>
              <Input type="number" min={0} max={59} placeholder="Seg" {...register('restBetweenSetsSeconds')} />
            </div>
            <p className="text-[10px] text-graphite-500 mt-1">Pausa completa entre series (ej. 2:00 o 3:00)</p>
          </div>
        </div>

        {/* 4. Descripción opcional */}
        <Input
          label="Descripción o Enfoque (Opcional)"
          placeholder="Ej: Semiarqueo en regleta 20mm, hombros activos y recorrido completo..."
          {...register('description')}
        />

        {/* 5. Vista Previa */}
        <div className="p-3.5 bg-chalk-100 dark:bg-graphite-800 rounded-2xl border border-chalk-200 dark:border-graphite-750 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-terracotta shrink-0" />
          <div className="text-xs">
            <span className="font-semibold text-graphite-500">Resumen de Plantilla: </span>
            <span className="font-bold text-graphite-900 dark:text-graphite-100">
              {formatBlockSummary(previewBlock)}
            </span>
          </div>
        </div>

        {/* 6. Botones de Acción */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button type="button" variant="outline" size="md" onClick={() => router.push('/workouts/templates')}>
            <X className="w-4 h-4 mr-1" />
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="md">
            <Check className="w-4 h-4 mr-1.5 stroke-[2.5]" />
            {editingTemplate ? 'Guardar Cambios' : 'Crear Plantilla'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewTemplatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-graphite-500">Cargando formulario...</div>}>
      <TemplateEditorContent />
    </Suspense>
  );
}
