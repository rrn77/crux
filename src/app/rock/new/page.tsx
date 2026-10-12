'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  History,
  Mountain,
} from 'lucide-react';
import { useRockSessionStore } from '@/lib/store/rockSessionStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function NewRockSessionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { rockSessions, addRockSession } = useRockSessionStore();

  const todayIso = new Date().toISOString().split('T')[0];
  const defaultDate = searchParams.get('date') || todayIso;

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Títulos únicos de sesiones de roca anteriores para sugerencias
  const previousTitles = useMemo(() => {
    return useRockSessionStore.getState().getUniqueTitles();
  }, [rockSessions]);

  const handleSelectPreviousTitle = (t: string) => {
    setTitle(t);
    setTitleError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError('El título es obligatorio');
      return;
    }

    setIsSaving(true);
    try {
      await addRockSession({
        title: trimmedTitle,
        date,
        notes: notes.trim() || undefined,
        rating: rating || undefined,
      });
      router.push('/');
    } catch (err) {
      console.warn('Error al guardar sesión de roca:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const ratingLabels: Record<number, string> = {
    1: 'Pésimo',
    2: 'Muy mal',
    3: 'Mal',
    4: 'Flojo',
    5: 'Normal',
    6: 'Bien',
    7: 'Muy bien',
    8: 'Genial',
    9: 'Increíble',
    10: 'Perfecto',
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-bold text-graphite-600 dark:text-graphite-400 hover:text-terracotta transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Inicio
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black tracking-tight text-graphite-950 dark:text-white flex items-center gap-2">
          <Mountain className="w-6 h-6 text-amber-600" />
          Nueva Sesión de Roca
        </h1>
        <p className="text-xs text-graphite-500 mt-0.5">
          Registra tu día de escalada en roca o rocódromo libre
        </p>
      </div>

      {/* Sugerencias de títulos anteriores */}
      {previousTitles.length > 0 && (
        <div className="space-y-2.5 bg-white dark:bg-graphite-900 p-4 rounded-3xl border border-chalk-300 dark:border-graphite-800 shadow-sm">
          <label className="text-xs font-bold uppercase tracking-wider text-graphite-700 dark:text-graphite-300 flex items-center gap-1.5">
            <History className="w-4 h-4 text-amber-600" />
            Tus Zonas Habituales (Toca para autocompletar)
          </label>
          <div className="flex flex-wrap gap-2 pt-0.5">
            {previousTitles.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleSelectPreviousTitle(t)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-chalk-100 dark:bg-graphite-800 border border-chalk-200 dark:border-graphite-700 text-graphite-800 dark:text-graphite-200 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-700 transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
              >
                <Mountain className="w-3.5 h-3.5" />
                <span>{t}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-graphite-900 p-5 rounded-3xl border border-chalk-300 dark:border-graphite-800 shadow-sm">
        <Input
          label="Zona o Título"
          placeholder="Ej: El Chorro, Siurana, Rocódromo X..."
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (titleError) setTitleError(null);
          }}
          error={titleError || undefined}
        />

        <Input
          type="date"
          label="Fecha"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        {/* Valoración 1-10 */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-graphite-700 dark:text-graphite-300">
            Valoración del Día
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setRating(rating === val ? null : val)}
                className={`p-2.5 rounded-xl border text-center transition-all active:scale-95 ${
                  rating === val
                    ? val <= 3
                      ? 'border-red-400 bg-red-50 dark:bg-red-950/30 ring-1 ring-red-400 text-red-700 dark:text-red-400'
                      : val <= 5
                      ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 ring-1 ring-amber-400 text-amber-700 dark:text-amber-400'
                      : val <= 7
                      ? 'border-moss bg-moss-50 dark:bg-moss-950/30 ring-1 ring-moss text-moss-700 dark:text-moss-400'
                      : 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-500 text-emerald-700 dark:text-emerald-400'
                    : 'border-chalk-300 dark:border-graphite-700 bg-chalk-100/60 dark:bg-graphite-800/60 text-graphite-600 dark:text-graphite-400 hover:border-chalk-400'
                }`}
              >
                <div className="font-black text-base">{val}</div>
              </button>
            ))}
          </div>
          {rating && (
            <div className="text-center text-xs font-bold text-graphite-600 dark:text-graphite-400 animate-fade-in">
              {ratingLabels[rating]}
            </div>
          )}
        </div>

        {/* Notas libres */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-graphite-700 dark:text-graphite-300 mb-1.5">
            Notas del Día
          </label>
          <textarea
            rows={5}
            placeholder="Describe tu día: vías escaladas, grados intentados, condiciones, sensaciones, logros..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-chalk-100 dark:bg-graphite-800 text-graphite-900 dark:text-graphite-100 border border-chalk-300 dark:border-graphite-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="lg" disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Guardando...' : 'Guardar Sesión de Roca'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewRockSessionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-graphite-500">Cargando formulario...</div>}>
      <NewRockSessionForm />
    </Suspense>
  );
}
