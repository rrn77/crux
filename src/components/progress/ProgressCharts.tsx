'use client';

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Activity, Calendar, Clock, BarChart3, TrendingUp } from 'lucide-react';
import { useTestStore } from '@/lib/store/testStore';
import { useWorkoutStore } from '@/lib/store/workoutStore';
import { formatDurationHuman } from '@/lib/timer/durationHelper';

type TimeFilter = '4w' | '3m' | '1y';

export function ProgressCharts() {
  const { tests, getUniqueTitles } = useTestStore();
  const { sessions } = useWorkoutStore();

  const uniqueTitles = getUniqueTitles();
  const [selectedTestTitle, setSelectedTestTitle] = useState<string>(
    uniqueTitles[0] || 'Suspensiones 20 mm (Lastre máx)'
  );
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('3m');

  // Filtrado temporal en milisegundos
  const filterCutoffDate = useMemo(() => {
    const now = Date.now();
    if (timeFilter === '4w') return now - 4 * 7 * 86400000;
    if (timeFilter === '3m') return now - 90 * 86400000;
    return now - 365 * 86400000;
  }, [timeFilter]);

  // Datos para la gráfica de evolución del test seleccionado
  const testChartData = useMemo(() => {
    return tests
      .filter((t) => t.title.toLowerCase().trim() === selectedTestTitle.toLowerCase().trim())
      .filter((t) => new Date(t.testedAt).getTime() >= filterCutoffDate)
      .sort((a, b) => new Date(a.testedAt).getTime() - new Date(b.testedAt).getTime())
      .map((t) => {
        const dateObj = new Date(t.testedAt);
        const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
        return {
          date: formattedDate,
          fullDate: dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
          valor: Number(t.value),
          unit: t.unit,
          notes: t.notes || '',
        };
      });
  }, [tests, selectedTestTitle, filterCutoffDate]);

  // Datos para el volumen de entrenamiento agrupado por semana
  const volumeChartData = useMemo(() => {
    const filteredSessions = sessions.filter(
      (s) => new Date(s.startedAt).getTime() >= filterCutoffDate && s.status === 'completed'
    );

    // Agrupar por semana
    const weeksMap = new Map<string, { weekLabel: string; sesiones: number; duracionMin: number }>();

    filteredSessions.forEach((session) => {
      const date = new Date(session.startedAt);
      // Calcular número de semana o fecha de inicio de semana
      const startOfWeek = new Date(date);
      const day = startOfWeek.getDay() || 7;
      startOfWeek.setDate(startOfWeek.getDate() - day + 1);
      const key = `${startOfWeek.getDate()}/${startOfWeek.getMonth() + 1}`;

      const existing = weeksMap.get(key) || { weekLabel: `Sem ${key}`, sesiones: 0, duracionMin: 0 };
      existing.sesiones += 1;
      existing.duracionMin += Math.round(session.durationSeconds / 60);
      weeksMap.set(key, existing);
    });

    return Array.from(weeksMap.values());
  }, [sessions, filterCutoffDate]);

  // Totales acumulados
  const totalCompletedSessions = sessions.filter((s) => s.status === 'completed').length;
  const totalTrainingSeconds = sessions
    .filter((s) => s.status === 'completed')
    .reduce((acc, s) => acc + (s.durationSeconds || 0), 0);

  return (
    <div className="space-y-6">
      {/* Selector de Filtro Temporal */}
      <div className="flex items-center justify-between bg-white dark:bg-graphite-900 p-2 rounded-2xl border border-chalk-300 dark:border-graphite-800">
        <span className="text-xs font-semibold text-graphite-500 dark:text-graphite-400 pl-2">
          Periodo de análisis:
        </span>
        <div className="flex items-center gap-1">
          {(['4w', '3m', '1y'] as TimeFilter[]).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setTimeFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeFilter === filter
                  ? 'bg-terracotta text-white shadow-sm'
                  : 'text-graphite-600 dark:text-graphite-400 hover:bg-chalk-100 dark:hover:bg-graphite-800'
              }`}
            >
              {filter === '4w' ? '4 Semanas' : filter === '3m' ? '3 Meses' : '1 Año'}
            </button>
          ))}
        </div>
      </div>

      {/* Tarjetas de Resumen Global */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-graphite-900 p-4 rounded-2xl border border-chalk-300 dark:border-graphite-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-terracotta-100 dark:bg-terracotta-900/40 text-terracotta flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-graphite-900 dark:text-graphite-100 font-mono">
              {totalCompletedSessions}
            </div>
            <div className="text-xs text-graphite-500 font-medium">Sesiones registradas</div>
          </div>
        </div>

        <div className="bg-white dark:bg-graphite-900 p-4 rounded-2xl border border-chalk-300 dark:border-graphite-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-moss-100 dark:bg-moss-900/40 text-moss flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-graphite-900 dark:text-graphite-100 font-mono">
              {formatDurationHuman(totalTrainingSeconds)}
            </div>
            <div className="text-xs text-graphite-500 font-medium">Tiempo total activo</div>
          </div>
        </div>
      </div>

      {/* Gráfica 1: Evolución de Tests Físicos */}
      <div className="bg-white dark:bg-graphite-900 p-4 sm:p-5 rounded-2xl border border-chalk-300 dark:border-graphite-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-terracotta" />
              <h3 className="font-bold text-base text-graphite-900 dark:text-graphite-100">
                Evolución de Tests
              </h3>
            </div>
            <p className="text-xs text-graphite-500 mt-0.5">Progreso en marcas y benchmarks reales</p>
          </div>

          {/* Selector de Test */}
          {uniqueTitles.length > 0 && (
            <select
              value={selectedTestTitle}
              onChange={(e) => setSelectedTestTitle(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-chalk-100 dark:bg-graphite-800 border border-chalk-300 dark:border-graphite-700 text-graphite-800 dark:text-graphite-200 focus:outline-none focus:ring-2 focus:ring-terracotta"
            >
              {uniqueTitles.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          )}
        </div>

        {uniqueTitles.length > 0 && testChartData.length > 0 ? (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={testChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#888' }}
                  tickLine={false}
                  axisLine={{ stroke: '#ccc' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#888' }}
                  tickLine={false}
                  axisLine={{ stroke: '#ccc' }}
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-graphite-900 text-white p-2.5 rounded-xl text-xs shadow-lg border border-graphite-700">
                          <div className="font-semibold text-graphite-300">{data.fullDate}</div>
                          <div className="text-base font-black text-terracotta mt-1">
                            {data.valor} {data.unit}
                          </div>
                          {data.notes && (
                            <div className="text-[11px] text-graphite-400 mt-1 italic max-w-xs">
                              {data.notes}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="valor"
                  name={selectedTestTitle}
                  stroke="#D9532F"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#D9532F', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, fill: '#D9532F' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-10 text-center space-y-3">
            <p className="text-graphite-500 text-xs">
              {uniqueTitles.length === 0
                ? 'Aún no has registrado tests físicos ni benchmarks.'
                : `No hay registros de "${selectedTestTitle}" en el periodo seleccionado.`}
            </p>
            {uniqueTitles.length === 0 && (
              <a
                href="/tests/new"
                className="inline-flex items-center gap-1 text-xs font-bold text-terracotta hover:underline"
              >
                + Registrar mi primer test
              </a>
            )}
          </div>
        )}
      </div>

      {/* Gráfica 2: Volumen Semanal de Entrenamiento */}
      <div className="bg-white dark:bg-graphite-900 p-4 sm:p-5 rounded-2xl border border-chalk-300 dark:border-graphite-800 shadow-sm space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-moss" />
            <h3 className="font-bold text-base text-graphite-900 dark:text-graphite-100">
              Volumen de Entrenamiento Semanal
            </h3>
          </div>
          <p className="text-xs text-graphite-500 mt-0.5">Minutos totales entrenados por semana</p>
        </div>

        {volumeChartData.length > 0 ? (
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                <XAxis
                  dataKey="weekLabel"
                  tick={{ fontSize: 11, fill: '#888' }}
                  tickLine={false}
                  axisLine={{ stroke: '#ccc' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#888' }}
                  tickLine={false}
                  axisLine={{ stroke: '#ccc' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-graphite-900 text-white p-2.5 rounded-xl text-xs shadow-lg border border-graphite-700">
                          <div className="font-semibold text-graphite-300">{data.weekLabel}</div>
                          <div className="text-base font-black text-moss mt-1">
                            {data.duracionMin} minutos ({data.sesiones} {data.sesiones === 1 ? 'sesión' : 'sesiones'})
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="duracionMin"
                  name="Minutos"
                  fill="#4E8252"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-12 text-center text-graphite-400 text-xs">
            No hay sesiones completadas en el periodo seleccionado.
          </div>
        )}
      </div>
    </div>
  );
}
