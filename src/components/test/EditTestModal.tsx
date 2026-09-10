'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, X, Edit3 } from 'lucide-react';
import { TestRecord } from '@/lib/types';
import { useTestStore } from '@/lib/store/testStore';
import { syncService } from '@/lib/supabase/syncService';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const editTestSchema = z.object({
  title: z.string().min(1, 'El título del test es obligatorio'),
  protocol: z.string().optional(),
  value: z.coerce.number({ invalid_type_error: 'Debe ser un número válido' }),
  unit: z.string().min(1, 'La unidad es obligatoria'),
  testedAt: z.string().min(1, 'La fecha es obligatoria'),
  notes: z.string().optional(),
});

type EditTestFormData = z.infer<typeof editTestSchema>;

interface EditTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: TestRecord | null;
}

export function EditTestModal({ isOpen, onClose, test }: EditTestModalProps) {
  const { updateTest } = useTestStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditTestFormData>({
    resolver: zodResolver(editTestSchema),
  });

  useEffect(() => {
    if (test) {
      const dateIso = test.testedAt ? test.testedAt.split('T')[0] : new Date().toISOString().split('T')[0];
      reset({
        title: test.title,
        protocol: test.protocol || '',
        value: test.value,
        unit: test.unit,
        testedAt: dateIso,
        notes: test.notes || '',
      });
    }
  }, [test, reset]);

  if (!test) return null;

  const onSubmit = (data: EditTestFormData) => {
    const updated = {
      title: data.title.trim(),
      protocol: data.protocol?.trim() || undefined,
      value: data.value,
      unit: data.unit.trim(),
      testedAt: new Date(data.testedAt).toISOString(),
      notes: data.notes?.trim() || undefined,
    };

    updateTest(test.id, updated);
    syncService.updateRemoteTest(test.id, updated);
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
            type="number"
            step="any"
            label="Valor Obtenido"
            placeholder="Ej: 25"
            {...register('value')}
            error={errors.value?.message}
          />

          <Input
            label="Unidad"
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
