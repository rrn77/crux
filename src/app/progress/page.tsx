'use client';

import React from 'react';
import Link from 'next/link';
import { TrendingUp, Plus, Activity } from 'lucide-react';
import { ProgressCharts } from '@/components/progress/ProgressCharts';
import { Button } from '@/components/ui/Button';

export default function ProgressPage() {
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-graphite-950 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-terracotta" />
            Progreso y Rendimiento
          </h1>
          <p className="text-xs text-graphite-500 mt-0.5">
            Métricas basadas exclusivamente en tus entrenamientos y tests registrados
          </p>
        </div>

        <Link href="/tests/new">
          <Button variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-1 stroke-[2.5]" />
            Nuevo Test
          </Button>
        </Link>
      </div>

      {/* Gráficas de evolución */}
      <ProgressCharts />
    </div>
  );
}
