'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Trophy,
  Play,
  Trash2,
  Layers,
  CheckCircle2,
  StickyNote,
} from 'lucide-react';
import { useWorkoutStore } from '@/lib/store/workoutStore';
import { useActiveWorkoutStore } from '@/lib/store/activeWorkoutStore';
import { formatDurationHuman, formatSecondsToTime, formatBlockSummary } from '@/lib/timer/durationHelper';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

export default function HistoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id as string;

  const { getSessionById, deleteSession } = useWorkoutStore();
  const { startWorkout } = useActiveWorkoutStore();

  const session = getSessionById(sessionId);

  if (!session) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm font-bold text-graphite-600">Sesión no encontrada.</p>
        <Link href="/history">
          <Button variant="outline">Volver al Historial</Button>
        </Link>
      </div>
    );
  }

  const dateObj = new Date(session.startedAt);
  const formattedDate = dateObj.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleRepeatSession = () => {
    startWorkout(session.title, session.blocks, session.templateId);
    router.push('/workout/active');
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteSession(sessionId);
      router.push('/history');
    } catch (err) {
      console.warn('Error al eliminar sesión:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Cabecera y Volver */}
      <div className="flex items-center justify-between">
        <Link
          href="/history"
          className="flex items-center gap-1.5 text-xs font-bold text-graphite-600 dark:text-graphite-400 hover:text-terracotta transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Historial
        </Link>

        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          aria-label="Eliminar registro"
          className="text-xs font-bold text-red-600 hover:text-red-700 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Eliminar
        </button>
      </div>

      {/* Resumen Principal de la Sesión */}
      <div className="bg-white dark:bg-graphite-900 p-5 rounded-3xl border border-chalk-300 dark:border-graphite-800 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-black text-graphite-950 dark:text-white">
                {session.title}
              </h1>
              {session.overallRpe && (
                <Badge variant="terracotta" size="md">
                  RPE {session.overallRpe}/10
                </Badge>
              )}
            </div>
            <p className="text-xs text-graphite-500 capitalize">{formattedDate}</p>
          </div>

          <div className="text-right">
            <div className="text-xl font-black text-terracotta dark:text-terracotta-400 font-mono">
              {formatDurationHuman(session.durationSeconds)}
            </div>
            <div className="text-[11px] text-graphite-500 font-medium">Duración total</div>
          </div>
        </div>

        {session.notes && (
          <div className="p-3 bg-chalk-100 dark:bg-graphite-800 rounded-2xl text-xs text-graphite-700 dark:text-graphite-300 flex items-start gap-2">
            <StickyNote className="w-4 h-4 text-terracotta shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-graphite-900 dark:text-graphite-100">Notas generales: </span>
              <span>{session.notes}</span>
            </div>
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleRepeatSession}
          className="font-bold"
        >
          <Play className="w-4 h-4 mr-2 fill-current" />
          Repetir Esta Sesión
        </Button>
      </div>

      {/* Desglose por Bloques Ejecutados */}
      <div className="space-y-3">
        <h2 className="font-black text-lg text-graphite-900 dark:text-graphite-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-terracotta" />
          Desglose de Bloques Realizados ({session.logs.length})
        </h2>

        <div className="space-y-3">
          {session.logs.map((log, idx) => (
            <div
              key={log.id || idx}
              className="bg-white dark:bg-graphite-900 p-4 rounded-2xl border border-chalk-300 dark:border-graphite-800 shadow-sm space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-chalk-200 dark:bg-graphite-800 px-2 py-0.5 rounded text-graphite-600 dark:text-graphite-300">
                      #{idx + 1}
                    </span>
                    <h3 className="font-bold text-sm text-graphite-900 dark:text-graphite-100">
                      {log.blockTitle}
                    </h3>
                  </div>
                </div>

                <Badge variant={log.status === 'completed' ? 'moss' : 'neutral'} size="sm">
                  <CheckCircle2 className="w-3 h-3" />
                  {log.status === 'completed' ? 'Completado' : 'Parcial'}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                <div className="bg-chalk-100 dark:bg-graphite-850 p-2 rounded-xl text-center">
                  <div className="font-mono font-bold text-graphite-900 dark:text-graphite-100">
                    {log.completedSets} / {log.targetSets || log.completedSets}
                  </div>
                  <div className="text-[10px] text-graphite-500 uppercase font-semibold">Series</div>
                </div>

                <div className="bg-chalk-100 dark:bg-graphite-850 p-2 rounded-xl text-center">
                  <div className="font-mono font-bold text-terracotta">
                    {formatSecondsToTime(log.actualWorkSeconds || 0)}
                  </div>
                  <div className="text-[10px] text-graphite-500 uppercase font-semibold">Trabajo</div>
                </div>

                <div className="bg-chalk-100 dark:bg-graphite-850 p-2 rounded-xl text-center">
                  <div className="font-mono font-bold text-moss">
                    {formatSecondsToTime(log.actualRestSeconds || 0)}
                  </div>
                  <div className="text-[10px] text-graphite-500 uppercase font-semibold">Descanso</div>
                </div>
              </div>

              {log.notes && (
                <p className="text-xs text-graphite-600 dark:text-graphite-400 bg-chalk-100 dark:bg-graphite-800/60 p-2 rounded-xl italic">
                  &ldquo;{log.notes}&rdquo;
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => !isDeleting && setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar esta sesión?"
        description={`¿Estás seguro de eliminar el registro del entrenamiento "${session.title}"? Esta acción se sincronizará con tu cuenta y no se puede deshacer.`}
        confirmText="Eliminar Sesión"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
