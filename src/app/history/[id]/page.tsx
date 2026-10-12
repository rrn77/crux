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
  Copy,
  Trash2,
  Layers,
  CheckCircle2,
  StickyNote,
  Target,
} from 'lucide-react';
import { useWorkoutStore } from '@/lib/store/workoutStore';
import { useActiveWorkoutStore } from '@/lib/store/activeWorkoutStore';
import {
  formatDurationHuman,
  formatSecondsToTime,
  formatBlockSummary,
  BLOCK_TYPE_CONFIG,
} from '@/lib/timer/durationHelper';
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
    startWorkout(session.title, session.blocks);
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

        <div className="flex flex-col sm:flex-row gap-2.5">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleRepeatSession}
            className="font-bold flex-1"
          >
            <Play className="w-4 h-4 mr-2 fill-current" />
            Repetir Ahora
          </Button>
          <Link href={`/workouts/new?copyFrom=${sessionId}`} className="flex-1">
            <Button variant="outline" size="lg" fullWidth className="font-bold">
              <Copy className="w-4 h-4 mr-2" />
              Copiar a Otro Día
            </Button>
          </Link>
        </div>
      </div>

      {/* Desglose de Ejercicios y Prescripción */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-lg text-graphite-900 dark:text-graphite-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-terracotta" />
            Ejercicios y Prescripción ({session.blocks?.length || session.logs?.length || 0})
          </h2>
        </div>

        <div className="space-y-3">
          {(session.blocks && session.blocks.length > 0
            ? session.blocks.map((block, idx) => {
                const log = session.logs?.find(
                  (l) =>
                    (l.blockId && l.blockId === block.id) ||
                    l.position === idx ||
                    l.blockTitle?.toLowerCase().trim() === block.title?.toLowerCase().trim()
                );
                return {
                  block,
                  log,
                  title: block.title,
                  type: block.type,
                  index: idx,
                };
              })
            : (session.logs || []).map((log, idx) => ({
                block: undefined,
                log,
                title: log.blockTitle,
                type: log.blockType,
                index: idx,
              }))
          ).map((item) => {
            const blockConfig = BLOCK_TYPE_CONFIG[item.type] || BLOCK_TYPE_CONFIG.free;
            const IconComponent = blockConfig.icon;
            const log = item.log;
            const block = item.block;

            const isCompleted = log ? log.status === 'completed' : session.status === 'completed';
            const isSkipped = log?.status === 'skipped';
            const isPartial = log?.status === 'in_progress';

            return (
              <div
                key={block?.id || log?.id || item.index}
                className="bg-white dark:bg-graphite-900 p-4 sm:p-5 rounded-3xl border border-chalk-300 dark:border-graphite-800 shadow-sm space-y-3"
              >
                {/* Cabecera del Ejercicio */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="font-mono font-bold text-xs bg-chalk-200 dark:bg-graphite-800 px-2 py-0.5 rounded-md text-graphite-600 dark:text-graphite-300 shrink-0">
                      #{item.index + 1}
                    </span>
                    <h3 className="font-bold text-base text-graphite-900 dark:text-graphite-100">
                      {item.title}
                    </h3>
                    <Badge variant={blockConfig.variant} size="sm">
                      <IconComponent className="w-3 h-3" />
                      {blockConfig.label}
                    </Badge>
                  </div>

                  {/* Estado de ejecución */}
                  {isCompleted ? (
                    <Badge variant="moss" size="sm">
                      <CheckCircle2 className="w-3 h-3" />
                      Completado
                    </Badge>
                  ) : isSkipped ? (
                    <Badge variant="neutral" size="sm">
                      Omitido
                    </Badge>
                  ) : isPartial ? (
                    <Badge variant="warning" size="sm">
                      Parcial
                    </Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">
                      Registrado
                    </Badge>
                  )}
                </div>

                {/* ¿Qué había que hacer? (Prescripción y Plan del día) */}
                <div className="bg-chalk-100/80 dark:bg-graphite-850 p-3 sm:p-3.5 rounded-2xl border border-chalk-200 dark:border-graphite-750 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-graphite-600 dark:text-graphite-400 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-terracotta" />
                      ¿Qué tocaba hacer? (Objetivo prescrito)
                    </span>
                    {(block?.load || block?.target) && (
                      <span className="bg-terracotta-50 dark:bg-terracotta-950/40 text-terracotta px-2.5 py-0.5 rounded-lg text-xs font-bold border border-terracotta/20">
                        {block.load || block.target}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-black text-terracotta dark:text-terracotta-400">
                    {block
                      ? formatBlockSummary(block)
                      : log?.targetSets
                      ? `${log.targetSets} series prescritas`
                      : 'Ejercicio libre'}
                  </p>

                  {block?.notes && (
                    <div className="pt-0.5">
                      <span className="text-xs font-semibold text-graphite-500">Indicaciones: </span>
                      <span className="text-xs text-graphite-700 dark:text-graphite-300 italic">
                        &ldquo;{block.notes}&rdquo;
                      </span>
                    </div>
                  )}
                </div>

                {/* ¿Cómo se ejecutó? (Tiempos y Series reales) */}
                {log && (
                  <div className="space-y-2 pt-0.5">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-chalk-50 dark:bg-graphite-800/60 p-2.5 rounded-xl text-center border border-chalk-200 dark:border-graphite-750">
                        <div className="font-mono font-black text-sm text-graphite-900 dark:text-graphite-100">
                          {log.completedSets} / {log.targetSets || block?.sets || log.completedSets}
                        </div>
                        <div className="text-[10px] text-graphite-500 uppercase font-semibold">Series hechas</div>
                      </div>

                      <div className="bg-chalk-50 dark:bg-graphite-800/60 p-2.5 rounded-xl text-center border border-chalk-200 dark:border-graphite-750">
                        <div className="font-mono font-black text-sm text-terracotta">
                          {formatSecondsToTime(log.actualWorkSeconds || 0)}
                        </div>
                        <div className="text-[10px] text-graphite-500 uppercase font-semibold">Trabajo real</div>
                      </div>

                      <div className="bg-chalk-50 dark:bg-graphite-800/60 p-2.5 rounded-xl text-center border border-chalk-200 dark:border-graphite-750">
                        <div className="font-mono font-black text-sm text-moss">
                          {formatSecondsToTime(log.actualRestSeconds || 0)}
                        </div>
                        <div className="text-[10px] text-graphite-500 uppercase font-semibold">Descanso real</div>
                      </div>
                    </div>

                    {/* Sensaciones durante el entreno o RPE */}
                    {(log.rpe || log.notes) && (
                      <div className="flex items-center gap-2 flex-wrap pt-0.5 text-xs">
                        {log.rpe && (
                          <span className="font-bold bg-chalk-200 dark:bg-graphite-800 text-graphite-700 dark:text-graphite-300 px-2 py-0.5 rounded-md">
                            RPE {log.rpe}/10
                          </span>
                        )}
                        {log.notes && (
                          <p className="text-graphite-600 dark:text-graphite-400 bg-chalk-50 dark:bg-graphite-800/40 px-2.5 py-1.5 rounded-xl italic flex-1 min-w-[200px]">
                            Sensaciones: &ldquo;{log.notes}&rdquo;
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
