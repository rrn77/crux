'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Sparkles } from 'lucide-react';
import { useWorkoutStore } from '@/lib/store/workoutStore';
import { useAuthStore } from '@/lib/supabase/authStore';
import { syncService } from '@/lib/supabase/syncService';
import { WorkoutBlock, WorkoutTemplate } from '@/lib/types';
import { calculateTotalEstimatedDuration } from '@/lib/timer/durationHelper';
import { BlockFormInline } from '@/components/workout/BlockFormInline';

function TemplateEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get('id');

  const { templates, addTemplate, updateTemplate, getTemplateById } = useWorkoutStore();
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (templateIdParam) {
      const existing = getTemplateById(templateIdParam);
      if (existing) {
        setEditingTemplate(existing);
      }
    }
  }, [templateIdParam, getTemplateById]);

  const handleSaveExerciseTemplate = (block: WorkoutBlock) => {
    const estimatedSec = calculateTotalEstimatedDuration([block]);
    const user = useAuthStore.getState().user;
    const userId = user?.id || 'local';

    if (editingTemplate) {
      const updated: WorkoutTemplate = {
        ...editingTemplate,
        title: block.title,
        description: block.notes || block.target || undefined,
        estimatedDurationSeconds: estimatedSec,
        blocks: [{ ...block, position: 0 }],
      };
      updateTemplate(editingTemplate.id, {
        title: updated.title,
        description: updated.description,
        estimatedDurationSeconds: estimatedSec,
        blocks: updated.blocks,
      });
      syncService.pushTemplate(updated, userId);
      setSuccessMessage('¡Plantilla actualizada correctamente!');
    } else {
      const newTpl = addTemplate({
        title: block.title,
        description: block.notes || block.target || undefined,
        estimatedDurationSeconds: estimatedSec,
        blocks: [{ ...block, position: 0 }],
      });
      syncService.pushTemplate(newTpl, userId);
      setSuccessMessage('¡Plantilla creada correctamente!');
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
          {editingTemplate ? 'Editar Plantilla de Ejercicio' : 'Nueva Plantilla de Ejercicio'}
        </h1>
        <p className="text-xs text-graphite-500 mt-0.5">
          Configura los parámetros del ejercicio para reutilizarlo libremente en tus sesiones semanales
        </p>
      </div>

      {successMessage && (
        <div className="p-3 bg-moss-100 dark:bg-moss-900/40 text-moss-900 dark:text-moss-200 text-xs font-bold rounded-2xl flex items-center gap-2 animate-scale-up">
          <Sparkles className="w-4 h-4 text-moss" />
          {successMessage}
        </div>
      )}

      {/* Formulario a pantalla completa / integrado */}
      <div className="bg-white dark:bg-graphite-900 p-5 sm:p-6 rounded-3xl border border-chalk-300 dark:border-graphite-800 shadow-sm">
        <BlockFormInline
          initialBlock={editingTemplate?.blocks[0] || null}
          onSave={handleSaveExerciseTemplate}
          onCancel={() => router.push('/workouts/templates')}
          submitLabel={editingTemplate ? 'Guardar Cambios' : 'Crear Plantilla de Ejercicio'}
        />
      </div>
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
