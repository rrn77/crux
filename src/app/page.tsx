'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Play,
  Plus,
  Flame,
  Clock,
  Activity,
  History,
  TrendingUp,
  BookOpen,
  ArrowRight,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useWorkoutStore } from '@/lib/store/workoutStore';
import { useActiveWorkoutStore } from '@/lib/store/activeWorkoutStore';
import { useTestStore } from '@/lib/store/testStore';
import { formatDurationHuman, formatBlockSummary } from '@/lib/timer/durationHelper';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TemplatePickerModal } from '@/components/workout/TemplatePickerModal';
import { WorkoutTemplate } from '@/lib/types';

export default function HomePage() {
  const router = useRouter();
  const { templates, sessions } = useWorkoutStore();
  const { startWorkout, isActive } = useActiveWorkoutStore();
  const { tests } = useTestStore();

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleStartTemplate = (template: WorkoutTemplate, startImmediately = true) => {
    if (startImmediately) {
      startWorkout(template.title, template.blocks, template.id);
      router.push('/workout/active');
    } else {
      router.push(`/workouts/new?templateId=${template.id}`);
    }
  };

  const recentSessions = sessions.slice(0, 3);
  const featuredTemplate = templates[0] || null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Tarjeta de Acción Rápida: Entrenar Hoy */}
      <div className="bg-gradient-to-br from-terracotta to-terracotta-700 text-white rounded-3xl p-5 sm:p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-white text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
              Sesión Recomendada
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              {featuredTemplate ? featuredTemplate.title : 'Planifica tu Entrenamiento'}
            </h1>
            <p className="text-xs sm:text-sm text-white/90 mt-1 line-clamp-2">
              {featuredTemplate
                ? featuredTemplate.description
                : 'Crea tu propia sesión con bloques a medida: intervalos, búlder, suspensiones o core.'}
            </p>
          </div>

          {featuredTemplate ? (
            <div className="flex items-center gap-3 text-xs font-medium text-white/90">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                ~{formatDurationHuman(featuredTemplate.estimatedDurationSeconds)}
              </span>
              <span>&bull;</span>
              <span>{featuredTemplate.blocks.length} {featuredTemplate.blocks.length === 1 ? 'bloque' : 'bloques'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-medium text-white/90">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Crea bloques libres y configura tus tiempos de trabajo y descanso</span>
            </div>
          )}

          <div className="flex items-center gap-2.5 pt-1">
            {featuredTemplate ? (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => handleStartTemplate(featuredTemplate, true)}
                className="bg-white text-terracotta hover:bg-chalk-100 font-bold shadow-md flex-1 sm:flex-initial"
              >
                <Play className="w-4 h-4 mr-1.5 fill-current" />
                Iniciar Sesión
              </Button>
            ) : (
              <Link href="/workouts/new" className="flex-1 sm:flex-initial">
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white text-terracotta hover:bg-chalk-100 font-bold shadow-md w-full"
                >
                  <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                  Crear Primera Sesión
                </Button>
              </Link>
            )}

            {templates.length > 0 && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => setIsTemplateModalOpen(true)}
                className="border-white/30 text-white hover:bg-white/10"
              >
                <BookOpen className="w-4 h-4 mr-1.5" />
                Ver Plantillas
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Accesos Rápidos Principales (4 Botones) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Link
          href="/workouts/new"
          className="p-3.5 rounded-2xl bg-white dark:bg-graphite-900 border border-chalk-300 dark:border-graphite-800 hover:border-terracotta/50 transition-all flex flex-col items-start gap-2 shadow-sm group"
        >
          <div className="w-9 h-9 rounded-xl bg-terracotta-100 dark:bg-terracotta-900/40 text-terracotta flex items-center justify-center group-hover:scale-105 transition-transform">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="font-bold text-sm text-graphite-900 dark:text-graphite-100">
              Nueva Sesión
            </div>
            <div className="text-[11px] text-graphite-500">Bloques libres</div>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setIsTemplateModalOpen(true)}
          className="p-3.5 rounded-2xl bg-white dark:bg-graphite-900 border border-chalk-300 dark:border-graphite-800 hover:border-moss/50 transition-all flex flex-col items-start gap-2 shadow-sm group text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-moss-100 dark:bg-moss-900/40 text-moss flex items-center justify-center group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-graphite-900 dark:text-graphite-100">
              Plantillas
            </div>
            <div className="text-[11px] text-graphite-500">{templates.length} guardadas</div>
          </div>
        </button>

        <Link
          href="/tests"
          className="p-3.5 rounded-2xl bg-white dark:bg-graphite-900 border border-chalk-300 dark:border-graphite-800 hover:border-blue-500/50 transition-all flex flex-col items-start gap-2 shadow-sm group"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-graphite-900 dark:text-graphite-100">
              Tests
            </div>
            <div className="text-[11px] text-graphite-500">{tests.length} registros</div>
          </div>
        </Link>

        <Link
          href="/progress"
          className="p-3.5 rounded-2xl bg-white dark:bg-graphite-900 border border-chalk-300 dark:border-graphite-800 hover:border-amber-500/50 transition-all flex flex-col items-start gap-2 shadow-sm group"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-graphite-900 dark:text-graphite-100">
              Progreso
            </div>
            <div className="text-[11px] text-graphite-500">Gráficas</div>
          </div>
        </Link>
      </div>

      {/* 3. Plantillas Guardadas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-lg text-graphite-900 dark:text-graphite-100">
            Tus Plantillas
          </h2>
          {templates.length > 0 && (
            <button
              type="button"
              onClick={() => setIsTemplateModalOpen(true)}
              className="text-xs font-bold text-terracotta hover:underline flex items-center gap-0.5"
            >
              Ver todas ({templates.length})
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {templates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {templates.slice(0, 4).map((tpl) => (
              <div
                key={tpl.id}
                className="p-4 rounded-2xl bg-white dark:bg-graphite-900 border border-chalk-300 dark:border-graphite-800 shadow-sm hover:border-terracotta/50 transition-all flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h3 className="font-bold text-sm text-graphite-900 dark:text-graphite-100 truncate">
                      {tpl.title}
                    </h3>
                    <span className="text-[11px] font-mono font-semibold text-graphite-500 shrink-0">
                      {formatDurationHuman(tpl.estimatedDurationSeconds)}
                    </span>
                  </div>
                  {tpl.description && (
                    <p className="text-xs text-graphite-500 dark:text-graphite-400 line-clamp-2">
                      {tpl.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-chalk-200 dark:border-graphite-800">
                  <span className="text-[11px] font-medium text-graphite-500">
                    {tpl.blocks.length} {tpl.blocks.length === 1 ? 'bloque' : 'bloques'}
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStartTemplate(tpl, true)}
                  >
                    <Play className="w-3.5 h-3.5 mr-1 fill-current" />
                    Iniciar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center bg-white dark:bg-graphite-900 rounded-3xl border border-chalk-300 dark:border-graphite-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-chalk-200 dark:bg-graphite-800 text-graphite-500 mx-auto flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-graphite-900 dark:text-white">No tienes plantillas guardadas</h3>
              <p className="text-xs text-graphite-500 max-w-sm mx-auto">
                Crea tus propias rutinas personalizadas de intervalos, búlder, suspensiones o core para lanzarlas en 1 toque.
              </p>
            </div>
            <Link href="/workouts/new">
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Crear Plantilla
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* 4. Historial Reciente de Sesiones */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-lg text-graphite-900 dark:text-graphite-100">
            Últimas Sesiones
          </h2>
          <Link
            href="/history"
            className="text-xs font-bold text-terracotta hover:underline flex items-center gap-0.5"
          >
            Historial completo
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentSessions.length > 0 ? (
          <div className="space-y-2.5">
            {recentSessions.map((session) => {
              const dateStr = new Date(session.startedAt).toLocaleDateString('es-ES', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              });

              return (
                <Link
                  key={session.id}
                  href={`/history/${session.id}`}
                  className="p-3.5 rounded-2xl bg-white dark:bg-graphite-900 border border-chalk-300 dark:border-graphite-800 shadow-sm hover:border-chalk-400 dark:hover:border-graphite-700 transition-all flex items-center justify-between gap-3 block"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-sm text-graphite-900 dark:text-graphite-100 truncate">
                        {session.title}
                      </h3>
                      {session.overallRpe && (
                        <Badge variant="terracotta" size="sm">
                          RPE {session.overallRpe}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-graphite-500 capitalize">
                      {dateStr} &bull; {formatDurationHuman(session.durationSeconds)} &bull; {session.blocks.length} bloques
                    </p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-graphite-400 shrink-0" />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-white dark:bg-graphite-900 rounded-2xl border border-chalk-300 dark:border-graphite-800 text-xs text-graphite-500">
            Aún no has registrado ninguna sesión. ¡Empieza tu primer entrenamiento hoy!
          </div>
        )}
      </div>

      {/* Modal selector de plantilla */}
      <TemplatePickerModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleStartTemplate}
      />
    </div>
  );
}
