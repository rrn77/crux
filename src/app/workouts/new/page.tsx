'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Play,
  Plus,
  Clock,
  Layers,
  BookOpen,
  ArrowLeft,
  Sparkles,
  Calendar,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { WorkoutBlock, WorkoutTemplate } from '@/lib/types';
import { useWorkoutStore, getLocalDateIsoString, generateUUID } from '@/lib/store/workoutStore';
import { useActiveWorkoutStore } from '@/lib/store/activeWorkoutStore';
import { calculateTotalEstimatedDuration, formatDurationHuman, BLOCK_TYPE_CONFIG } from '@/lib/timer/durationHelper';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { BlockCard } from '@/components/workout/BlockCard';
import { BlockFormInline } from '@/components/workout/BlockFormInline';

function WorkoutBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get('templateId');
  const dateParam = searchParams.get('date');
  const sessionIdParam = searchParams.get('sessionId');

  const { templates, getTemplateById, scheduleSession, getSessionById } = useWorkoutStore();
  const { startWorkout } = useActiveWorkoutStore();

  const [scheduledDate, setScheduledDate] = useState<string>(
    dateParam || getLocalDateIsoString()
  );
  const [sessionTitle, setSessionTitle] = useState<string>('Sesión de Entrenamiento');
  const [sessionDescription, setSessionDescription] = useState<string>('');
  const [blocks, setBlocks] = useState<WorkoutBlock[]>([]);

  // Estados para formularios inline
  const [isInlineFormOpen, setIsInlineFormOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<WorkoutBlock | null>(null);
  const [isTemplatePanelOpen, setIsTemplatePanelOpen] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Cargar sesión existente si viene en la query URL (?sessionId=xxx)
  useEffect(() => {
    if (sessionIdParam) {
      const existingSession = getSessionById(sessionIdParam);
      if (existingSession) {
        setSessionTitle(existingSession.title);
        setSessionDescription(existingSession.notes || '');
        if (existingSession.scheduledDate) {
          setScheduledDate(existingSession.scheduledDate);
        }
        setBlocks(existingSession.blocks || []);
        return;
      }
    }

    // Plantilla precargada vía query URL (?templateId=xxx): abrir directamente su prescripción
    if (templateIdParam) {
      const tpl = getTemplateById(templateIdParam);
      if (tpl) {
        setEditingBlock({
          id: generateUUID(),
          templateId: tpl.id,
          templateTitle: tpl.title,
          position: 0,
          title: tpl.title,
          type: tpl.type,
          notes: tpl.description,
        });
        setIsInlineFormOpen(true);
      }
    }
  }, [sessionIdParam, templateIdParam, getSessionById, getTemplateById]);

  // Duración estimada calculada en tiempo real
  const totalEstimatedSec = calculateTotalEstimatedDuration(blocks);

  const handleStartAddingBlock = () => {
    setEditingBlock(null);
    setIsInlineFormOpen(true);
    setIsTemplatePanelOpen(false);
  };

  const handleEditBlock = (block: WorkoutBlock) => {
    setEditingBlock(block);
    setIsInlineFormOpen(true);
    setIsTemplatePanelOpen(false);
  };

  const handleCancelInlineForm = () => {
    setIsInlineFormOpen(false);
    setEditingBlock(null);
  };

  const handleDeleteBlock = (blockId: string) => {
    setBlocks((prev) => {
      const filtered = prev.filter((b) => b.id !== blockId);
      return filtered.map((b, idx) => ({ ...b, position: idx }));
    });
    if (editingBlock?.id === blockId) {
      setIsInlineFormOpen(false);
      setEditingBlock(null);
    }
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
      const isExisting = blocks.some((b) => b.id === editingBlock.id);
      if (isExisting) {
        setBlocks((prev) =>
          prev.map((b) => (b.id === editingBlock.id ? { ...savedBlock, position: b.position } : b))
        );
      } else {
        // Era una plantilla precargada en el formulario
        setBlocks((prev) => [...prev, { ...savedBlock, position: prev.length }]);
      }
    } else {
      setBlocks((prev) => [...prev, { ...savedBlock, position: prev.length }]);
    }
    setIsInlineFormOpen(false);
    setEditingBlock(null);
  };

  // Al seleccionar una plantilla: abrir el formulario de prescripción (siempre en blanco)
  const handleSelectTemplate = (template: WorkoutTemplate) => {
    setEditingBlock({
      id: generateUUID(),
      templateId: template.id,
      templateTitle: template.title,
      position: blocks.length,
      title: template.title,
      type: template.type,
      notes: template.description,
    });
    setIsInlineFormOpen(true);
    setIsTemplatePanelOpen(false);
  };

  const handleScheduleSession = async () => {
    if (!sessionTitle.trim()) return;
    if (blocks.length === 0) return;

    const session = await scheduleSession({
      id: sessionIdParam || undefined,
      title: sessionTitle.trim(),
      notes: sessionDescription.trim() || undefined,
      scheduledDate,
      startedAt: new Date(scheduledDate).toISOString(),
      durationSeconds: totalEstimatedSec,
      status: 'scheduled',
      blocks,
      logs: [],
    });

    setSaveSuccessMessage(`¡Sesión planificada para el ${scheduledDate}!`);
    setTimeout(() => {
      router.push('/history');
    }, 800);
  };

  const handleStartWorkoutNow = async () => {
    if (blocks.length === 0) return;
    const title = sessionTitle.trim() || 'Sesión de Entrenamiento';

    const session = await scheduleSession({
      id: sessionIdParam || undefined,
      title,
      notes: sessionDescription.trim() || undefined,
      scheduledDate,
      startedAt: new Date().toISOString(),
      durationSeconds: totalEstimatedSec,
      status: 'in_progress',
      blocks,
      logs: [],
    });

    startWorkout(title, blocks, templateIdParam || undefined, session.id, scheduledDate);
    router.push('/workout/active');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
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
          onClick={() => {
            setIsTemplatePanelOpen(!isTemplatePanelOpen);
            setIsInlineFormOpen(false);
          }}
          className="text-xs font-bold"
        >
          <BookOpen className="w-3.5 h-3.5 mr-1 text-moss" />
          {isTemplatePanelOpen ? 'Cerrar Plantillas' : 'Añadir desde Plantillas'}
          {isTemplatePanelOpen ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-black tracking-tight text-graphite-950 dark:text-white">
          {sessionIdParam ? 'Editar Sesión Planificada' : 'Planificar Sesión de Entrenamiento'}
        </h1>
        <p className="text-xs text-graphite-500 mt-0.5">
          Organiza los ejercicios de tu sesión para el día seleccionado
        </p>
      </div>

      {/* Selector de Fecha y Datos de la Sesión */}
      <div className="bg-white dark:bg-graphite-900 p-5 rounded-3xl border border-chalk-300 dark:border-graphite-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              label="Nombre de la Sesión"
              placeholder="Ej: Suspensiones + Búlder, Resistencia Láctica, Core..."
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              className="text-base font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-graphite-700 dark:text-graphite-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-terracotta" />
              Día de la Sesión
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm font-bold bg-white dark:bg-graphite-900 text-graphite-900 dark:text-graphite-100 border border-chalk-300 dark:border-graphite-700 focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta shadow-2xs"
            />
          </div>
        </div>

        <Input
          label="Descripción o Enfoque (Opcional)"
          placeholder="Ej: Trabajar fuerza máxima en regleta antes de sesión de campus..."
          value={sessionDescription}
          onChange={(e) => setSessionDescription(e.target.value)}
        />

        {/* Indicador de Duración Total Estimada */}
        <div className="pt-2 border-t border-chalk-200 dark:border-graphite-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-graphite-500 font-medium">
            <Clock className="w-4 h-4 text-terracotta" />
            <span>Duración estimada total:</span>
          </div>
          <span className="text-sm font-black font-mono text-terracotta dark:text-terracotta-400">
            ~{formatDurationHuman(totalEstimatedSec)}
          </span>
        </div>
      </div>

      {/* Panel Integrado de Selección de Plantillas con Ajuste Directo de Prescripción */}
      {isTemplatePanelOpen && (
        <div className="p-5 bg-moss-50/70 dark:bg-moss-950/30 rounded-3xl border border-moss-200 dark:border-moss-900/50 space-y-3.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-moss" />
              <div>
                <h3 className="font-bold text-sm text-graphite-900 dark:text-white">
                  Tus Plantillas de Ejercicios ({templates.length})
                </h3>
                <p className="text-[11px] text-graphite-500">
                  Toca una plantilla para prescribir series, descanso y carga antes de añadirla
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsTemplatePanelOpen(false)}
              className="p-1.5 rounded-xl text-graphite-400 hover:text-graphite-700 hover:bg-white dark:hover:bg-graphite-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {templates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
              {templates.map((tpl) => {
                const typeConfig = BLOCK_TYPE_CONFIG[tpl.type];
                return (
                  <div
                    key={tpl.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-graphite-900 border border-moss-200 dark:border-graphite-800 flex flex-col justify-between gap-2.5 shadow-2xs hover:border-moss-400 transition-all"
                  >
                    <div>
                      <div className="font-bold text-sm text-graphite-900 dark:text-graphite-100">
                        {tpl.title}
                      </div>
                      <Badge variant={typeConfig.variant} size="sm" className="mt-1">
                        <typeConfig.icon className="w-3 h-3" />
                        {typeConfig.label}
                      </Badge>
                      {tpl.description && (
                        <p className="text-[11px] text-graphite-400 line-clamp-1 italic mt-1">
                          {tpl.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-end pt-1 border-t border-chalk-100 dark:border-graphite-800">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSelectTemplate(tpl)}
                        className="text-[11px] py-1 px-2.5"
                      >
                        Añadir
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center bg-white dark:bg-graphite-900 rounded-2xl border border-moss-200 dark:border-graphite-800 space-y-2">
              <p className="text-xs text-graphite-500">
                No tienes plantillas guardadas aún.
              </p>
              <Link href="/workouts/templates/new">
                <Button variant="outline" size="sm">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Crear Plantilla
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Lista de Bloques / Ejercicios de la Sesión */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-black text-lg text-graphite-900 dark:text-graphite-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-terracotta" />
              Ejercicios de la Sesión ({blocks.length})
            </h2>
            <p className="text-xs text-graphite-500">
              Añade ejercicios desde tus plantillas o crea bloques a medida
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsTemplatePanelOpen(!isTemplatePanelOpen);
                setIsInlineFormOpen(false);
              }}
            >
              <BookOpen className="w-4 h-4 mr-1 text-moss" />
              Plantillas
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleStartAddingBlock}
            >
              <Plus className="w-4 h-4 mr-1 stroke-[2.5]" />
              Crear Ejercicio
            </Button>
          </div>
        </div>

        {saveSuccessMessage && (
          <div className="p-3 bg-moss-100 dark:bg-moss-900/40 text-moss-900 dark:text-moss-200 text-xs font-bold rounded-xl flex items-center gap-2 animate-scale-up">
            <Sparkles className="w-4 h-4 text-moss" />
            {saveSuccessMessage}
          </div>
        )}

        {/* Formulario Integrado (Inline) para Crear / Ajustar / Editar Ejercicio */}
        {isInlineFormOpen && (
          <div className="p-5 bg-white dark:bg-graphite-900 rounded-3xl border-2 border-terracotta/60 dark:border-terracotta/50 shadow-md space-y-3 animate-fade-in">
            <div className="flex items-center justify-between border-b border-chalk-200 dark:border-graphite-800 pb-2.5">
              <h3 className="font-bold text-sm text-graphite-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-terracotta" />
                {editingBlock && blocks.some((b) => b.id === editingBlock.id)
                  ? `Editando Ejercicio: ${editingBlock.title}`
                  : editingBlock
                  ? `Configurar Prescripción: ${editingBlock.title}`
                  : 'Nuevo Ejercicio para esta Sesión'}
              </h3>
              <button
                type="button"
                onClick={handleCancelInlineForm}
                className="p-1 rounded-lg text-graphite-400 hover:text-graphite-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <BlockFormInline
              initialBlock={editingBlock}
              onSave={handleSaveBlock}
              onCancel={handleCancelInlineForm}
              submitLabel={
                editingBlock && blocks.some((b) => b.id === editingBlock.id)
                  ? 'Actualizar Ejercicio'
                  : 'Añadir a la Sesión'
              }
            />
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
          !isInlineFormOpen && (
            <div className="p-10 text-center bg-white dark:bg-graphite-900 rounded-3xl border-2 border-dashed border-chalk-300 dark:border-graphite-800 space-y-3">
              <p className="text-xs text-graphite-500">
                No has añadido ningún ejercicio para este día.
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTemplatePanelOpen(true)}
                >
                  <BookOpen className="w-4 h-4 mr-1.5 text-moss" />
                  Añadir desde Plantillas
                </Button>
                <Button variant="primary" size="sm" onClick={handleStartAddingBlock}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Crear Nuevo Ejercicio
                </Button>
              </div>
            </div>
          )
        )}
      </div>

      {/* Botones de Acción Principales */}
      <div className="pt-4 flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={handleScheduleSession}
          disabled={blocks.length === 0}
          className="flex-1 font-bold"
        >
          <CalendarCheck className="w-4 h-4 mr-2 text-terracotta" />
          Guardar Sesión para el {scheduledDate}
        </Button>

        <Button
          variant="primary"
          size="lg"
          onClick={handleStartWorkoutNow}
          disabled={blocks.length === 0}
          className="flex-1 font-bold shadow-lg"
        >
          <Play className="w-4 h-4 mr-2 fill-current" />
          Guardar y Entrenar Ya
        </Button>
      </div>
    </div>
  );
}

export default function NewWorkoutPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-graphite-500">Cargando planificador...</div>}>
      <WorkoutBuilderContent />
    </Suspense>
  );
}
