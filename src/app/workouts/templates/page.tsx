'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Plus,
  Play,
  Clock,
  Trash2,
  Edit2,
  ArrowLeft,
  CalendarPlus,
} from 'lucide-react';
import { useWorkoutStore } from '@/lib/store/workoutStore';
import { useActiveWorkoutStore } from '@/lib/store/activeWorkoutStore';
import { syncService } from '@/lib/supabase/syncService';
import { formatDurationHuman, formatBlockSummary } from '@/lib/timer/durationHelper';
import { WorkoutTemplate } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

export default function TemplatesPage() {
  const router = useRouter();
  const { templates, deleteTemplate } = useWorkoutStore();
  const { startWorkout } = useActiveWorkoutStore();

  const [deletingTemplate, setDeletingTemplate] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStartTemplate = (template: WorkoutTemplate) => {
    startWorkout(template.title, template.blocks, template.id);
    router.push('/workout/active');
  };

  const handleConfirmDelete = async () => {
    if (!deletingTemplate) return;
    const { id, title } = deletingTemplate;
    setIsDeleting(true);
    try {
      deleteTemplate(id);
      await syncService.deleteTemplate(id, title);
    } catch (err) {
      console.warn('Error al eliminar plantilla:', err);
    } finally {
      setIsDeleting(false);
      setDeletingTemplate(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-bold text-graphite-600 dark:text-graphite-400 hover:text-terracotta transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Inicio
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-graphite-950 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-moss" />
            Plantillas de Ejercicios
          </h1>
          <p className="text-xs text-graphite-500 mt-0.5">
            Crea y guarda ejercicios reutilizables para planificar tus sesiones de la semana
          </p>
        </div>

        <Link href="/workouts/templates/new">
          <Button variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-1 stroke-[2.5]" />
            Nueva Plantilla de Ejercicio
          </Button>
        </Link>
      </div>

      {/* Lista de Plantillas de Ejercicios */}
      {templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {templates.map((tpl) => {
            const firstBlock = tpl.blocks[0];

            return (
              <div
                key={tpl.id}
                className="bg-white dark:bg-graphite-900 p-5 rounded-3xl border border-chalk-300 dark:border-graphite-800 shadow-sm hover:border-terracotta/50 transition-all flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="font-bold text-base sm:text-lg text-graphite-900 dark:text-graphite-100 truncate">
                        {tpl.title}
                      </h2>
                      {firstBlock && (
                        <span className="text-[11px] font-bold uppercase tracking-wider text-moss bg-moss-50 dark:bg-moss-950/40 px-2 py-0.5 rounded-md inline-block mt-0.5">
                          {firstBlock.type === 'intervals'
                            ? 'Intervalos'
                            : firstBlock.type === 'problems'
                            ? 'Bloques / Búlder'
                            : firstBlock.type === 'reps'
                            ? 'Repeticiones'
                            : firstBlock.type === 'attempts'
                            ? 'Intentos'
                            : 'Libre'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-graphite-700 dark:text-graphite-300 bg-chalk-100 dark:bg-graphite-800 px-2.5 py-1 rounded-xl shrink-0">
                      <Clock className="w-3.5 h-3.5 text-terracotta" />
                      {formatDurationHuman(tpl.estimatedDurationSeconds)}
                    </div>
                  </div>

                  {/* Resumen del Ejercicio */}
                  <div className="bg-chalk-100 dark:bg-graphite-850 p-3 rounded-2xl border border-chalk-200 dark:border-graphite-800 space-y-1 text-xs">
                    {firstBlock ? (
                      <div className="font-mono font-bold text-graphite-800 dark:text-graphite-200">
                        {formatBlockSummary(firstBlock)}
                      </div>
                    ) : (
                      <div className="text-graphite-500">Sin configuración de bloques</div>
                    )}

                    {tpl.description && (
                      <p className="text-[11px] text-graphite-500 italic pt-0.5">{tpl.description}</p>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center justify-between pt-2 border-t border-chalk-200 dark:border-graphite-800">
                  <button
                    type="button"
                    onClick={() => setDeletingTemplate({ id: tpl.id, title: tpl.title })}
                    className="text-xs font-bold text-red-600 hover:text-red-700 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar
                  </button>

                  <div className="flex items-center gap-2">
                    <Link href={`/workouts/templates/new?id=${tpl.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Editar
                      </Button>
                    </Link>

                    <Link href={`/workouts/new?templateId=${tpl.id}`}>
                      <Button variant="outline" size="sm" title="Usar para planificar una sesión">
                        <CalendarPlus className="w-3.5 h-3.5 mr-1 text-terracotta" />
                        Planificar
                      </Button>
                    </Link>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStartTemplate(tpl)}
                    >
                      <Play className="w-3.5 h-3.5 mr-1 fill-current" />
                      Entrenar
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-10 text-center bg-white dark:bg-graphite-900 rounded-3xl border border-chalk-300 dark:border-graphite-800 shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-moss-100 dark:bg-moss-900/40 text-moss mx-auto flex items-center justify-center">
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-bold text-base sm:text-lg text-graphite-900 dark:text-white">
              No tienes plantillas de ejercicios creadas
            </h3>
            <p className="text-xs text-graphite-500">
              Crea tus ejercicios personalizados (ej. Suspensiones 7/3, Dominadas con lastre, ULAC o Bloques en plafón). Podrás utilizarlos en cualquier momento para planificar tus sesiones de la semana.
            </p>
          </div>
          <Link href="/workouts/templates/new">
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
              Crear Mi Primer Ejercicio
            </Button>
          </Link>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deletingTemplate)}
        onClose={() => !isDeleting && setDeletingTemplate(null)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar esta plantilla de ejercicio?"
        description={
          deletingTemplate
            ? `¿Estás seguro de que deseas eliminar la plantilla "${deletingTemplate.title}"? Esta acción no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar Plantilla"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
