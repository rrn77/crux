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
  Edit2,
  ChevronUp,
  ChevronDown,
  Filter,
  CheckCircle2,
  Dumbbell,
  Zap,
  Layers,
} from 'lucide-react';
import { useTestStore, calculateTestDelta, calculateTestFatigue } from '@/lib/store/testStore';
import { TestRecord } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EditTestModal } from '@/components/test/EditTestModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

export default function TestsPage() {
  const { tests, getPreviousTest, updateTest, deleteTest, getUniqueTitles } = useTestStore();
  const [selectedExerciseFilter, setSelectedExerciseFilter] = useState<string>('all');
  const [editingTest, setEditingTest] = useState<TestRecord | null>(null);
  const [deletingTest, setDeletingTest] = useState<TestRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deletingTest) return;
    setIsDeleting(true);
    try {
      await deleteTest(deletingTest.id);
    } catch (err) {
      console.warn('Error al eliminar test:', err);
    } finally {
      setIsDeleting(false);
      setDeletingTest(null);
    }
  };

  const handleMoveTest = async (items: TestRecord[], currentIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const [movedItem] = newItems.splice(currentIndex, 1);
    newItems.splice(targetIndex, 0, movedItem);

    const firstDate = new Date(newItems[0].testedAt);
    const year = firstDate.getFullYear();
    const month = firstDate.getMonth();
    const day = firstDate.getDate();

    for (let idx = 0; idx < newItems.length; idx++) {
      const item = newItems[idx];
      const newTestedAt = new Date(year, month, day, 10, idx, 0, 0).toISOString();
      if (item.testedAt !== newTestedAt) {
        await updateTest(item.id, { testedAt: newTestedAt });
      }
    }
  };

  const uniqueTitles = getUniqueTitles();

  // Filtrar tests si se selecciona un ejercicio específico
  const filteredTests = useMemo(() => {
    if (selectedExerciseFilter === 'all') return tests;
    return tests.filter(
      (t) => t.title.toLowerCase().trim() === selectedExerciseFilter.toLowerCase().trim()
    );
  }, [tests, selectedExerciseFilter]);

  // Agrupar tests por día (fecha) ordenados de más reciente a más antiguo, y dentro de cada día orden cronológico
  const groupedByDay = useMemo(() => {
    const groups: {
      [key: string]: {
        dateKey: string;
        fullDate: string;
        items: typeof tests;
      };
    } = {};

    filteredTests.forEach((test) => {
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

    // Ordenar ejercicios dentro de cada día por orden de ejecución (#1 primero, #2 segundo...)
    Object.values(groups).forEach((group) => {
      group.items.sort((a, b) => {
        const timeA = new Date(a.testedAt).getTime();
        const timeB = new Date(b.testedAt).getTime();
        if (timeA !== timeB) return timeA - timeB;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    });

    // Ordenar días de más reciente a más antiguo
    return Object.values(groups).sort(
      (a, b) => new Date(b.dateKey).getTime() - new Date(a.dateKey).getTime()
    );
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
                {dayGroup.items.map((test, index) => {
                  // Seguimiento por ejercicio: comparar con la prueba ANTERIOR de ese mismo ejercicio
                  const previousTest = getPreviousTest(test.title, test.testedAt);
                  const effectiveTargetMetric =
                    test.targetMetric ||
                    (test.unit?.toLowerCase() === 'mm' || test.title?.toLowerCase().includes('mm')
                      ? 'lower_is_better'
                      : 'higher_is_better');

                  const delta = calculateTestDelta(
                    test.value,
                    previousTest?.value,
                    test.unit,
                    effectiveTargetMetric
                  );
                  const fatigue = calculateTestFatigue(test.sets, effectiveTargetMetric);

                  return (
                    <div
                      key={test.id}
                      className="p-3.5 rounded-2xl hover:bg-chalk-50 dark:hover:bg-graphite-850/50 transition-colors flex flex-col gap-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Información del Ejercicio */}
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="w-6 h-6 rounded-lg bg-chalk-200 dark:bg-graphite-800 text-graphite-700 dark:text-graphite-300 font-mono font-black text-xs flex items-center justify-center shrink-0 border border-chalk-300/60 dark:border-graphite-700"
                              title={`Ejercicio #${index + 1} del día`}
                            >
                              #{index + 1}
                            </span>
                            <h3 className="font-bold text-base text-graphite-900 dark:text-graphite-100 truncate">
                              {test.title}
                            </h3>
                            {effectiveTargetMetric === 'lower_is_better' ? (
                              <span
                                className="text-[10px] font-bold bg-chalk-200 dark:bg-graphite-800 text-graphite-600 dark:text-graphite-400 px-2 py-0.5 rounded-md flex items-center gap-0.5 border border-chalk-300/60 dark:border-graphite-700"
                                title="En este test, reducir el valor es una mejora (ej: regleta más pequeña)"
                              >
                                ↓ Menos es mejor
                              </span>
                            ) : null}
                            {fatigue && fatigue.totalSets > 1 && (
                              <span className="text-[10px] font-mono font-bold bg-terracotta-100 dark:bg-terracotta-950/40 text-terracotta px-2 py-0.5 rounded-md flex items-center gap-1 border border-terracotta-200 dark:border-terracotta-900/50">
                                <Zap className="w-3 h-3" />
                                {fatigue.totalSets} series
                              </span>
                            )}
                          </div>

                          <div className="pl-8.5">
                            {test.protocol && (
                              <p className="text-xs text-graphite-500 line-clamp-1">{test.protocol}</p>
                            )}

                            {test.notes && (
                              <p className="text-xs text-graphite-600 dark:text-graphite-400 bg-chalk-100 dark:bg-graphite-800/80 px-2.5 py-1 rounded-xl italic inline-block mt-1">
                                &ldquo;{test.notes}&rdquo;
                              </p>
                            )}
                          </div>
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
                                delta.isNeutral ? (
                                  <span className="text-graphite-500 font-mono font-medium text-[11px] flex items-center gap-0.5 bg-chalk-200 dark:bg-graphite-800 px-2 py-0.5 rounded-md">
                                    <Minus className="w-3 h-3" />
                                    Sin cambio
                                  </span>
                                ) : delta.isImprovement ? (
                                  <span
                                    className="text-moss dark:text-moss-400 font-mono font-bold text-[11px] flex items-center gap-0.5 bg-moss-50 dark:bg-moss-900/30 px-2 py-0.5 rounded-md"
                                    title="Mejora de rendimiento"
                                  >
                                    {delta.isPositive ? (
                                      <TrendingUp className="w-3 h-3" />
                                    ) : (
                                      <TrendingDown className="w-3 h-3" />
                                    )}
                                    {delta.formatted}
                                  </span>
                                ) : (
                                  <span
                                    className="text-red-500 font-mono font-bold text-[11px] flex items-center gap-0.5 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-md"
                                    title="Empeoramiento de rendimiento"
                                  >
                                    {delta.isPositive ? (
                                      <TrendingUp className="w-3 h-3" />
                                    ) : (
                                      <TrendingDown className="w-3 h-3" />
                                    )}
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

                          {/* Botones de Acción: Reordenar, Editar y Eliminar */}
                          <div className="flex items-center gap-1.5">
                            {/* Controles para cambiar el orden en el día */}
                            {dayGroup.items.length > 1 && (
                              <div className="flex items-center bg-chalk-100 dark:bg-graphite-800/80 p-0.5 rounded-xl border border-chalk-200 dark:border-graphite-700/60">
                                <button
                                  type="button"
                                  onClick={() => handleMoveTest(dayGroup.items, index, 'up')}
                                  disabled={index === 0}
                                  aria-label={`Subir orden de ${test.title}`}
                                  title="Mover arriba en el orden del día"
                                  className="p-1.5 text-graphite-500 hover:text-terracotta dark:text-graphite-400 dark:hover:text-terracotta-400 rounded-lg hover:bg-white dark:hover:bg-graphite-700 disabled:opacity-20 disabled:pointer-events-none transition-all"
                                >
                                  <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveTest(dayGroup.items, index, 'down')}
                                  disabled={index === dayGroup.items.length - 1}
                                  aria-label={`Bajar orden de ${test.title}`}
                                  title="Mover abajo en el orden del día"
                                  className="p-1.5 text-graphite-500 hover:text-terracotta dark:text-graphite-400 dark:hover:text-terracotta-400 rounded-lg hover:bg-white dark:hover:bg-graphite-700 disabled:opacity-20 disabled:pointer-events-none transition-all"
                                >
                                  <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => setEditingTest(test)}
                              aria-label={`Editar marca de ${test.title}`}
                              title="Editar test"
                              className="p-2 text-graphite-400 hover:text-terracotta rounded-xl hover:bg-terracotta-50 dark:hover:bg-terracotta-950/30 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeletingTest(test)}
                              aria-label={`Eliminar marca de ${test.title}`}
                              title="Eliminar test"
                              className="p-2 text-graphite-400 hover:text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Desglose de Series y Curva de Fatiga Rápida (si tiene más de 1 serie) */}
                      {fatigue && fatigue.totalSets > 1 && (
                        <div className="bg-chalk-100/90 dark:bg-graphite-850 p-3 rounded-2xl border border-chalk-200/80 dark:border-graphite-800 space-y-2.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                            <span className="font-bold text-graphite-800 dark:text-graphite-200 flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-terracotta" />
                              Impacto de Fatiga Rápida (S1 ➔ S{fatigue.totalSets})
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-graphite-500 font-medium">
                                Media: <strong className="font-mono text-graphite-800 dark:text-graphite-200">{fatigue.averageValue} {test.unit}</strong>
                              </span>
                              <span
                                className={`font-mono font-black text-xs px-2 py-0.5 rounded-lg ${
                                  fatigue.isTotalLoss
                                    ? 'bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400'
                                    : 'bg-moss-100 dark:bg-moss-950/50 text-moss'
                                }`}
                              >
                                {fatigue.totalDropPercentage > 0 ? '+' : ''}
                                {fatigue.totalDropPercentage}% ({fatigue.totalDropAbsolute > 0 ? '-' : '+'}{Math.abs(fatigue.totalDropAbsolute)} {test.unit})
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
                            {fatigue.setsAnalysis.map((s, idx) => (
                              <div
                                key={s.setNumber}
                                className="bg-white dark:bg-graphite-900 p-2 rounded-xl border border-chalk-200 dark:border-graphite-800 space-y-1"
                              >
                                <div className="flex items-center justify-between text-[11px] font-bold">
                                  <span className="text-graphite-500">Serie {s.setNumber}</span>
                                  {idx > 0 ? (
                                    <span
                                      className={`font-mono text-[10px] font-bold ${
                                        s.isLoss ? 'text-red-500' : 'text-moss'
                                      }`}
                                    >
                                      {s.percentageDrop > 0 ? '+' : ''}
                                      {s.percentageDrop}%
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-terracotta font-semibold">100%</span>
                                  )}
                                </div>
                                <div className="text-sm font-black font-mono text-graphite-900 dark:text-white">
                                  {s.value}{' '}
                                  <span className="text-[10px] font-medium text-graphite-400">{test.unit}</span>
                                </div>
                                <div className="w-full bg-chalk-200 dark:bg-graphite-800 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      idx === 0
                                        ? 'bg-terracotta'
                                        : s.percentageOfFirst >= 90
                                        ? 'bg-moss'
                                        : s.percentageOfFirst >= 75
                                        ? 'bg-amber-500'
                                        : 'bg-red-500'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.max(10, s.percentageOfFirst))}%` }}
                                  />
                                </div>
                                {s.notes && (
                                  <p className="text-[10px] text-graphite-500 truncate italic">
                                    {s.notes}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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

      {/* Modal para Editar Test */}
      <EditTestModal
        isOpen={Boolean(editingTest)}
        onClose={() => setEditingTest(null)}
        test={editingTest}
      />

      {/* Modal para Confirmar Eliminación de Test */}
      <ConfirmModal
        isOpen={Boolean(deletingTest)}
        onClose={() => {
          if (!isDeleting) setDeletingTest(null);
        }}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar este test?"
        description={
          deletingTest
            ? `¿Estás seguro de que deseas eliminar el registro de "${deletingTest.title}" (${deletingTest.value} ${deletingTest.unit})? Esta acción se sincronizará con tu cuenta y no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar Test"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
