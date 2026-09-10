'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Play, Flame, ArrowRight } from 'lucide-react';
import { useActiveWorkoutStore } from '@/lib/store/activeWorkoutStore';
import { formatSecondsToTime } from '@/lib/timer/durationHelper';

export function ActiveWorkoutBanner() {
  const pathname = usePathname();
  const { isActive, session, timerState } = useActiveWorkoutStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isActive || !session || pathname === '/workout/active') {
    return null;
  }

  const currentBlock = session.blocks[useActiveWorkoutStore.getState().currentBlockIndex];

  return (
    <div className="bg-gradient-to-r from-terracotta to-terracotta-600 text-white px-4 py-2.5 shadow-md sticky top-14 z-30 animate-scale-up">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 animate-pulse">
            <Flame className="w-4 h-4 text-white fill-current" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wider truncate">
              {session.title}
            </p>
            <p className="text-[11px] text-white/90 truncate">
              {currentBlock ? currentBlock.title : 'Entrenamiento activo'} &bull; {timerState.phase === 'work' ? 'Trabajo' : timerState.phase === 'rest' ? 'Descanso' : 'Pausa'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono font-bold text-sm bg-black/20 px-2 py-0.5 rounded">
            {formatSecondsToTime(timerState.secondsRemaining)}
          </span>
          <Link
            href="/workout/active"
            className="inline-flex items-center gap-1 bg-white text-terracotta font-bold text-xs px-3 py-1.5 rounded-lg shadow hover:bg-chalk-100 active:scale-95 transition-all"
          >
            <span>Volver</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
