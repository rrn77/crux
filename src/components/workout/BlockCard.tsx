'use client';

import React from 'react';
import { GripVertical, Edit2, Trash2, ArrowUp, ArrowDown, Timer, Layers, Repeat, Target, FileText } from 'lucide-react';
import { WorkoutBlock } from '@/lib/types';
import { formatBlockSummary, calculateBlockEstimatedDuration, formatDurationHuman } from '@/lib/timer/durationHelper';
import { Badge } from '@/components/ui/Badge';

interface BlockCardProps {
  block: WorkoutBlock;
  index: number;
  totalBlocks: number;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  dragHandleProps?: Record<string, unknown>;
}

export function BlockCard({
  block,
  index,
  totalBlocks,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  dragHandleProps,
}: BlockCardProps) {
  const estimatedSec = calculateBlockEstimatedDuration(block);

  const typeConfig = {
    intervals: { label: 'Intervalos', icon: Timer, variant: 'terracotta' as const },
    problems: { label: 'Bloques', icon: Layers, variant: 'moss' as const },
    reps: { label: 'Reps', icon: Repeat, variant: 'warning' as const },
    attempts: { label: 'Intentos', icon: Target, variant: 'neutral' as const },
    free: { label: 'Libre', icon: FileText, variant: 'outline' as const },
  };

  const currentType = typeConfig[block.type] || typeConfig.free;
  const IconComponent = currentType.icon;

  return (
    <div className="bg-white dark:bg-graphite-900 border border-chalk-300 dark:border-graphite-800 rounded-2xl p-4 shadow-sm transition-all hover:border-chalk-400 dark:hover:border-graphite-700 flex items-start gap-3">
      {/* Drag handle / Posición */}
      <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
        <button
          type="button"
          aria-label="Arrastrar para reordenar"
          className="cursor-grab active:cursor-grabbing text-graphite-400 hover:text-graphite-700 dark:hover:text-graphite-200 p-1 -m-1"
          {...dragHandleProps}
        >
          <GripVertical className="w-5 h-5" />
        </button>
        <span className="text-[11px] font-mono font-bold text-graphite-500 dark:text-graphite-400 bg-chalk-200 dark:bg-graphite-800 px-1.5 py-0.5 rounded-md">
          #{index + 1}
        </span>
      </div>

      {/* Contenido del Bloque */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <Badge variant={currentType.variant} size="sm">
            <IconComponent className="w-3 h-3" />
            {currentType.label}
          </Badge>
          <span className="text-xs text-graphite-500 dark:text-graphite-400 font-mono font-medium">
            ~{formatDurationHuman(estimatedSec)}
          </span>
        </div>

        <h3 className="font-bold text-base text-graphite-900 dark:text-graphite-100 truncate">
          {block.title}
        </h3>

        <p className="text-xs font-semibold text-terracotta dark:text-terracotta-400 mt-1">
          {formatBlockSummary(block)}
        </p>

        {block.target && (
          <p className="text-xs text-graphite-600 dark:text-graphite-400 mt-1 flex items-center gap-1.5">
            <span className="font-semibold text-graphite-500">Objetivo:</span>
            <span className="bg-chalk-200/80 dark:bg-graphite-800 px-2 py-0.5 rounded text-[11px] font-medium text-graphite-800 dark:text-graphite-200">
              {block.target}
            </span>
          </p>
        )}

        {block.notes && (
          <p className="text-xs text-graphite-500 dark:text-graphite-400 mt-1 italic line-clamp-2">
            &ldquo;{block.notes}&rdquo;
          </p>
        )}
      </div>

      {/* Botones de acción accesibles */}
      <div className="flex flex-col gap-1 shrink-0">
        <div className="flex items-center gap-1">
          {onMoveUp && index > 0 && (
            <button
              type="button"
              onClick={onMoveUp}
              aria-label="Subir bloque"
              className="p-1.5 rounded-lg text-graphite-500 hover:text-graphite-800 dark:hover:text-graphite-200 hover:bg-chalk-200 dark:hover:bg-graphite-800 transition-colors"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}
          {onMoveDown && index < totalBlocks - 1 && (
            <button
              type="button"
              onClick={onMoveDown}
              aria-label="Bajar bloque"
              className="p-1.5 rounded-lg text-graphite-500 hover:text-graphite-800 dark:hover:text-graphite-200 hover:bg-chalk-200 dark:hover:bg-graphite-800 transition-colors"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 mt-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Editar bloque ${block.title}`}
            className="p-2 rounded-xl text-graphite-600 dark:text-graphite-300 hover:text-terracotta hover:bg-terracotta-50 dark:hover:bg-terracotta-900/30 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Eliminar bloque ${block.title}`}
            className="p-2 rounded-xl text-graphite-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
