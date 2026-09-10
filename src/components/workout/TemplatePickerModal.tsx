'use client';

import React from 'react';
import { Play, Sparkles, Clock, Flame } from 'lucide-react';
import { WorkoutTemplate } from '@/lib/types';
import { useWorkoutStore } from '@/lib/store/workoutStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDurationHuman, formatBlockSummary } from '@/lib/timer/durationHelper';

interface TemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: WorkoutTemplate, startImmediately?: boolean) => void;
}

export function TemplatePickerModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: TemplatePickerModalProps) {
  const { templates } = useWorkoutStore();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Elegir Plantilla de Entrenamiento"
      description="Selecciona una sesión predefinida para entrenar o editar sus bloques"
      maxWidth="lg"
    >
      <div className="space-y-3.5 max-h-[65vh] overflow-y-auto pr-1">
        {templates.length > 0 ? (
          templates.map((template) => (
            <div
              key={template.id}
              className="p-4 rounded-2xl border border-chalk-300 dark:border-graphite-800 bg-chalk-50 dark:bg-graphite-850 hover:border-terracotta/60 transition-all flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-base text-graphite-900 dark:text-graphite-100">
                      {template.title}
                    </h3>
                  </div>
                  {template.description && (
                    <p className="text-xs text-graphite-600 dark:text-graphite-400">
                      {template.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 bg-chalk-200 dark:bg-graphite-800 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold text-graphite-700 dark:text-graphite-300">
                  <Clock className="w-3.5 h-3.5 text-terracotta" />
                  {formatDurationHuman(template.estimatedDurationSeconds)}
                </div>
              </div>

              {/* Desglose resumido de los bloques */}
              <div className="space-y-1 bg-white dark:bg-graphite-900 p-2.5 rounded-xl border border-chalk-200 dark:border-graphite-800 text-xs">
                {template.blocks.map((block, idx) => (
                  <div key={block.id || idx} className="flex items-center justify-between text-graphite-600 dark:text-graphite-400">
                    <span className="font-medium text-graphite-800 dark:text-graphite-200 truncate">
                      {idx + 1}. {block.title}
                    </span>
                    <span className="text-[11px] font-mono shrink-0 text-graphite-500">
                      {formatBlockSummary(block)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onSelectTemplate(template, false);
                    onClose();
                  }}
                >
                  Cargar en Editor
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onSelectTemplate(template, true);
                    onClose();
                  }}
                >
                  <Play className="w-3.5 h-3.5 mr-1 fill-current" />
                  Entrenar Ahora
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center bg-white dark:bg-graphite-900 rounded-2xl border border-chalk-300 dark:border-graphite-800 space-y-3">
            <p className="text-xs text-graphite-500">
              No tienes plantillas guardadas todavía.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                window.location.href = '/workouts/new';
              }}
            >
              Crear Nueva Rutina
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
