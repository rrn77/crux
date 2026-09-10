'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Plus,
  Play,
  Clock,
  Trash2,
  Edit2,
  Flame,
  ArrowLeft,
} from 'lucide-react';
import { useWorkoutStore } from '@/lib/store/workoutStore';
import { useActiveWorkoutStore } from '@/lib/store/activeWorkoutStore';
import { formatDurationHuman, formatBlockSummary } from '@/lib/timer/durationHelper';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function TemplatesPage() {
  const router = useRouter();
  const { templates, deleteTemplate } = useWorkoutStore();
  const { startWorkout } = useActiveWorkoutStore();

  const handleStartTemplate = (template: (typeof templates)[0]) => {
    startWorkout(template.title, template.blocks, template.id);
    router.push('/workout/active');
  };

  const handleDeleteTemplate = (id: string, title: string) => {
    if (confirm(`¿Eliminar la plantilla "${title}"?`)) {
      deleteTemplate(id);
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-graphite-950 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-moss" />
            Catálogo de Plantillas
          </h1>
          <p className="text-xs text-graphite-500 mt-0.5">
            {templates.length} plantillas disponibles
          </p>
        </div>

        <Link href="/workouts/new">
          <Button variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-1 stroke-[2.5]" />
            Crear Plantilla
          </Button>
        </Link>
      </div>

      {/* Lista de Plantillas */}
      {templates.length > 0 ? (
        <div className="space-y-3.5">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-white dark:bg-graphite-900 p-5 rounded-3xl border border-chalk-300 dark:border-graphite-800 shadow-sm hover:border-terracotta/50 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-bold text-base sm:text-lg text-graphite-900 dark:text-graphite-100">
                      {tpl.title}
                    </h2>
                  </div>
                  {tpl.description && (
                    <p className="text-xs text-graphite-500 max-w-xl">{tpl.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-graphite-700 dark:text-graphite-300 bg-chalk-100 dark:bg-graphite-800 px-2.5 py-1 rounded-xl shrink-0">
                  <Clock className="w-3.5 h-3.5 text-terracotta" />
                  {formatDurationHuman(tpl.estimatedDurationSeconds)}
                </div>
              </div>

              {/* Desglose de Bloques */}
              <div className="bg-chalk-100 dark:bg-graphite-850 p-3 rounded-2xl space-y-1.5 border border-chalk-200 dark:border-graphite-800 text-xs">
                {tpl.blocks.map((block, idx) => (
                  <div key={block.id || idx} className="flex items-center justify-between text-graphite-600 dark:text-graphite-400">
                    <span className="font-medium text-graphite-900 dark:text-graphite-200 truncate">
                      {idx + 1}. {block.title}
                    </span>
                    <span className="font-mono text-[11px] shrink-0 text-graphite-500">
                      {formatBlockSummary(block)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => handleDeleteTemplate(tpl.id, tpl.title)}
                  className="text-xs font-bold text-red-600 hover:text-red-700 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar
                </button>

                <div className="flex items-center gap-2">
                  <Link href={`/workouts/new?templateId=${tpl.id}`}>
                    <Button variant="outline" size="sm">
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      Editar
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
          ))}
        </div>
      ) : (
        <div className="p-10 text-center bg-white dark:bg-graphite-900 rounded-3xl border border-chalk-300 dark:border-graphite-800 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-terracotta-100 dark:bg-terracotta-900/40 text-terracotta mx-auto flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="font-bold text-base text-graphite-900 dark:text-white">
              Aún no tienes plantillas creadas
            </h3>
            <p className="text-xs text-graphite-500">
              Crea tu primera plantilla personalizada estructurando tus bloques de intervalos, suspensiones, bloque o core para reutilizarla cuando quieras.
            </p>
          </div>
          <Link href="/workouts/new">
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4 mr-1.5" />
              Crear Mi Primera Plantilla
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
