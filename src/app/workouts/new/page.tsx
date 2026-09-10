'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Play,
  Plus,
  Save,
  Clock,
  Layers,
  BookOpen,
  ArrowLeft,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { WorkoutBlock, WorkoutTemplate } from '@/lib/types';
import { useWorkoutStore } from '@/lib/store/workoutStore';
import { useActiveWorkoutStore } from '@/lib/store/activeWorkoutStore';
import { calculateTotalEstimatedDuration, formatDurationHuman } from '@/lib/timer/durationHelper';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BlockCard } from '@/components/workout/BlockCard';
import { BlockFormModal } from '@/components/workout/BlockFormModal';
import { TemplatePickerModal } from '@/components/workout/TemplatePickerModal';

function WorkoutBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get('templateId');

  const { addTemplate, getTemplateById } = useWorkoutStore();
  const { startWorkout } = useActiveWorkoutStore();

  const [sessionTitle, setSessionTitle] = useState<string>('Sesión Personalizada');
  const [sessionDescription, setSessionDescription] = useState<string>('');
  const [blocks, setBlocks] = useState<WorkoutBlock[]>([
    {
      id: 'block-init-1',
      position: 0,
      title: 'ULAC 3x1',
      type: 'intervals',
      sets: 4,
      workDurationSeconds: 180, // 3:00
      restDurationSeconds: 60,  // 1:00
      target: 'Continuidad 70%',
      notes: '4 series de 3 min con 1 min de reposo.',
    },
  ]);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<WorkoutBlock | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Cargar plantilla si viene en la query URL (?templateId=xxx)
  useEffect(() => {
    if (templateIdParam) {
      const tpl = getTemplateById(templateIdParam);
      if (tpl) {
        setSessionTitle(tpl.title);
        setSessionDescription(tpl.description || '');
        setBlocks(tpl.blocks.map((b, idx) => ({ ...b, id: `block-${Date.now()}-${idx}`, position: idx })));
      }
    }
  }, [templateIdParam, getTemplateById]);

  // Duración estimada calculada en tiempo real
  const totalEstimatedSec = calculateTotalEstimatedDuration(blocks);

  const handleAddBlock = () => {
    setEditingBlock(null);
    setIsFormModalOpen(true);
  };

  const handleEditBlock = (block: WorkoutBlock) => {
    setEditingBlock(block);
    setIsFormModalOpen(true);
  };

  const handleDeleteBlock = (blockId: string) => {
    setBlocks((prev) => {
      const filtered = prev.filter((b) => b.id !== blockId);
      return filtered.map((b, idx) => ({ ...b, position: idx }));
    });
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setBlocks((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy.map((b, idx) => ({ ...b, position: idx }));
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= blocks.length - 1) return;
    setBlocks((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy.map((b, idx) => ({ ...b, position: idx }));
    });
  };

  const handleSaveBlock = (savedBlock: WorkoutBlock) => {
    if (editingBlock) {
      setBlocks((prev) =>
        prev.map((b) => (b.id === editingBlock.id ? { ...savedBlock, position: b.position } : b))
      );
    } else {
      setBlocks((prev) => [...prev, { ...savedBlock, position: prev.length }]);
    }
  };

  const handleSelectTemplate = (template: WorkoutTemplate, startImmediately?: boolean) => {
    if (startImmediately) {
      startWorkout(template.title, template.blocks, template.id);
      router.push('/workout/active');
    } else {
      setSessionTitle(template.title);
      setSessionDescription(template.description || '');
      setBlocks(template.blocks.map((b, idx) => ({ ...b, id: `block-${Date.now()}-${idx}`, position: idx })));
    }
  };

  const handleSaveAsTemplate = () => {
    if (!sessionTitle.trim()) return;
    if (blocks.length === 0) return;

    addTemplate({
      title: sessionTitle.trim(),
      description: sessionDescription.trim() || undefined,
      estimatedDurationSeconds: totalEstimatedSec,
      blocks,
    });

    setSaveSuccessMessage('¡Plantilla guardada con éxito!');
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  const handleStartWorkoutNow = () => {
    if (blocks.length === 0) return;
    startWorkout(sessionTitle.trim() || 'Sesión de Entrenamiento', blocks);
    router.push('/workout/active');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Cabecera con Botón Volver y Plantillas */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-bold text-graphite-600 dark:text-graphite-400 hover:text-terracotta transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsTemplateModalOpen(true)}
          className="text-xs font-bold"
        >
          <BookOpen className="w-3.5 h-3.5 mr-1 text-terracotta" />
          Cargar Plantilla
        </Button>
      </div>

      {/* Título de la Sesión y Descripción */}
      <div className="bg-white dark:bg-graphite-900 p-4 sm:p-5 rounded-2xl border border-chalk-300 dark:border-graphite-800 shadow-sm space-y-3">
        <Input
          label="Nombre de la Sesión"
          placeholder="Ej: Sesión ULAC + Dedos, Proyecto Desplome, Resistencia..."
          value={sessionTitle}
          onChange={(e) => setSessionTitle(e.target.value)}
          className="text-base font-bold"
        />

        <Input
          label="Descripción o Enfoque (Opcional)"
          placeholder="Ej: Foco en volumen láctico antes de ir a roca..."
          value={sessionDescription}
          onChange={(e) => setSessionDescription(e.target.value)}
        />

        {/* Indicador de Duración Total Estimada */}
        <div className="pt-2 border-t border-chalk-200 dark:border-graphite-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-graphite-500 font-medium">
            <Clock className="w-4 h-4 text-terracotta" />
            <span>Duración estimada:</span>
          </div>
          <span className="text-sm font-black font-mono text-terracotta dark:text-terracotta-400">
            ~{formatDurationHuman(totalEstimatedSec)}
          </span>
        </div>
      </div>

      {/* Lista de Bloques Personalizados */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-black text-lg text-graphite-900 dark:text-graphite-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-terracotta" />
              Bloques de la Sesión ({blocks.length})
            </h2>
            <p className="text-xs text-graphite-500">Configura la estructura de cada ejercicio libremente</p>
          </div>

          <Button variant="primary" size="sm" onClick={handleAddBlock}>
            <Plus className="w-4 h-4 mr-1 stroke-[2.5]" />
            Añadir Bloque
          </Button>
        </div>

        {saveSuccessMessage && (
          <div className="p-3 bg-moss-100 dark:bg-moss-900/40 text-moss-900 dark:text-moss-200 text-xs font-bold rounded-xl flex items-center gap-2 animate-scale-up">
            <Sparkles className="w-4 h-4 text-moss" />
            {saveSuccessMessage}
          </div>
        )}

        {blocks.length > 0 ? (
          <div className="space-y-2.5">
            {blocks.map((block, index) => (
              <BlockCard
                key={block.id}
                block={block}
                index={index}
                totalBlocks={blocks.length}
                onEdit={() => handleEditBlock(block)}
                onDelete={() => handleDeleteBlock(block.id)}
                onMoveUp={() => handleMoveUp(index)}
                onMoveDown={() => handleMoveDown(index)}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white dark:bg-graphite-900 rounded-2xl border-2 border-dashed border-chalk-300 dark:border-graphite-800 space-y-3">
            <p className="text-xs text-graphite-500">No hay bloques en esta sesión.</p>
            <Button variant="outline" size="sm" onClick={handleAddBlock}>
              <Plus className="w-4 h-4 mr-1" />
              Añadir tu primer bloque
            </Button>
          </div>
        )}
      </div>

      {/* Botones de Acción Fijos / Principales */}
      <div className="pt-4 flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={handleSaveAsTemplate}
          disabled={blocks.length === 0}
          className="flex-1"
        >
          <Save className="w-4 h-4 mr-1.5 text-terracotta" />
          Guardar como Plantilla
        </Button>

        <Button
          variant="primary"
          size="xl"
          onClick={handleStartWorkoutNow}
          disabled={blocks.length === 0}
          className="flex-1 py-4 text-base font-bold shadow-lg"
        >
          <Play className="w-5 h-5 mr-2 fill-current" />
          Empezar a Entrenar Ya
        </Button>
      </div>

      {/* Modal para Crear / Editar Bloque */}
      <BlockFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveBlock}
        initialBlock={editingBlock}
      />

      {/* Modal para Seleccionar Plantilla Existente */}
      <TemplatePickerModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );
}

export default function NewWorkoutPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-graphite-500">Cargando constructor...</div>}>
      <WorkoutBuilderContent />
    </Suspense>
  );
}
