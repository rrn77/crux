'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Play,
  Plus,
  Clock,
  Activity,
  History,
  TrendingUp,
  BookOpen,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Dumbbell,
  Layers,
  Trash2,
} from 'lucide-react';
import { useWorkoutStore, getLocalDateIsoString } from '@/lib/store/workoutStore';
import { useActiveWorkoutStore } from '@/lib/store/activeWorkoutStore';
import { useTestStore } from '@/lib/store/testStore';
import { formatDurationHuman, formatBlockSummary } from '@/lib/timer/durationHelper';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { syncService } from '@/lib/supabase/syncService';
import { WorkoutTemplate, WorkoutSession } from '@/lib/types';

export default function HomePage() {
  const router = useRouter();
  const { templates, sessions, getTodaySession, deleteSession } = useWorkoutStore();
  const { startWorkout } = useActiveWorkoutStore();
  const { tests } = useTestStore();

  const [mounted, setMounted] = useState(false);
  const [deletingSession, setDeletingSession] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingSession, setIsDeletingSession] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConfirmDeleteSession = async () => {
    if (!deletingSession) return;
    const { id, title } = deletingSession;
    setIsDeletingSession(true);
    try {
      deleteSession(id);
      await syncService.deleteSession(id, title);
    } catch (err) {
      console.warn('Error al eliminar sesión:', err);
    } finally {
      setIsDeletingSession(false);
      setDeletingSession(null);
    }
  };

  const todayIso = getLocalDateIsoString();

  // Fecha de hoy formateada en español
  const todayFormatted = useMemo(() => {
    const text = new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    return text.charAt(0).toUpperCase() + text.slice(1);
  }, []);

  // Sesión asociada al día de hoy (si existe)
  const todaySession = useMemo(() => {
    return getTodaySession();
  }, [sessions, getTodaySession]);

  // Días de la semana actual (Lunes a Domingo)
  const weekDays = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Dom, 1 = Lun, ... 6 = Sáb
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    const week: Array<{
      dateStr: string;
      dayNumber: number;
      dayName: string;
      isToday: boolean;
      session?: WorkoutSession;
      hasTest: boolean;
    }> = [];

    const dayNamesShort = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = getLocalDateIsoString(d);

      const daySession = sessions.find((s) => {
        if (s.scheduledDate === dateStr) return true;
        if (s.startedAt && getLocalDateIsoString(new Date(s.startedAt)) === dateStr) return true;
        return false;
      });

      const hasTest = tests.some(
        (t) => getLocalDateIsoString(new Date(t.testedAt)) === dateStr
      );

      week.push({
        dateStr,
        dayNumber: d.getDate(),
        dayName: dayNamesShort[i],
        isToday: dateStr === todayIso,
        session: daySession,
        hasTest,
      });
    }

    return week;
  }, [sessions, tests, todayIso]);

  const handleStartTodaySession = () => {
    if (!todaySession) return;
    startWorkout(
      todaySession.title,
      todaySession.blocks,
      todaySession.templateId,
      todaySession.id,
      todaySession.scheduledDate
    );
    router.push('/workout/active');
  };

  const handleStartTemplate = (template: WorkoutTemplate, startImmediately = true) => {
    if (startImmediately) {
      startWorkout(template.title, template.blocks, template.id, undefined, todayIso);
      router.push('/workout/active');
    } else {
      router.push(`/workouts/new?templateId=${template.id}&date=${todayIso}`);
    }
  };

  const recentSessions = useMemo(() => {
    return sessions
      .filter((s) => s.status === 'completed')
      .slice(0, 3);
  }, [sessions]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Tarjeta Principal: Sesión del Día en el que Estamos */}
      {todaySession ? (
        todaySession.status === 'completed' ? (
          /* Estado A: Sesión de Hoy Ya Completada */
          <div className="bg-gradient-to-br from-moss-700 to-moss-900 text-white rounded-3xl p-5 sm:p-6 shadow-lg relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
              <span className="bg-white/20 text-white text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Entrenamiento de Hoy Completado
              </span>
              <span className="text-xs text-white/80 font-medium">{todayFormatted}</span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                {todaySession.title}
              </h1>
              <div className="flex items-center gap-3 text-xs font-medium text-white/90 mt-2">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDurationHuman(todaySession.durationSeconds)}
                </span>
                <span>&bull;</span>
                <span>{todaySession.blocks.length} {todaySession.blocks.length === 1 ? 'ejercicio' : 'ejercicios'}</span>
                {todaySession.overallRpe && (
                  <>
                    <span>&bull;</span>
                    <span className="font-bold bg-white/20 px-2 py-0.5 rounded-md">
                      RPE {todaySession.overallRpe}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1 flex-wrap">
              <Link href={`/history/${todaySession.id}`}>
                <Button variant="secondary" size="md" className="bg-white text-moss font-bold shadow-md">
                  Ver Resumen de Sesión
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link href={`/workouts/new?date=${todayIso}`}>
                <Button variant="outline" size="md" className="border-white/30 text-white hover:bg-white/10">
                  <Plus className="w-4 h-4 mr-1" />
                  Otra Sesión
                </Button>
              </Link>
              <button
                type="button"
                onClick={() => setDeletingSession({ id: todaySession.id, title: todaySession.title })}
                title="Eliminar sesión"
                aria-label="Eliminar sesión"
                className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center ml-auto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Estado B: Sesión Programada para Hoy (Pendiente) */
          <div className="bg-gradient-to-br from-terracotta to-terracotta-700 text-white rounded-3xl p-5 sm:p-6 shadow-lg relative overflow-hidden space-y-4">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="bg-white/20 text-white text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <CalendarCheck className="w-3.5 h-3.5" />
                  Sesión Programada de Hoy
                </span>
                <span className="text-xs text-white/80 font-medium">{todayFormatted}</span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                  {todaySession.title}
                </h1>
                {todaySession.notes && (
                  <p className="text-xs sm:text-sm text-white/90 mt-1 line-clamp-2">
                    {todaySession.notes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs font-medium text-white/90">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  ~{formatDurationHuman(todaySession.durationSeconds)}
                </span>
                <span>&bull;</span>
                <span>{todaySession.blocks.length} {todaySession.blocks.length === 1 ? 'ejercicio' : 'ejercicios'}</span>
              </div>

              {/* Lista compacta de ejercicios */}
              {todaySession.blocks.length > 0 && (
                <div className="bg-black/15 rounded-2xl p-2.5 space-y-1 text-xs text-white/90">
                  {todaySession.blocks.map((b, idx) => (
                    <div key={b.id || idx} className="flex items-center justify-between">
                      <span className="font-semibold truncate">
                        {idx + 1}. {b.title}
                      </span>
                      <span className="text-[11px] font-mono text-white/75 shrink-0">
                        {formatBlockSummary(b)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2.5 pt-1 flex-wrap">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleStartTodaySession}
                  className="bg-white text-terracotta hover:bg-chalk-100 font-bold shadow-md flex-1 sm:flex-initial"
                >
                  <Play className="w-4 h-4 mr-1.5 fill-current" />
                  Iniciar Entrenamiento de Hoy
                </Button>

                <Link href={`/workouts/new?sessionId=${todaySession.id}`}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    Editar Sesión
                  </Button>
                </Link>

                <button
                  type="button"
                  onClick={() => setDeletingSession({ id: todaySession.id, title: todaySession.title })}
                  title="Eliminar o cancelar sesión"
                  aria-label="Eliminar o cancelar sesión"
                  className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center ml-auto"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )
      ) : (
        /* Estado C: No hay sesión programada para hoy */
        <div className="bg-white dark:bg-graphite-900 border border-chalk-300 dark:border-graphite-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="bg-chalk-100 dark:bg-graphite-800 text-graphite-600 dark:text-graphite-300 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-chalk-200 dark:border-graphite-700">
              <Calendar className="w-3.5 h-3.5 text-terracotta" />
              {todayFormatted}
            </span>
            <span className="text-xs text-graphite-400 font-medium">Día de descanso</span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black text-graphite-900 dark:text-white tracking-tight">
              Sin sesión programada para hoy
            </h1>
            <p className="text-xs sm:text-sm text-graphite-500">
              Tómate el día para asimilar cargas o planifica tu sesión con tus plantillas de ejercicios.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <Link href={`/workouts/new?date=${todayIso}`}>
              <Button variant="primary" size="md">
                <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                Planificar Sesión de Hoy
              </Button>
            </Link>

            <Link href="/workouts/templates">
              <Button variant="outline" size="md">
                <BookOpen className="w-4 h-4 mr-1.5 text-moss" />
                Tus Plantillas de Ejercicios
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* 2. Franja Semanal Interactiva (Lunes a Domingo) */}
      <div className="bg-white dark:bg-graphite-900 p-4 rounded-3xl border border-chalk-300 dark:border-graphite-800 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-graphite-600 dark:text-graphite-400 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-terracotta" />
            Tu Semana de Entrenamiento
          </h2>
          <Link
            href="/history"
            className="text-xs font-bold text-terracotta hover:underline flex items-center gap-0.5"
          >
            Ver Calendario Completo
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center">
          {weekDays.map((day) => {
            const hasCompleted = day.session?.status === 'completed';
            const hasScheduled = day.session && day.session.status !== 'completed';

            return (
              <Link
                key={day.dateStr}
                href={day.session ? `/history?date=${day.dateStr}` : `/workouts/new?date=${day.dateStr}`}
                className={`p-2 rounded-2xl border transition-all flex flex-col items-center justify-between gap-1 group ${
                  day.isToday
                    ? 'border-terracotta bg-terracotta-50/60 dark:bg-terracotta-950/30 ring-1 ring-terracotta font-bold'
                    : hasCompleted
                    ? 'border-moss-200 dark:border-moss-900/50 bg-moss-50/50 dark:bg-moss-950/20'
                    : hasScheduled
                    ? 'border-terracotta-200 dark:border-terracotta-900/50 bg-chalk-50 dark:bg-graphite-850'
                    : 'border-chalk-200 dark:border-graphite-800 hover:border-chalk-300 bg-white dark:bg-graphite-900'
                }`}
              >
                <span className="text-[11px] font-bold text-graphite-500 uppercase">{day.dayName}</span>
                <span className={`text-sm font-black ${day.isToday ? 'text-terracotta' : 'text-graphite-800 dark:text-graphite-200'}`}>
                  {day.dayNumber}
                </span>

                <div className="h-2 flex items-center justify-center gap-0.5">
                  {hasCompleted ? (
                    <span className="w-2 h-2 rounded-full bg-moss" title="Entrenamiento completado" />
                  ) : hasScheduled ? (
                    <span className="w-2 h-2 rounded-full bg-terracotta" title="Sesión planificada" />
                  ) : day.hasTest ? (
                    <span className="w-2 h-2 rounded-full bg-blue-500" title="Test físico" />
                  ) : (
                    <span className="w-1 h-1 rounded-full bg-chalk-300 dark:bg-graphite-700" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 3. Accesos Rápidos Principales (4 Botones) */}
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
              Planificar Sesión
            </div>
            <div className="text-[11px] text-graphite-500">Para cualquier día</div>
          </div>
        </Link>

        <Link
          href="/workouts/templates"
          className="p-3.5 rounded-2xl bg-white dark:bg-graphite-900 border border-chalk-300 dark:border-graphite-800 hover:border-moss/50 transition-all flex flex-col items-start gap-2 shadow-sm group text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-moss-100 dark:bg-moss-900/40 text-moss flex items-center justify-center group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-graphite-900 dark:text-graphite-100">
              Tus Ejercicios
            </div>
            <div className="text-[11px] text-graphite-500">{templates.length} plantillas</div>
          </div>
        </Link>

        <Link
          href="/tests"
          className="p-3.5 rounded-2xl bg-white dark:bg-graphite-900 border border-chalk-300 dark:border-graphite-800 hover:border-blue-500/50 transition-all flex flex-col items-start gap-2 shadow-sm group"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-graphite-900 dark:text-graphite-100">
              Tests y Benchmarks
            </div>
            <div className="text-[11px] text-graphite-500">{tests.length} registros</div>
          </div>
        </Link>

        <Link
          href="/history"
          className="p-3.5 rounded-2xl bg-white dark:bg-graphite-900 border border-chalk-300 dark:border-graphite-800 hover:border-purple-500/50 transition-all flex flex-col items-start gap-2 shadow-sm group"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-graphite-900 dark:text-graphite-100">
              Calendario
            </div>
            <div className="text-[11px] text-graphite-500">Historial de días</div>
          </div>
        </Link>
      </div>

      {/* 4. Plantillas de Ejercicios Creadas por el Usuario */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-black text-lg text-graphite-900 dark:text-graphite-100">
              Tus Plantillas de Ejercicios
            </h2>
            <p className="text-xs text-graphite-500">Ejercicios independientes listos para usar en tus entrenamientos</p>
          </div>
          <Link
            href="/workouts/templates"
            className="text-xs font-bold text-terracotta hover:underline flex items-center gap-0.5 shrink-0"
          >
            Gestionar ({templates.length})
            <ChevronRight className="w-4 h-4" />
          </Link>
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
                    {tpl.blocks[0] ? formatBlockSummary(tpl.blocks[0]) : '1 bloque'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Link href={`/workouts/new?templateId=${tpl.id}&date=${todayIso}`}>
                      <Button variant="outline" size="sm">
                        Planificar
                      </Button>
                    </Link>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStartTemplate(tpl, true)}
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
          <div className="p-6 text-center bg-white dark:bg-graphite-900 rounded-3xl border border-chalk-300 dark:border-graphite-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-moss-100 dark:bg-moss-900/40 text-moss mx-auto flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-graphite-900 dark:text-white">
                No tienes plantillas de ejercicios guardadas
              </h3>
              <p className="text-xs text-graphite-500 max-w-sm mx-auto">
                Crea ejercicios personalizados de suspensiones, dominadas, búlder o intervalos para utilizarlos en tus sesiones.
              </p>
            </div>
            <Link href="/workouts/templates">
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Crear Mi Primer Ejercicio
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* 5. Historial Reciente de Sesiones Realizadas */}
      {recentSessions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-lg text-graphite-900 dark:text-graphite-100">
              Últimas Sesiones Realizadas
            </h2>
            <Link
              href="/history"
              className="text-xs font-bold text-terracotta hover:underline flex items-center gap-0.5"
            >
              Ver historial
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

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
        </div>
      )}

      {/* Modal de Confirmación para Eliminar Sesión */}
      <ConfirmModal
        isOpen={Boolean(deletingSession)}
        onClose={() => !isDeletingSession && setDeletingSession(null)}
        onConfirm={handleConfirmDeleteSession}
        title="¿Eliminar sesión de entrenamiento?"
        description={
          deletingSession
            ? `¿Estás seguro de que deseas eliminar la sesión "${deletingSession.title}"? Esta acción no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar Sesión"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeletingSession}
      />
    </div>
  );
}
