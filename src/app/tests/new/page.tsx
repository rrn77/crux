'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft,
  Save,
  History,
  Activity,
  Plus,
  Trash2,
  TrendingDown,
  Layers,
  Zap,
  Sparkles,
} from 'lucide-react';
import { useTestStore, calculateTestFatigue } from '@/lib/store/testStore';
import { useAuthStore } from '@/lib/supabase/authStore';
import { syncService } from '@/lib/supabase/syncService';
import { TestSet } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const testSchema = z.object({
  title: z.string().min(1, 'El título del test es obligatorio'),
  protocol: z.string().optional(),
  unit: z.string().min(1, 'La unidad es obligatoria'),
  testedAt: z.string().min(1, 'La fecha es obligatoria'),
  notes: z.string().optional(),
});

type TestFormData = z.infer<typeof testSchema>;

interface FormSetItem {
  id: string;
  value: string;
  notes: string;
}

export default function NewTestPage() {
  const router = useRouter();
  const { tests, addTest } = useTestStore();

  const todayIso = new Date().toISOString().split('T')[0];

  // Estado para gestión dinámica de series
  const [sets, setSets] = useState<FormSetItem[]>([
    { id: 'set-1', value: '', notes: '' },
  ]);
  const [setsError, setSetsError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      title: '',
      protocol: '',
      unit: 'kg',
      testedAt: todayIso,
      notes: '',
    },
  });

  const selectedUnit = watch('unit') || 'kg';

  // Extraer los tests únicos ya realizados por el usuario (ordenados por fecha más reciente)
  const previousTestsList = useMemo(() => {
    const map = new Map<
      string,
      { title: string; protocol?: string; unit: string; lastValue: number; lastDate: string }
    >();

    const sorted = [...tests].sort(
      (a, b) => new Date(b.testedAt).getTime() - new Date(a.testedAt).getTime()
    );

    sorted.forEach((t) => {
      const key = t.title.toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, {
          title: t.title,
          protocol: t.protocol,
          unit: t.unit,
          lastValue: t.value,
          lastDate: t.testedAt,
        });
      }
    });

    return Array.from(map.values());
  }, [tests]);

  const handleSelectPreviousTest = (item: { title: string; protocol?: string; unit: string }) => {
    setValue('title', item.title, { shouldValidate: true });
    setValue('protocol', item.protocol || '', { shouldValidate: true });
    setValue('unit', item.unit, { shouldValidate: true });
  };

  const handleAddSet = () => {
    const lastSet = sets[sets.length - 1];
    setSets([
      ...sets,
      {
        id: `set-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        value: lastSet?.value || '',
        notes: '',
      },
    ]);
    setSetsError(null);
  };

  const handleRemoveSet = (index: number) => {
    if (sets.length <= 1) return;
    setSets(sets.filter((_, idx) => idx !== index));
  };

  const handleSetChange = (index: number, field: 'value' | 'notes', val: string) => {
    const updated = [...sets];
    updated[index][field] = val;
    setSets(updated);
    if (setsError) setSetsError(null);
  };

  // Cálculo en vivo de fatiga y resumen de series
  const validTestSets: TestSet[] = useMemo(() => {
    return sets
      .map((s, idx) => ({
        setNumber: idx + 1,
        value: parseFloat(s.value),
        notes: s.notes.trim() || undefined,
      }))
      .filter((s) => !isNaN(s.value));
  }, [sets]);

  const fatigueAnalysis = useMemo(() => {
    if (validTestSets.length <= 1) return null;
    return calculateTestFatigue(validTestSets);
  }, [validTestSets]);

  const onSubmit = async (data: TestFormData) => {
    if (validTestSets.length === 0) {
      setSetsError('Debes ingresar al menos el valor de la Serie 1');
      return;
    }

    // Calcular timestamp ordenado secuencialmente dentro del día seleccionado
    const existingTestsOnDay = tests.filter((t) => {
      const d = new Date(t.testedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return key === data.testedAt;
    });

    let testedAtIso: string;
    if (existingTestsOnDay.length > 0) {
      const maxTimestamp = Math.max(...existingTestsOnDay.map((t) => new Date(t.testedAt).getTime()));
      testedAtIso = new Date(maxTimestamp + 60000).toISOString();
    } else {
      const [year, month, day] = data.testedAt.split('-').map(Number);
      const now = new Date();
      testedAtIso = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();
    }

    // Valor principal: Mejor marca (pico) de todas las series realizadas
    const peakValue = Math.max(...validTestSets.map((s) => s.value));

    const newTest = addTest({
      title: data.title.trim(),
      protocol: data.protocol?.trim() || undefined,
      value: peakValue,
      unit: data.unit.trim(),
      testedAt: testedAtIso,
      notes: data.notes?.trim() || undefined,
      sets: validTestSets.length > 1 ? validTestSets : undefined,
    });

    const user = useAuthStore.getState().user;
    if (user) {
      await syncService.pushTest(newTest, user.id);
    }

    router.push('/tests');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <Link
          href="/tests"
          className="flex items-center gap-1.5 text-xs font-bold text-graphite-600 dark:text-graphite-400 hover:text-terracotta transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Tests
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black tracking-tight text-graphite-950 dark:text-white">
          Registrar Nuevo Test
        </h1>
        <p className="text-xs text-graphite-500 mt-0.5">
          Registra una o múltiples series por ejercicio para analizar la fatiga rápida acumulada
        </p>
      </div>

      {/* Sugerencias basadas en tests ya realizados por el usuario */}
      {previousTestsList.length > 0 && (
        <div className="space-y-2.5 bg-white dark:bg-graphite-900 p-4 rounded-3xl border border-chalk-300 dark:border-graphite-800 shadow-sm">
          <label className="text-xs font-bold uppercase tracking-wider text-graphite-700 dark:text-graphite-300 flex items-center gap-1.5">
            <History className="w-4 h-4 text-terracotta" />
            Tus Tests Habituales (Toca para autocompletar)
          </label>
          <div className="flex flex-wrap gap-2 pt-0.5">
            {previousTestsList.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => handleSelectPreviousTest(item)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-chalk-100 dark:bg-graphite-800 border border-chalk-200 dark:border-graphite-700 text-graphite-800 dark:text-graphite-200 hover:border-terracotta hover:bg-terracotta-50 dark:hover:bg-terracotta-950/30 hover:text-terracotta transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
              >
                <span>{item.title}</span>
                <span className="text-[10px] font-mono text-graphite-400 bg-white dark:bg-graphite-900 px-1.5 py-0.5 rounded-md border border-chalk-200 dark:border-graphite-800">
                  {item.unit}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white dark:bg-graphite-900 p-5 rounded-3xl border border-chalk-300 dark:border-graphite-800 shadow-sm">
        <Input
          label="Título del Test"
          placeholder="Ej: Hangboard 20 mm, Dominada lastrada, Máximo grado..."
          {...register('title')}
          error={errors.title?.message}
        />

        <Input
          label="Protocolo o Ejecución (Opcional)"
          placeholder="Ej: 5 segundos en semiarqueo estricto, 1RM con cinto..."
          {...register('protocol')}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Unidad de Medida"
            placeholder="kg, s, rep, grado..."
            {...register('unit')}
            error={errors.unit?.message}
          />

          <Input
            type="date"
            label="Fecha de Realización"
            {...register('testedAt')}
            error={errors.testedAt?.message}
          />
        </div>

        {/* Sección de Series / Intentos para Fatiga Rápida */}
        <div className="pt-2 space-y-3">
          <div className="flex items-center justify-between border-b border-chalk-200 dark:border-graphite-800 pb-2">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-terracotta" />
              <label className="text-xs font-bold uppercase tracking-wider text-graphite-900 dark:text-graphite-100">
                Series / Intentos del Test ({sets.length})
              </label>
            </div>
            <button
              type="button"
              onClick={handleAddSet}
              className="text-xs font-bold text-terracotta hover:text-terracotta-700 bg-terracotta-50 dark:bg-terracotta-950/40 px-2.5 py-1 rounded-xl transition-colors flex items-center gap-1 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir Serie
            </button>
          </div>

          <p className="text-xs text-graphite-500">
            Añade varias series para registrar el decaimiento de fuerza o tiempo y evaluar la fatiga.
          </p>

          {setsError && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400">
              {setsError}
            </div>
          )}

          <div className="space-y-2.5">
            {sets.map((set, idx) => (
              <div
                key={set.id}
                className="bg-chalk-100 dark:bg-graphite-850 p-3 rounded-2xl border border-chalk-200 dark:border-graphite-800 flex flex-col sm:flex-row sm:items-center gap-2.5"
              >
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <span className="w-7 h-7 rounded-xl bg-white dark:bg-graphite-800 font-mono font-black text-xs text-graphite-700 dark:text-graphite-300 flex items-center justify-center shrink-0 border border-chalk-300 dark:border-graphite-700">
                    S{idx + 1}
                  </span>
                  <span className="text-xs font-bold text-graphite-700 dark:text-graphite-300 sm:hidden">
                    Serie {idx + 1}
                  </span>
                  {sets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSet(idx)}
                      aria-label={`Eliminar Serie ${idx + 1}`}
                      className="p-1.5 text-graphite-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors sm:hidden"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      placeholder={`Valor obtenido (${selectedUnit})`}
                      value={set.value}
                      onChange={(e) => handleSetChange(idx, 'value', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm font-mono font-bold bg-white dark:bg-graphite-900 text-graphite-900 dark:text-graphite-100 border border-chalk-300 dark:border-graphite-700 focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-semibold text-graphite-400 pointer-events-none">
                      {selectedUnit}
                    </span>
                  </div>

                  <input
                    type="text"
                    placeholder="Sensaciones o RPE (Opcional)"
                    value={set.notes}
                    onChange={(e) => handleSetChange(idx, 'notes', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-graphite-900 text-graphite-900 dark:text-graphite-100 border border-chalk-300 dark:border-graphite-700 focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta"
                  />
                </div>

                {sets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSet(idx)}
                    aria-label={`Eliminar Serie ${idx + 1}`}
                    title="Eliminar serie"
                    className="hidden sm:flex p-2 text-graphite-400 hover:text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Panel de Análisis de Fatiga en Vivo (si hay más de 1 serie con valor) */}
        {fatigueAnalysis && (
          <div className="bg-terracotta-50/70 dark:bg-terracotta-950/20 p-4 rounded-2xl border border-terracotta-200 dark:border-terracotta-900/50 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-terracotta-800 dark:text-terracotta-300 uppercase tracking-wider">
                <Zap className="w-4 h-4 text-terracotta" />
                Análisis de Fatiga en Vivo
              </div>
              <span className="text-xs font-mono font-bold text-graphite-600 dark:text-graphite-400">
                {fatigueAnalysis.totalSets} series
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white dark:bg-graphite-900 p-2.5 rounded-xl border border-chalk-200 dark:border-graphite-800">
                <div className="text-xs text-graphite-500 font-semibold">Pico (Mejor)</div>
                <div className="font-mono font-black text-base sm:text-lg text-graphite-900 dark:text-white">
                  {fatigueAnalysis.peakValue}{' '}
                  <span className="text-xs font-normal text-graphite-500">{selectedUnit}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-graphite-900 p-2.5 rounded-xl border border-chalk-200 dark:border-graphite-800">
                <div className="text-xs text-graphite-500 font-semibold">Caída (S1 ➔ S{fatigueAnalysis.totalSets})</div>
                <div className={`font-mono font-black text-base sm:text-lg ${fatigueAnalysis.totalDropPercentage <= 0 ? 'text-red-500' : 'text-moss'}`}>
                  {fatigueAnalysis.totalDropPercentage > 0 ? '+' : ''}
                  {fatigueAnalysis.totalDropPercentage}%
                </div>
              </div>

              <div className="bg-white dark:bg-graphite-900 p-2.5 rounded-xl border border-chalk-200 dark:border-graphite-800">
                <div className="text-xs text-graphite-500 font-semibold">Media</div>
                <div className="font-mono font-black text-base sm:text-lg text-terracotta">
                  {fatigueAnalysis.averageValue}{' '}
                  <span className="text-xs font-normal text-graphite-500">{selectedUnit}</span>
                </div>
              </div>
            </div>

            {/* Secuencia de Series con Porcentaje respecto a la Serie 1 */}
            <div className="space-y-1 pt-1">
              <div className="text-[11px] font-bold text-graphite-600 dark:text-graphite-400 uppercase tracking-wider">
                Evolución de Rendimiento por Serie:
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {fatigueAnalysis.setsAnalysis.map((s, idx) => (
                  <div
                    key={s.setNumber}
                    className="flex items-center gap-1.5 bg-white dark:bg-graphite-900 px-2.5 py-1.5 rounded-xl border border-chalk-200 dark:border-graphite-800 text-xs shadow-2xs"
                  >
                    <span className="font-bold text-graphite-500">S{s.setNumber}:</span>
                    <span className="font-mono font-bold text-graphite-900 dark:text-graphite-100">
                      {s.value} {selectedUnit}
                    </span>
                    {idx > 0 && (
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                          s.percentageDrop < 0
                            ? 'bg-red-100 dark:bg-red-950/40 text-red-600'
                            : 'bg-moss-100 dark:bg-moss-950/40 text-moss'
                        }`}
                      >
                        {s.percentageDrop > 0 ? '+' : ''}
                        {s.percentageDrop}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-graphite-600 dark:text-graphite-400 mb-1.5">
            Comentarios o Sensaciones Generales (Opcional)
          </label>
          <textarea
            rows={3}
            placeholder="Ej: Buena sensación de agarre, en la 3ª serie se notó fatiga en el flexor..."
            {...register('notes')}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-chalk-100 dark:bg-graphite-800 text-graphite-900 dark:text-graphite-100 border border-chalk-300 dark:border-graphite-700 focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="lg">
            <Save className="w-4 h-4 mr-2" />
            Guardar Test
          </Button>
        </div>
      </form>
    </div>
  );
}
