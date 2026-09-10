'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Calendar, Trophy, ChevronRight, Plus, StickyNote } from 'lucide-react';
import { useWorkoutStore } from '@/lib/store/workoutStore';
import { formatDurationHuman } from '@/lib/timer/durationHelper';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function HistoryPage() {
  const { sessions } = useWorkoutStore();

  const completedSessions = sessions
    .filter((s) => s.status === 'completed')
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-graphite-950 dark:text-white">
            Historial de Sesiones
          </h1>
          <p className="text-xs text-graphite-500 mt-0.5">
            {completedSessions.length} {completedSessions.length === 1 ? 'sesión completada' : 'sesiones completadas'}
          </p>
        </div>

        <Link href="/workouts/new">
          <Button variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-1 stroke-[2.5]" />
            Nueva Sesión
          </Button>
        </Link>
      </div>

      {/* Listado de Sesiones */}
      {completedSessions.length > 0 ? (
        <div className="space-y-3">
          {completedSessions.map((session) => {
            const dateObj = new Date(session.startedAt);
            const dateStr = dateObj.toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });
            const timeStr = dateObj.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <Link
                key={session.id}
                href={`/history/${session.id}`}
                className="p-4 rounded-2xl bg-white dark:bg-graphite-900 border border-chalk-300 dark:border-graphite-800 shadow-sm hover:border-terracotta/60 transition-all block group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-bold text-base text-graphite-900 dark:text-graphite-100 truncate group-hover:text-terracotta transition-colors">
                        {session.title}
                      </h2>
                      {session.overallRpe && (
                        <Badge variant="terracotta" size="sm">
                          RPE {session.overallRpe}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-graphite-500">
                      <span className="capitalize">{dateStr}</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-terracotta" />
                        {formatDurationHuman(session.durationSeconds)}
                      </span>
                    </div>

                    {session.notes && (
                      <p className="text-xs text-graphite-600 dark:text-graphite-400 mt-2 bg-chalk-100 dark:bg-graphite-800/80 p-2 rounded-xl flex items-start gap-1.5 line-clamp-2">
                        <StickyNote className="w-3.5 h-3.5 text-terracotta shrink-0 mt-0.5" />
                        <span>{session.notes}</span>
                      </p>
                    )}
                  </div>

                  <ChevronRight className="w-5 h-5 text-graphite-400 group-hover:text-terracotta group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-graphite-900 rounded-3xl border border-chalk-300 dark:border-graphite-800 space-y-4">
          <Trophy className="w-12 h-12 text-graphite-300 dark:text-graphite-600 mx-auto" />
          <div>
            <h3 className="font-bold text-base text-graphite-800 dark:text-graphite-200">
              Sin entrenamientos registrados
            </h3>
            <p className="text-xs text-graphite-500 max-w-xs mx-auto mt-1">
              Las sesiones que completes aparecerán aquí con el desglose de cada serie y tus sensaciones.
            </p>
          </div>
          <Link href="/workouts/new">
            <Button variant="primary">Comenzar a entrenar</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
