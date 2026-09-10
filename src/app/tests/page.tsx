'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Activity,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Trash2,
  Filter,
  CheckCircle2,
  Dumbbell,
} from 'lucide-react';
import { useTestStore, calculateTestDelta } from '@/lib/store/testStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function TestsPage() {
  const { tests, getPreviousTest, deleteTest, getUniqueTitles } = useTestStore();
  const [selectedExerciseFilter, setSelectedExerciseFilter] = useState<string>('all');

  const uniqueTitles = getUniqueTitles();

  // Filtrar tests si se selecciona un ejercicio específico
  const filteredTests = useMemo(() => {
    if (selectedExerciseFilter === 'all') return tests;
    return tests.filter(
      (t) => t.title.toLowerCase().trim() === selectedExerciseFilter.toLowerCase().trim()
    );
  }, [tests, selectedExerciseFilter]);

  // Agrupar tests por día (fecha) ordenados de más reciente a más antiguo
  const groupedByDay = useMemo(() => {
    const groups: {
      [key: string]: {
        dateKey: string;
        fullDate: string;
        items: typeof tests;
      };
    } = {};

    const sorted = [...filteredTests].sort(
      (a, b) => new Date(b.testedAt).getTime() - new Date(a.testedAt).getTime()
    );

    sorted.forEach((test) => {
      const d = new Date(test.testedAt);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      if (!groups[dateKey]) {
        const fullDate = d.toLocaleDateString('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        groups[dateKey] = {
          dateKey,
          fullDate: fullDate.charAt(0).toUpperCase() + fullDate.slice(1),
          items: [],
        };
      }
      groups[dateKey].items.push(test);
    });

    return Object.values(groups);
  }, [filteredTests]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Cabecera Principal */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-graphite-950 dark:text-white">
            Tests y Benchmarks
          </h1>
          <p className="text-xs text-graphite-500 mt-0.5">
            {tests.length} {tests.length === 1 ? 'registro' : 'registros'} evaluados en {groupedByDay.length} {groupedByDay.length === 1 ? 'día' : 'días'}
          </p>
        </div>

        <Link href="/tests/new">
          <Button variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-1 stroke-[2.5]" />
            Nuevo Test
          </Button>
        </Link>
      </div>

      {/* Filtro por Ejercicio (si existen ejercicios registrados) */}
      {uniqueTitles.length > 1 && (
        <div className="flex items-center gap-2 bg-white dark:bg-graphite-900 p-2 rounded-2xl border border-chalk-300 dark:border-graphite-800 overflow-x-auto">
          <div className="flex items-center gap-1 text-xs font-semibold text-graphite-500 pl-2 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtrar ejercicio:</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedExerciseFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedExerciseFilter === 'all'
                ? 'bg-terracotta text-white shadow-sm'
                : 'text-graphite-600 dark:text-graphite-400 hover:bg-chalk-100 dark:hover:bg-graphite-800'
            }`}
          >
            Todos los días ({tests.length})
          </button>
          {uniqueTitles.map((title) => (
            <button
              key={title}
              type="button"
              onClick={() => setSelectedExerciseFilter(title)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedExerciseFilter.toLowerCase() === title.toLowerCase()
                  ? 'bg-terracotta text-white shadow-sm'
                  : 'text-graphite-600 dark:text-graphite-400 hover:bg-chalk-100 dark:hover:bg-graphite-800'
              }`}
            >
              {title}
            </button>
          ))}
        </div>
      )}

      {/* Listado Agrupado por Día */}
      {groupedByDay.length > 0 ? (
        <div className="space-y-6">
          {groupedByDay.map((dayGroup) => (
            <div
              key={dayGroup.dateKey}
              className="bg-white dark:bg-graphite-900 rounded-3xl border border-chalk-300 dark:border-graphite-800 shadow-sm overflow-hidden"
            >
              {/* Cabecera del Día */}
              <div className="bg-chalk-100 dark:bg-graphite-850 px-5 py-3.5 border-b border-chalk-200 dark:border-graphite-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-terracotta-100 dark:bg-terracotta-900/40 text-terracotta flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="font-black text-sm text-graphite-900 dark:text-white">
                    {dayGroup.fullDate}
                  </span>
                </div>
                <Badge variant="neutral" size="sm">
                  {dayGroup.items.length} {dayGroup.items.length === 1 ? 'ejercicio' : 'ejercicios'}
                </Badge>
              </div>

              {/* Lista de Ejercicios del Día */}
              <div className="divide-y divide-chalk-200 dark:divide-graphite-800 p-2 sm:p-3 space-y-1">
                {dayGroup.items.map((test) => {
                  // Seguimiento por ejercicio: comparar con la prueba ANTERIOR de ese mismo ejercicio
                  const previousTest = getPreviousTest(test.title, test.testedAt);
                  const delta = calculateTestDelta(test.value, previousTest?.value, test.unit);

                  return (
                    <div
                      key={test.id}
                      className="p-3.5 rounded-2xl hover:bg-chalk-50 dark:hover:bg-graphite-850/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      {/* Información del Ejercicio */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-graphite-900 dark:text-graphite-100 truncate">
                            {test.title}
                          </h3>
                        </div>

                        {test.protocol && (
                          <p className="text-xs text-graphite-500 line-clamp-1">{test.protocol}</p>
                        )}

                        {test.notes && (
                          <p className="text-xs text-graphite-600 dark:text-graphite-400 bg-chalk-100 dark:bg-graphite-800/80 px-2.5 py-1 rounded-xl italic inline-block mt-1">
                            &ldquo;{test.notes}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Valor Numérico y Seguimiento Individual */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-chalk-100 dark:border-graphite-800">
                        <div className="flex flex-col items-start sm:items-end">
                          {/* Marca obtenida */}
                          <div className="text-xl sm:text-2xl font-black font-mono text-terracotta dark:text-terracotta-400 leading-none">
                            {test.value}{' '}
                            <span className="text-xs font-semibold text-graphite-500 font-sans">
                              {test.unit}
                            </span>
                          </div>

                          {/* Delta frente al anterior de este mismo ejercicio */}
                          <div className="mt-1">
                            {delta ? (
                              delta.isPositive ? (
                                <span className="text-moss dark:text-moss-400 font-mono font-bold text-[11px] flex items-center gap-0.5 bg-moss-50 dark:bg-moss-900/30 px-2 py-0.5 rounded-md">
                                  <TrendingUp className="w-3 h-3" />
                                  {delta.formatted}
                                </span>
                              ) : delta.isNeutral ? (
                                <span className="text-graphite-500 font-mono font-medium text-[11px] flex items-center gap-0.5 bg-chalk-200 dark:bg-graphite-800 px-2 py-0.5 rounded-md">
                                  <Minus className="w-3 h-3" />
                                  Sin cambio
                                </span>
                              ) : (
                                <span className="text-red-500 font-mono font-bold text-[11px] flex items-center gap-0.5 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-md">
                                  <TrendingDown className="w-3 h-3" />
                                  {delta.formatted}
                                </span>
                              )
                            ) : (
                              <span className="text-[10px] text-graphite-400 italic">
                                Primera referencia
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botón Eliminar Registro */}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`¿Eliminar la marca de "${test.title}"?`)) {
                              deleteTest(test.id);
                            }
                          }}
                          aria-label={`Eliminar marca de ${test.title}`}
                          className="p-2 text-graphite-400 hover:text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-graphite-900 rounded-3xl border border-chalk-300 dark:border-graphite-800 space-y-4">
          <Activity className="w-12 h-12 text-graphite-300 dark:text-graphite-600 mx-auto" />
          <div>
            <h3 className="font-bold text-base text-graphite-800 dark:text-graphite-200">
              No hay tests registrados
            </h3>
            <p className="text-xs text-graphite-500 max-w-xs mx-auto mt-1">
              Registra tus marcas de suspensiones, dominadas con lastre o bloques para evaluar tu progreso agrupado por días de test.
            </p>
          </div>
          <Link href="/tests/new">
            <Button variant="primary">Crear primer test</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
