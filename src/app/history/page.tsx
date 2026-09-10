'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock,
  Calendar as CalendarIcon,
  Trophy,
  ChevronRight,
  ChevronLeft,
  Plus,
  StickyNote,
  Dumbbell,
  Activity,
  Play,
  Edit2,
  CheckCircle2,
  CalendarCheck,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Trash2,
  Copy,
} from 'lucide-react';
import { useWorkoutStore, getLocalDateIsoString } from '@/lib/store/workoutStore';
import { useActiveWorkoutStore } from '@/lib/store/activeWorkoutStore';
import { useTestStore, calculateTestDelta, calculateTestFatigue } from '@/lib/store/testStore';
import { formatDurationHuman, formatBlockSummary } from '@/lib/timer/durationHelper';
import { buildRetroCompletedSession } from '@/lib/workout/retroComplete';
import { WorkoutSession, TestRecord } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { CompleteSessionRetroModal } from '@/components/workout/CompleteSessionRetroModal';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function HistoryPage() {
  const router = useRouter();
  const { sessions, deleteSession, saveSession } = useWorkoutStore();
  const { tests, getPreviousTest } = useTestStore();
  const { startWorkout } = useActiveWorkoutStore();

  const todayIso = getLocalDateIsoString();

  // Estado del mes visualizado en el calendario
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  // Estado del día seleccionado (YYYY-MM-DD)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayIso);
  // Modo de visualización: 'calendar' o 'list'
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Estado para modal de confirmación de eliminación de sesión
  const [deletingSession, setDeletingSession] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingSession, setIsDeletingSession] = useState(false);

  // Estado para modal de completado retroactivo de sesión
  const [completingSession, setCompletingSession] = useState<WorkoutSession | null>(null);

  const handleRetroComplete = async (data: { completions: Record<string, number>; overallRpe: number; notes?: string }) => {
    if (!completingSession) return;
    await saveSession(buildRetroCompletedSession(completingSession, data.completions, data.overallRpe, data.notes));
    setCompletingSession(null);
  };

  const handleConfirmDeleteSession = async () => {
    if (!deletingSession) return;
    const { id } = deletingSession;
    setIsDeletingSession(true);
    try {
      await deleteSession(id);
    } catch (err) {
      console.warn('Error al eliminar sesión:', err);
    } finally {
      setIsDeletingSession(false);
      setDeletingSession(null);
    }
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed (0 = Ene, 11 = Dic)

  // Nombre del mes en español
  const monthName = useMemo(() => {
    const name = new Date(currentYear, currentMonth, 1).toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric',
    });
    return name.charAt(0).toUpperCase() + name.slice(1);
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleGoToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(getLocalDateIsoString(now));
  };

  // Mapeo de sesiones agrupadas por día (YYYY-MM-DD)
  const sessionsByDay = useMemo(() => {
    const map = new Map<string, WorkoutSession[]>();
    sessions.forEach((s) => {
      const dateKey = s.scheduledDate || (s.startedAt ? getLocalDateIsoString(new Date(s.startedAt)) : '');
      if (!dateKey) return;
      const list = map.get(dateKey) || [];
      list.push(s);
      map.set(dateKey, list);
    });
    return map;
  }, [sessions]);

  // Mapeo de tests agrupados por día (YYYY-MM-DD)
  const testsByDay = useMemo(() => {
    const map = new Map<string, TestRecord[]>();
    tests.forEach((t) => {
      const dateKey = getLocalDateIsoString(new Date(t.testedAt));
      const list = map.get(dateKey) || [];
      list.push(t);
      map.set(dateKey, list);
    });
    return map;
  }, [tests]);

  // Cuadrícula del calendario mensual
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Ajuste para que la semana empiece en Lunes (0 = Lun, 6 = Dom)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      completedSessionsCount: number;
      scheduledSessionsCount: number;
      testsCount: number;
    }> = [];

    // Días del mes anterior
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(currentYear, currentMonth - 1, d);
      const dateStr = getLocalDateIsoString(prevDate);
      const daySessions = sessionsByDay.get(dateStr) || [];
      const dayTests = testsByDay.get(dateStr) || [];

      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayIso,
        completedSessionsCount: daySessions.filter((s) => s.status === 'completed').length,
        scheduledSessionsCount: daySessions.filter((s) => s.status === 'scheduled' || s.status === 'in_progress').length,
        testsCount: dayTests.length,
      });
    }

    // Días del mes actual
    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      const thisDate = new Date(currentYear, currentMonth, d);
      const dateStr = getLocalDateIsoString(thisDate);
      const daySessions = sessionsByDay.get(dateStr) || [];
      const dayTests = testsByDay.get(dateStr) || [];

      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayIso,
        completedSessionsCount: daySessions.filter((s) => s.status === 'completed').length,
        scheduledSessionsCount: daySessions.filter((s) => s.status === 'scheduled' || s.status === 'in_progress').length,
        testsCount: dayTests.length,
      });
    }

    // Días del mes siguiente para completar la cuadrícula (múltiplo de 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(currentYear, currentMonth + 1, d);
      const dateStr = getLocalDateIsoString(nextDate);
      const daySessions = sessionsByDay.get(dateStr) || [];
      const dayTests = testsByDay.get(dateStr) || [];

      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayIso,
        completedSessionsCount: daySessions.filter((s) => s.status === 'completed').length,
        scheduledSessionsCount: daySessions.filter((s) => s.status === 'scheduled' || s.status === 'in_progress').length,
        testsCount: dayTests.length,
      });
    }

    return days;
  }, [currentYear, currentMonth, sessionsByDay, testsByDay, todayIso]);

  // Sesiones y tests del día actualmente seleccionado
  const selectedDaySessions = useMemo(() => {
    return sessionsByDay.get(selectedDateStr) || [];
  }, [sessionsByDay, selectedDateStr]);

  const selectedDayTests = useMemo(() => {
    return testsByDay.get(selectedDateStr) || [];
  }, [testsByDay, selectedDateStr]);

  const selectedDateFormatted = useMemo(() => {
    const [year, month, day] = selectedDateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const text = d.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return text.charAt(0).toUpperCase() + text.slice(1);
  }, [selectedDateStr]);

  // Estadísticas del mes actual
  const monthStats = useMemo(() => {
    let completedWorkouts = 0;
    let totalDurationSeconds = 0;
    let testsDone = 0;
    const activeDaysSet = new Set<string>();

    calendarDays
      .filter((d) => d.isCurrentMonth)
      .forEach((d) => {
        const sList = sessionsByDay.get(d.dateStr) || [];
        const tList = testsByDay.get(d.dateStr) || [];

        sList.forEach((s) => {
          if (s.status === 'completed') {
            completedWorkouts++;
            totalDurationSeconds += s.durationSeconds;
            activeDaysSet.add(d.dateStr);
          }
        });

        if (tList.length > 0) {
          testsDone += tList.length;
          activeDaysSet.add(d.dateStr);
        }
      });

    return {
      completedWorkouts,
      totalDurationSeconds,
      testsDone,
      activeDays: activeDaysSet.size,
    };
  }, [calendarDays, sessionsByDay, testsByDay]);

  const handleStartScheduledSession = (session: WorkoutSession) => {
    startWorkout(
      session.title,
      session.blocks,
      session.id,
      session.scheduledDate
    );
    router.push('/workout/active');
  };

  const completedSessionsList = useMemo(() => {
    return sessions
      .filter((s) => s.status === 'completed')
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }, [sessions]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Cabecera Principal con Selector de Modo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-graphite-950 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-terracotta" />
            Historial y Calendario
          </h1>
          <p className="text-xs text-graphite-500 mt-0.5">
            Registro diario de tus entrenamientos realizados, planificados y tests físicos
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Selector de Vista: Calendario vs Lista */}
          <div className="flex items-center bg-chalk-200 dark:bg-graphite-850 p-1 rounded-2xl border border-chalk-300 dark:border-graphite-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-graphite-800 text-graphite-900 dark:text-white shadow-sm'
                  : 'text-graphite-500 hover:text-graphite-800'
              }`}
            >
              Calendario
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-graphite-800 text-graphite-900 dark:text-white shadow-sm'
                  : 'text-graphite-500 hover:text-graphite-800'
              }`}
            >
              Lista ({completedSessionsList.length})
            </button>
          </div>

          <Link href={`/workouts/new?date=${selectedDateStr}`}>
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-1 stroke-[2.5]" />
              Planificar
            </Button>
          </Link>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <>
          {/* Barra de Estadísticas del Mes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white dark:bg-graphite-900 p-3 rounded-2xl border border-chalk-300 dark:border-graphite-800 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-moss-100 dark:bg-moss-900/40 text-moss flex items-center justify-center shrink-0">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-graphite-500 font-semibold">Sesiones Hechas</div>
                <div className="font-mono font-black text-base text-graphite-900 dark:text-white">
                  {monthStats.completedWorkouts}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-graphite-900 p-3 rounded-2xl border border-chalk-300 dark:border-graphite-800 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-terracotta-100 dark:bg-terracotta-900/40 text-terracotta flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-graphite-500 font-semibold">Tiempo Entrenado</div>
                <div className="font-mono font-black text-base text-graphite-900 dark:text-white">
                  {formatDurationHuman(monthStats.totalDurationSeconds)}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-graphite-900 p-3 rounded-2xl border border-chalk-300 dark:border-graphite-800 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-graphite-500 font-semibold">Tests Físicos</div>
                <div className="font-mono font-black text-base text-graphite-900 dark:text-white">
                  {monthStats.testsDone}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-graphite-900 p-3 rounded-2xl border border-chalk-300 dark:border-graphite-800 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-graphite-500 font-semibold">Días Activos</div>
                <div className="font-mono font-black text-base text-graphite-900 dark:text-white">
                  {monthStats.activeDays} días
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta del Calendario */}
          <div className="bg-white dark:bg-graphite-900 p-4 sm:p-5 rounded-3xl border border-chalk-300 dark:border-graphite-800 shadow-sm space-y-4">
            {/* Navegación del Mes */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-graphite-900 dark:text-white">
                {monthName}
              </h2>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleGoToToday}
                  className="px-2.5 py-1 text-xs font-bold rounded-xl bg-chalk-100 dark:bg-graphite-800 hover:bg-terracotta hover:text-white text-graphite-700 dark:text-graphite-300 transition-colors"
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="Mes anterior"
                  className="p-1.5 rounded-xl text-graphite-600 hover:bg-chalk-100 dark:hover:bg-graphite-800 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="Mes siguiente"
                  className="p-1.5 rounded-xl text-graphite-600 hover:bg-chalk-100 dark:hover:bg-graphite-800 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Cabecera de Días de la Semana */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS.map((wd) => (
                <div
                  key={wd}
                  className="text-[11px] font-bold uppercase tracking-wider text-graphite-500 py-1"
                >
                  {wd}
                </div>
              ))}
            </div>

            {/* Cuadrícula de Días */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {calendarDays.map((d) => {
                const isSelected = d.dateStr === selectedDateStr;
                const hasCompleted = d.completedSessionsCount > 0;
                const hasScheduled = d.scheduledSessionsCount > 0;
                const hasTests = d.testsCount > 0;

                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => setSelectedDateStr(d.dateStr)}
                    className={`min-h-[58px] sm:min-h-[72px] p-1.5 rounded-2xl border transition-all flex flex-col justify-between items-center text-center relative ${
                      isSelected
                        ? 'border-terracotta bg-terracotta-50/70 dark:bg-terracotta-950/40 ring-2 ring-terracotta shadow-sm'
                        : d.isToday
                        ? 'border-terracotta/40 bg-chalk-50 dark:bg-graphite-850 font-bold'
                        : d.isCurrentMonth
                        ? 'border-chalk-200 dark:border-graphite-800 bg-white dark:bg-graphite-900 hover:border-chalk-300'
                        : 'border-transparent bg-chalk-100/40 dark:bg-graphite-900/30 text-graphite-400 opacity-60'
                    }`}
                  >
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        d.isToday
                          ? 'bg-terracotta text-white'
                          : isSelected
                          ? 'text-terracotta font-black'
                          : d.isCurrentMonth
                          ? 'text-graphite-900 dark:text-graphite-100'
                          : 'text-graphite-400'
                      }`}
                    >
                      {d.dayNumber}
                    </span>

                    {/* Indicadores de Actividad */}
                    <div className="flex items-center gap-1 mt-1 flex-wrap justify-center">
                      {hasCompleted && (
                        <span
                          className="w-2 h-2 rounded-full bg-moss"
                          title="Entrenamiento completado"
                        />
                      )}
                      {hasScheduled && (
                        <span
                          className="w-2 h-2 rounded-full bg-terracotta"
                          title="Entrenamiento planificado"
                        />
                      )}
                      {hasTests && (
                        <span
                          className="w-2 h-2 rounded-full bg-blue-500"
                          title="Test físico realizado"
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Leyenda de Colores */}
            <div className="pt-2 border-t border-chalk-200 dark:border-graphite-800 flex items-center justify-center gap-4 text-xs text-graphite-500 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-moss" />
                <span>Entreno completado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-terracotta" />
                <span>Sesión planificada</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Test físico</span>
              </div>
            </div>
          </div>

          {/* Panel de Detalle del Día Seleccionado */}
          <div className="bg-white dark:bg-graphite-900 p-5 rounded-3xl border border-chalk-300 dark:border-graphite-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-chalk-200 dark:border-graphite-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-graphite-500">
                  Actividad del día:
                </span>
                <h3 className="text-lg font-black text-graphite-900 dark:text-white capitalize">
                  {selectedDateFormatted}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/workouts/new?date=${selectedDateStr}`}>
                  <Button variant="outline" size="sm">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Planificar Sesión
                  </Button>
                </Link>
                <Link href={`/tests/new?date=${selectedDateStr}`}>
                  <Button variant="outline" size="sm">
                    <Activity className="w-3.5 h-3.5 mr-1 text-blue-500" />
                    Registrar Test
                  </Button>
                </Link>
              </div>
            </div>

            {/* Lista de Sesiones de Entrenamiento del Día */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-graphite-700 dark:text-graphite-300 flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4 text-terracotta" />
                Entrenamientos ({selectedDaySessions.length})
              </h4>

              {selectedDaySessions.length > 0 ? (
                <div className="space-y-2.5">
                  {selectedDaySessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-4 rounded-2xl bg-chalk-50 dark:bg-graphite-850 border border-chalk-200 dark:border-graphite-750 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-bold text-base text-graphite-900 dark:text-white">
                            {session.title}
                          </h5>
                          {session.status === 'completed' ? (
                            <span className="text-[10px] font-bold bg-moss-100 dark:bg-moss-950/40 text-moss px-2 py-0.5 rounded-md flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Completado
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-terracotta-100 dark:bg-terracotta-950/40 text-terracotta px-2 py-0.5 rounded-md flex items-center gap-1">
                              <CalendarCheck className="w-3 h-3" />
                              Planificado
                            </span>
                          )}
                          {session.overallRpe && (
                            <Badge variant="terracotta" size="sm">
                              RPE {session.overallRpe}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-graphite-500 font-medium">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-terracotta" />
                            {formatDurationHuman(session.durationSeconds)}
                          </span>
                          <span>&bull;</span>
                          <span>{session.blocks.length} {session.blocks.length === 1 ? 'ejercicio' : 'ejercicios'}</span>
                        </div>

                        {session.notes && (
                          <p className="text-xs text-graphite-600 dark:text-graphite-400 italic pt-1">
                            &ldquo;{session.notes}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setDeletingSession({ id: session.id, title: session.title })}
                          title="Eliminar sesión"
                          aria-label="Eliminar sesión"
                          className="text-xs font-bold text-red-600 hover:text-red-700 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <Link href={`/workouts/new?copyFrom=${session.id}&date=${todayIso}`}>
                          <Button variant="outline" size="sm" title="Copiar los ejercicios a otro día">
                            <Copy className="w-3.5 h-3.5 mr-1" />
                            Copiar
                          </Button>
                        </Link>

                        {session.status === 'completed' ? (
                          <Link href={`/history/${session.id}`}>
                            <Button variant="outline" size="sm">
                              Ver Detalle
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </Link>
                        ) : (
                          <>
                            <Link href={`/workouts/new?sessionId=${session.id}`}>
                              <Button variant="outline" size="sm">
                                <Edit2 className="w-3.5 h-3.5 mr-1" />
                                Editar
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCompletingSession(session)}
                              title="Marcar como completada sin usar el temporizador"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-moss" />
                              Marcar Hecha
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleStartScheduledSession(session)}
                            >
                              <Play className="w-3.5 h-3.5 mr-1 fill-current" />
                              Iniciar Sesión
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-chalk-100/60 dark:bg-graphite-850/40 text-xs text-graphite-500">
                  Sin entrenamientos registrados en este día.
                </div>
              )}
            </div>

            {/* Lista de Tests Físicos del Día */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-graphite-700 dark:text-graphite-300 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-500" />
                Tests Físicos ({selectedDayTests.length})
              </h4>

              {selectedDayTests.length > 0 ? (
                <div className="space-y-2.5">
                  {selectedDayTests.map((t) => {
                    const prev = getPreviousTest(t.title, t.testedAt);
                    const delta = calculateTestDelta(t.value, prev?.value, t.unit, t.targetMetric);
                    const fatigue = calculateTestFatigue(t.sets, t.targetMetric);

                    return (
                      <div
                        key={t.id}
                        className="p-4 rounded-2xl bg-chalk-50 dark:bg-graphite-850 border border-chalk-200 dark:border-graphite-750 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-base text-graphite-900 dark:text-white">
                              {t.title}
                            </h5>
                            {t.targetMetric === 'lower_is_better' && (
                              <span className="text-[10px] font-bold bg-chalk-200 dark:bg-graphite-800 text-graphite-600 dark:text-graphite-400 px-2 py-0.5 rounded-md">
                                ↓ Menos es mejor
                              </span>
                            )}
                            {fatigue && fatigue.totalSets > 1 && (
                              <span className="text-[10px] font-mono font-bold bg-terracotta-100 dark:bg-terracotta-950/40 text-terracotta px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                {fatigue.totalSets} series
                              </span>
                            )}
                          </div>

                          {t.protocol && (
                            <p className="text-xs text-graphite-500">{t.protocol}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-mono font-black text-lg text-terracotta">
                              {t.value} <span className="text-xs font-normal text-graphite-500">{t.unit}</span>
                            </div>
                            {delta && (
                              <div>
                                {delta.isNeutral ? (
                                  <span className="text-[11px] text-graphite-400 font-mono">Sin cambio</span>
                                ) : delta.isImprovement ? (
                                  <span className="text-[11px] text-moss font-mono font-bold flex items-center gap-0.5 justify-end">
                                    <TrendingUp className="w-3 h-3" />
                                    {delta.formatted}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-red-500 font-mono font-bold flex items-center gap-0.5 justify-end">
                                    <TrendingDown className="w-3 h-3" />
                                    {delta.formatted}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <Link href="/tests">
                            <Button variant="outline" size="sm">
                              Ver Tests
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-chalk-100/60 dark:bg-graphite-850/40 text-xs text-graphite-500">
                  Sin tests registrados en este día.
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Vista de Lista Completa */
        <div className="space-y-3">
          {completedSessionsList.length > 0 ? (
            completedSessionsList.map((session) => {
              const dateObj = new Date(session.startedAt);
              const dateStr = dateObj.toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              });

              return (
                <div
                  key={session.id}
                  className="p-4 rounded-2xl bg-white dark:bg-graphite-900 border border-chalk-300 dark:border-graphite-800 shadow-sm hover:border-terracotta/60 transition-all block group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/history/${session.id}`} className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="font-bold text-base text-graphite-900 dark:text-graphite-100 truncate group-hover:text-terracotta transition-colors">
                          {session.title}
                        </h2>
                        {session.overallRpe && (
                          <Badge variant="terracotta" size="sm">
                            RPE {session.overallRpe}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-graphite-500">
                        <span className="capitalize">{dateStr}</span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-terracotta" />
                          {formatDurationHuman(session.durationSeconds)}
                        </span>
                        <span>&bull;</span>
                        <span>{session.blocks.length} bloques</span>
                      </div>

                      {session.notes && (
                        <p className="text-xs text-graphite-600 dark:text-graphite-400 mt-2 bg-chalk-100 dark:bg-graphite-800/80 p-2 rounded-xl flex items-start gap-1.5 line-clamp-2">
                          <StickyNote className="w-3.5 h-3.5 text-terracotta shrink-0 mt-0.5" />
                          <span>{session.notes}</span>
                        </p>
                      )}
                    </Link>

                    <div className="flex items-center gap-1.5 shrink-0 mt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeletingSession({ id: session.id, title: session.title });
                        }}
                        title="Eliminar sesión"
                        aria-label="Eliminar sesión"
                        className="text-xs font-bold text-red-600 hover:text-red-700 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <Link
                        href={`/workouts/new?copyFrom=${session.id}&date=${todayIso}`}
                        onClick={(e) => e.stopPropagation()}
                        title="Copiar los ejercicios a otro día"
                        aria-label="Copiar sesión"
                        className="text-graphite-400 hover:text-terracotta p-2 rounded-xl hover:bg-terracotta-50 dark:hover:bg-terracotta-950/30 transition-colors flex items-center justify-center"
                      >
                        <Copy className="w-4 h-4" />
                      </Link>

                      <Link href={`/history/${session.id}`}>
                        <div className="p-1 rounded-lg text-graphite-400 group-hover:text-terracotta group-hover:translate-x-0.5 transition-all">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center bg-white dark:bg-graphite-900 rounded-3xl border border-chalk-300 dark:border-graphite-800 space-y-4">
              <Trophy className="w-12 h-12 text-graphite-300 dark:text-graphite-600 mx-auto" />
              <div>
                <h3 className="font-bold text-base text-graphite-800 dark:text-graphite-200">
                  Sin entrenamientos registrados
                </h3>
                <p className="text-xs text-graphite-500 max-w-xs mx-auto mt-1">
                  Las sesiones que completes aparecerán aquí con el desglose de cada serie y tus sensaciones.
                </p>
              </div>
              <Link href="/workouts/new">
                <Button variant="primary">Comenzar a entrenar</Button>
              </Link>
            </div>
          )}
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

      {/* Modal de Completado Retroactivo de Sesión */}
      <CompleteSessionRetroModal
        isOpen={Boolean(completingSession)}
        session={completingSession}
        onSave={handleRetroComplete}
        onCancel={() => setCompletingSession(null)}
      />
    </div>
  );
}
