'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, X, Edit3, Plus, Trash2, Layers, Zap } from 'lucide-react';
import { TestRecord, TestSet } from '@/lib/types';
import { useTestStore, calculateTestFatigue } from '@/lib/store/testStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const editTestSchema = z.object({
  title: z.string().min(1, 'El título del test es obligatorio'),
  protocol: z.string().optional(),
  unit: z.string().min(1, 'La unidad es obligatoria'),
  testedAt: z.string().min(1, 'La fecha es obligatoria'),
  notes: z.string().optional(),
});

type EditTestFormData = z.infer<typeof editTestSchema>;

interface FormSetItem {
  id: string;
  value: string;
  notes: string;
}

interface EditTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: TestRecord | null;
}

export function EditTestModal({ isOpen, onClose, test }: EditTestModalProps) {
  const { updateTest } = useTestStore();

  const [targetMetric, setTargetMetric] = useState<'higher_is_better' | 'lower_is_better'>('higher_is_better');
  const [sets, setSets] = useState<FormSetItem[]>([]);
  const [setsError, setSetsError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditTestFormData>({
    resolver: zodResolver(editTestSchema),
  });

  const selectedUnit = watch('unit') || test?.unit || 'kg';

  useEffect(() => {
    if (test) {
      const dateIso = test.testedAt ? test.testedAt.split('T')[0] : new Date().toISOString().split('T')[0];
      reset({
        title: test.title,
        protocol: test.protocol || '',
        unit: test.unit,
        testedAt: dateIso,
        notes: test.notes || '',
      });

      setTargetMetric(
        test.targetMetric ||
          (test.unit?.toLowerCase() === 'mm' || test.title?.toLowerCase().includes('mm')
            ? 'lower_is_better'
            : 'higher_is_better')
      );

      if (test.sets && test.sets.length > 0) {
        setSets(
          test.sets.map((s, idx) => ({
            id: `set-${idx}-${s.setNumber}`,
            value: String(s.value),
            notes: s.notes || '',
          }))
        );
      } else {
        setSets([
          {
            id: 'set-1',
            value: test.value !== undefined ? String(test.value) : '',
            notes: '',
          },
        ]);
      }
      setSetsError(null);
    }
  }, [test, reset]);

  const handleUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue('unit', val);
    if (val.toLowerCase().trim() === 'mm') {
      setTargetMetric('lower_is_better');
    }
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
    return calculateTestFatigue(validTestSets, targetMetric);
  }, [validTestSets, targetMetric]);

  if (!test) return null;

  const onSubmit = async (data: EditTestFormData) => {
    if (validTestSets.length === 0) {
      setSetsError('Debes ingresar al menos el valor de una serie');
      return;
    }

    const originalDate = test.testedAt ? test.testedAt.split('T')[0] : '';
    let testedAtIso: string;
    if (data.testedAt === originalDate && test.testedAt) {
      testedAtIso = test.testedAt;
    } else {
      const [year, month, day] = data.testedAt.split('-').map(Number);
      const now = new Date();
      testedAtIso = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();
    }

    const peakValue =
      targetMetric === 'lower_is_better'
        ? Math.min(...validTestSets.map((s) => s.value))
        : Math.max(...validTestSets.map((s) => s.value));

    const updated: Partial<TestRecord> = {
      title: data.title.trim(),
      protocol: data.protocol?.trim() || undefined,
      value: peakValue,
      unit: data.unit.trim(),
      testedAt: testedAtIso,
      notes: data.notes?.trim() || undefined,
      sets: validTestSets.length > 1 ? validTestSets : undefined,
      targetMetric,
    };

    await updateTest(test.id, updated);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Registro de Test"
      description={`Modifica los valores o detalles de "${test.title}"`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
        <Input
          label="Título del Test"
          placeholder="Ej: Suspensiones 20 mm, Dominada 1RM..."
          {...register('title')}
          error={errors.title?.message}
        />

        <Input
          label="Protocolo (Opcional)"
          placeholder="Ej: 5 segundos en semiarqueo estricto..."
          {...register('protocol')}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Unidad"
            placeholder="kg, s, rep, grado, mm..."
            {...register('unit')}
            onChange={handleUnitChange}
            error={errors.unit?.message}
          />

          <Input
            type="date"
            label="Fecha de Realización"
            {...register('testedAt')}
            error={errors.testedAt?.message}
          />
        </div>

        {/* Objetivo de la Métrica */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-graphite-700 dark:text-graphite-300">
            Criterio de Mejora (Objetivo)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTargetMetric('higher_is_better')}
              className={`p-2.5 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                targetMetric === 'higher_is_better'
                  ? 'border-terracotta bg-terracotta-50/60 dark:bg-terracotta-950/30 ring-1 ring-terracotta text-graphite-900 dark:text-white'
                  : 'border-chalk-300 dark:border-graphite-700 bg-chalk-100/60 dark:bg-graphite-800/60 text-graphite-600 dark:text-graphite-400 hover:border-chalk-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-xl flex items-center justify-center shrink-0 text-xs font-black ${
                  targetMetric === 'higher_is_better'
                    ? 'bg-terracotta text-white'
                    : 'bg-chalk-200 dark:bg-graphite-700 text-graphite-600 dark:text-graphite-400'
                }`}
              >
                ↑
              </div>
              <div>
                <div className="text-xs font-bold">Aumentar (Más es mejor)</div>
                <div className="text-[10px] text-graphite-500">
                  kg, reps, s, grado...
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTargetMetric('lower_is_better')}
              className={`p-2.5 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                targetMetric === 'lower_is_better'
                  ? 'border-terracotta bg-terracotta-50/60 dark:bg-terracotta-950/30 ring-1 ring-terracotta text-graphite-900 dark:text-white'
                  : 'border-chalk-300 dark:border-graphite-700 bg-chalk-100/60 dark:bg-graphite-800/60 text-graphite-600 dark:text-graphite-400 hover:border-chalk-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-xl flex items-center justify-center shrink-0 text-xs font-black ${
                  targetMetric === 'lower_is_better'
                    ? 'bg-terracotta text-white'
                    : 'bg-chalk-200 dark:bg-graphite-700 text-graphite-600 dark:text-graphite-400'
                }`}
              >
                ↓
              </div>
              <div>
                <div className="text-xs font-bold">Reducir (Menos es mejor)</div>
                <div className="text-[10px] text-graphite-500">
                  mm de regleta, tiempo...
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Sección de Series e Intentos */}
        <div className="pt-2 space-y-3">
          <div className="flex items-center justify-between border-b border-chalk-200 dark:border-graphite-800 pb-2">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-terracotta" />
              <label className="text-xs font-bold uppercase tracking-wider text-graphite-900 dark:text-graphite-100">
                Series / Intentos ({sets.length})
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
                      placeholder={`Valor (${selectedUnit})`}
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

        {/* Panel de Análisis de Fatiga en Vivo */}
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
                <div className="font-mono font-black text-base text-graphite-900 dark:text-white">
                  {fatigueAnalysis.peakValue}{' '}
                  <span className="text-xs font-normal text-graphite-500">{selectedUnit}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-graphite-900 p-2.5 rounded-xl border border-chalk-200 dark:border-graphite-800">
                <div className="text-xs text-graphite-500 font-semibold">Caída Total</div>
                <div className={`font-mono font-black text-base ${fatigueAnalysis.isTotalLoss ? 'text-red-500' : 'text-moss'}`}>
                  {fatigueAnalysis.totalDropPercentage > 0 ? '+' : ''}
                  {fatigueAnalysis.totalDropPercentage}%
                </div>
              </div>

              <div className="bg-white dark:bg-graphite-900 p-2.5 rounded-xl border border-chalk-200 dark:border-graphite-800">
                <div className="text-xs text-graphite-500 font-semibold">Media</div>
                <div className="font-mono font-black text-base text-terracotta">
                  {fatigueAnalysis.averageValue}{' '}
                  <span className="text-xs font-normal text-graphite-500">{selectedUnit}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-graphite-600 dark:text-graphite-400 mb-1.5">
            Comentarios o Sensaciones (Opcional)
          </label>
          <textarea
            rows={3}
            placeholder="Notas sobre sensaciones, agarre o sensaciones corporales..."
            {...register('notes')}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-chalk-100 dark:bg-graphite-800 text-graphite-900 dark:text-graphite-100 border border-chalk-300 dark:border-graphite-700 focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-chalk-200 dark:border-graphite-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="sm">
            <Save className="w-4 h-4 mr-1.5" />
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Modal>
  );
}
