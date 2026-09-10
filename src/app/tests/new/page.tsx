'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save, Sparkles, Activity } from 'lucide-react';
import { useTestStore } from '@/lib/store/testStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const testSchema = z.object({
  title: z.string().min(1, 'El título del test es obligatorio'),
  protocol: z.string().optional(),
  value: z.coerce.number({ invalid_type_error: 'Debe ser un número válido' }),
  unit: z.string().min(1, 'La unidad es obligatoria'),
  testedAt: z.string().min(1, 'La fecha es obligatoria'),
  notes: z.string().optional(),
});

type TestFormData = z.infer<typeof testSchema>;

const PRESET_TESTS = [
  {
    title: 'Suspensiones 20 mm (Lastre máx)',
    protocol: '5 segundos en semiarqueo estricto',
    unit: 'kg',
  },
  {
    title: 'Dominada con Lastre (1RM)',
    protocol: '1 repetición completa pasando barbilla',
    unit: 'kg',
  },
  {
    title: 'Tiempo Máx Suspensión 20 mm',
    protocol: 'Suspensión isométrica peso corporal',
    unit: 's',
  },
  {
    title: 'Máximo Grado de Bloque Encadenado',
    protocol: 'Grado Font / V-Scale',
    unit: 'grado',
  },
];

export default function NewTestPage() {
  const router = useRouter();
  const { addTest } = useTestStore();

  const todayIso = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      title: '',
      protocol: '',
      value: undefined,
      unit: 'kg',
      testedAt: todayIso,
      notes: '',
    },
  });

  const handleApplyPreset = (preset: (typeof PRESET_TESTS)[0]) => {
    setValue('title', preset.title);
    setValue('protocol', preset.protocol);
    setValue('unit', preset.unit);
  };

  const onSubmit = (data: TestFormData) => {
    addTest({
      title: data.title.trim(),
      protocol: data.protocol?.trim() || undefined,
      value: data.value,
      unit: data.unit.trim(),
      testedAt: new Date(data.testedAt).toISOString(),
      notes: data.notes?.trim() || undefined,
    });

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
          Crea cualquier test libremente con su protocolo y unidades
        </p>
      </div>

      {/* Sugerencias Rápidas */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-graphite-600 dark:text-graphite-400 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-terracotta" />
          Plantillas Rápidas de Test
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {PRESET_TESTS.map((preset) => (
            <button
              key={preset.title}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-graphite-900 border border-chalk-300 dark:border-graphite-800 text-graphite-800 dark:text-graphite-200 hover:border-terracotta/50 whitespace-nowrap shadow-sm active:scale-95 transition-all"
            >
              {preset.title}
            </button>
          ))}
        </div>
      </div>

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
            type="number"
            step="any"
            label="Valor Obtenido"
            placeholder="Ej: 22.5"
            {...register('value')}
            error={errors.value?.message}
          />

          <Input
            label="Unidad de Medida"
            placeholder="kg, s, rep, grado..."
            {...register('unit')}
            error={errors.unit?.message}
          />
        </div>

        <Input
          type="date"
          label="Fecha de Realización"
          {...register('testedAt')}
          error={errors.testedAt?.message}
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-graphite-600 dark:text-graphite-400 mb-1.5">
            Comentarios o Sensaciones (Opcional)
          </label>
          <textarea
            rows={3}
            placeholder="Ej: Buena sensación de hombros, margen para subir +1.25kg la próxima vez..."
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
