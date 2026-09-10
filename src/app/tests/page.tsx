'use client';

import React from 'react';
import Link from 'next/link';
import {
  Activity,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useTestStore, calculateTestDelta } from '@/lib/store/testStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function TestsPage() {
  const { tests, getPreviousTest, deleteTest } = useTestStore();

  const sortedTests = [...tests].sort(
    (a, b) => new Date(b.testedAt).getTime() - new Date(a.testedAt).getTime()
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-graphite-950 dark:text-white">
            Tests y Benchmarks
          </h1>
          <p className="text-xs text-graphite-500 mt-0.5">
            Compara tus marcas frente a intentos anteriores
          </p>
        </div>

        <Link href="/tests/new">
          <Button variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-1 stroke-[2.5]" />
            Nuevo Test
          </Button>
        </Link>
      </div>

      {/* Listado de Tests */}
      {sortedTests.length > 0 ? (
        <div className="space-y-3">
          {sortedTests.map((test) => {
            const previousTest = getPreviousTest(test.title, test.testedAt);
            const delta = calculateTestDelta(test.value, previousTest?.value, test.unit);

            const dateStr = new Date(test.testedAt).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div
                key={test.id}
                className="bg-white dark:bg-graphite-900 p-4 rounded-2xl border border-chalk-300 dark:border-graphite-800 shadow-sm hover:border-chalk-400 dark:hover:border-graphite-700 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-bold text-base text-graphite-900 dark:text-graphite-100">
                        {test.title}
                      </h2>
                    </div>
                    {test.protocol && (
                      <p className="text-xs text-graphite-500">{test.protocol}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Valor numérico del test */}
                    <div className="text-right">
                      <div className="text-xl sm:text-2xl font-black font-mono text-terracotta dark:text-terracotta-400 leading-none">
                        {test.value}{' '}
                        <span className="text-xs font-semibold text-graphite-500 font-sans">
                          {test.unit}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteTest(test.id)}
                      aria-label={`Eliminar test ${test.title}`}
                      className="p-1.5 text-graphite-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Comparativa con el Test Anterior */}
                <div className="flex items-center justify-between pt-2 border-t border-chalk-200 dark:border-graphite-800 text-xs">
                  <div className="flex items-center gap-1.5 text-graphite-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{dateStr}</span>
                  </div>

                  {delta ? (
                    <div className="flex items-center gap-1.5 font-mono font-bold">
                      <span className="text-graphite-500 text-[11px] font-sans font-normal">
                        Frente al anterior ({previousTest?.value} {test.unit}):
                      </span>
                      {delta.isPositive ? (
                        <span className="text-moss dark:text-moss-400 flex items-center gap-0.5 bg-moss-50 dark:bg-moss-900/30 px-2 py-0.5 rounded-lg">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {delta.formatted}
                        </span>
                      ) : delta.isNeutral ? (
                        <span className="text-graphite-500 flex items-center gap-0.5 bg-chalk-200 dark:bg-graphite-800 px-2 py-0.5 rounded-lg">
                          <Minus className="w-3.5 h-3.5" />
                          Sin cambio
                        </span>
                      ) : (
                        <span className="text-red-500 flex items-center gap-0.5 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-lg">
                          <TrendingDown className="w-3.5 h-3.5" />
                          {delta.formatted}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-graphite-400 italic">
                      Primer registro de referencia
                    </span>
                  )}
                </div>

                {test.notes && (
                  <p className="text-xs text-graphite-600 dark:text-graphite-400 bg-chalk-100 dark:bg-graphite-850 p-2.5 rounded-xl italic">
                    &ldquo;{test.notes}&rdquo;
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-graphite-900 rounded-3xl border border-chalk-300 dark:border-graphite-800 space-y-4">
          <Activity className="w-12 h-12 text-graphite-300 dark:text-graphite-600 mx-auto" />
          <div>
            <h3 className="font-bold text-base text-graphite-800 dark:text-graphite-200">
              No hay tests registrados
            </h3>
            <p className="text-xs text-graphite-500 max-w-xs mx-auto mt-1">
              Registra tus marcas de suspensiones, dominadas con lastre o grados máximos para seguir tu progreso.
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
