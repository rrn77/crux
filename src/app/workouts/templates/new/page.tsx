'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, BookOpen, Sparkles, Check, X } from 'lucide-react';
import { useWorkoutStore } from '@/lib/store/workoutStore';
import { WorkoutTemplate, BlockType } from '@/lib/types';
import { BLOCK_TYPE_CONFIG } from '@/lib/timer/durationHelper';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const templateSchema = z.object({
  title: z.string().min(1, 'El nombre del ejercicio es obligatorio'),
  type: z.enum(['intervals', 'reps', 'problems', 'attempts', 'free']),
  description: z.string().optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

const BLOCK_TYPES: BlockType[] = ['intervals', 'reps', 'problems', 'attempts', 'free'];

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
      type: 'intervals',
      description: '',
    },
  });

  const selectedType = watch('type');

  useEffect(() => {
    if (templateIdParam) {
      const existing = getTemplateById(templateIdParam);
      if (existing) {
        setEditingTemplate(existing);
        reset({
          title: existing.title,
          type: existing.type,
          description: existing.description || '',
        });
      }
    }
  }, [templateIdParam, getTemplateById, reset]);

  const onSubmit = async (data: TemplateFormData) => {
    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, {
        title: data.title.trim(),
        type: data.type,
        description: data.description?.trim() || undefined,
      });
      setSuccessMessage('¡Plantilla actualizada!');
    } else {
      await addTemplate({
        title: data.title.trim(),
        type: data.type,
        description: data.description?.trim() || undefined,
      });
      setSuccessMessage('¡Plantilla creada!');
    }

    setTimeout(() => {
      router.push('/workouts/templates');
    }, 600);
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
          Define qué es el ejercicio. Las series, el descanso y la carga se deciden al añadirlo a una sesión.
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
        {/* 1. Nombre del Ejercicio */}
        <Input
          label="Nombre del Ejercicio"
          placeholder="Ej: Suspensiones 20mm, Bloques de 4 movimientos, Dominadas con lastre, Continuidad ARC..."
          {...register('title')}
          error={errors.title?.message}
          className="text-base font-bold"
        />

        {/* 2. Tipo de Ejecución */}
        <div className="p-4 bg-chalk-50 dark:bg-graphite-850 rounded-2xl border border-chalk-200 dark:border-graphite-750 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-graphite-700 dark:text-graphite-300">
            ¿Qué tipo de ejercicio es?
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {BLOCK_TYPES.map((type) => {
              const config = BLOCK_TYPE_CONFIG[type];
              const IconComponent = config.icon;
              const isSelected = selectedType === type;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setValue('type', type)}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                    isSelected
                      ? 'border-terracotta bg-terracotta-50/70 dark:bg-terracotta-950/40 text-terracotta ring-1 ring-terracotta font-bold'
                      : 'border-chalk-300 dark:border-graphite-700 bg-white dark:bg-graphite-900 text-graphite-700 dark:text-graphite-300'
                  }`}
                >
                  <IconComponent className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">{config.label}</div>
                    <div className="text-[10px] text-graphite-500">{config.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Descripción / Indicaciones técnicas */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-graphite-600 dark:text-graphite-400 mb-1.5">
            Indicaciones Técnicas (Opcional)
          </label>
          <textarea
            rows={3}
            placeholder="Ej: Semiarqueo en regleta 20mm, hombros activos y recorrido completo..."
            {...register('description')}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-chalk-100 dark:bg-graphite-800 text-graphite-900 dark:text-graphite-100 border border-chalk-300 dark:border-graphite-700 focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta"
          />
        </div>

        {/* 4. Botones de Acción */}
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
