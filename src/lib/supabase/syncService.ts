import { supabase } from './client';
import { WorkoutTemplate, WorkoutSession, WorkoutBlock, BlockLog, TestRecord } from '../types';
import { useWorkoutStore } from '../store/workoutStore';
import { useTestStore } from '../store/testStore';

class SupabaseSyncService {
  private isSyncing = false;

  /**
   * Sincronización completa de datos entre Supabase y almacenamiento local
   */
  async syncAll(userId: string): Promise<boolean> {
    if (!supabase || this.isSyncing) return false;

    this.isSyncing = true;
    try {
      await Promise.all([
        this.syncTemplates(userId),
        this.syncSessions(userId),
        this.syncTests(userId),
      ]);
      return true;
    } catch (err) {
      console.warn('Error durante la sincronización con Supabase:', err);
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sincronizar Plantillas
   */
  async syncTemplates(userId: string) {
    if (!supabase) return;

    // 1. Obtener plantillas remotas (propias y predeterminadas)
    const { data: remoteTemplates, error } = await supabase
      .from('workout_templates')
      .select('*, workout_blocks(*)');

    if (error || !remoteTemplates) return;

    const formattedTemplates: WorkoutTemplate[] = remoteTemplates.map((tpl: Record<string, unknown>) => ({
      id: tpl.id as string,
      userId: tpl.user_id as string | undefined,
      title: tpl.title as string,
      description: tpl.description as string | undefined,
      estimatedDurationSeconds: Number(tpl.estimated_duration_seconds) || 0,
      isDefault: Boolean(tpl.is_default),
      createdAt: tpl.created_at as string,
      updatedAt: tpl.updated_at as string,
      blocks: ((tpl.workout_blocks as Array<Record<string, unknown>>) || []).map((b) => ({
        id: b.id as string,
        templateId: b.template_id as string,
        position: Number(b.position) || 0,
        title: b.title as string,
        type: b.type as WorkoutBlock['type'],
        sets: b.sets ? Number(b.sets) : undefined,
        workDurationSeconds: b.work_duration_seconds ? Number(b.work_duration_seconds) : undefined,
        restDurationSeconds: b.rest_duration_seconds ? Number(b.rest_duration_seconds) : undefined,
        repetitions: b.repetitions ? Number(b.repetitions) : undefined,
        attempts: b.attempts ? Number(b.attempts) : undefined,
        problems: b.problems ? Number(b.problems) : undefined,
        movements: b.movements ? Number(b.movements) : undefined,
        target: b.target as string | undefined,
        notes: b.notes as string | undefined,
      })),
    }));

    // Fusionar con el store local
    const localStore = useWorkoutStore.getState();
    const remoteIds = new Set(formattedTemplates.map((t) => t.id));

    // Subir plantillas locales no sincronizadas
    for (const localTpl of localStore.templates) {
      if (!localTpl.isDefault && !remoteIds.has(localTpl.id)) {
        await this.pushTemplate(localTpl, userId);
      }
    }

    // Actualizar store local con las plantillas remotas
    useWorkoutStore.setState({ templates: formattedTemplates });
  }

  /**
   * Subir una plantilla a Supabase
   */
  async pushTemplate(template: WorkoutTemplate, userId: string) {
    if (!supabase) return;

    try {
      const { data: tplData, error: tplErr } = await supabase
        .from('workout_templates')
        .upsert({
          id: template.id.startsWith('template-') ? undefined : template.id,
          user_id: userId,
          title: template.title,
          description: template.description,
          estimated_duration_seconds: template.estimatedDurationSeconds,
          is_default: false,
        })
        .select()
        .single();

      if (tplErr || !tplData) return;

      const templateId = tplData.id;

      // Subir bloques asociados
      if (template.blocks && template.blocks.length > 0) {
        const blocksToInsert = template.blocks.map((b, idx) => ({
          template_id: templateId,
          position: idx,
          title: b.title,
          type: b.type,
          sets: b.sets,
          work_duration_seconds: b.workDurationSeconds,
          rest_duration_seconds: b.restDurationSeconds,
          repetitions: b.repetitions,
          attempts: b.attempts,
          problems: b.problems,
          movements: b.movements,
          target: b.target,
          notes: b.notes,
        }));

        await supabase.from('workout_blocks').insert(blocksToInsert);
      }
    } catch (err) {
      console.warn('Error al guardar plantilla en Supabase:', err);
    }
  }

  /**
   * Sincronizar Sesiones de Entrenamiento
   */
  async syncSessions(userId: string) {
    if (!supabase) return;

    const { data: remoteSessions, error } = await supabase
      .from('workout_sessions')
      .select('*, block_logs(*)')
      .order('started_at', { ascending: false });

    if (error || !remoteSessions) return;

    const formattedSessions: WorkoutSession[] = remoteSessions.map((s: Record<string, unknown>) => ({
      id: s.id as string,
      userId: s.user_id as string,
      templateId: s.template_id as string | undefined,
      title: s.title as string,
      startedAt: s.started_at as string,
      completedAt: s.completed_at as string | undefined,
      durationSeconds: Number(s.duration_seconds) || 0,
      overallRpe: s.overall_rpe ? Number(s.overall_rpe) : undefined,
      status: s.status as WorkoutSession['status'],
      notes: s.notes as string | undefined,
      blocks: [],
      logs: ((s.block_logs as Array<Record<string, unknown>>) || []).map((l) => ({
        id: l.id as string,
        sessionId: l.session_id as string,
        position: Number(l.position) || 0,
        blockTitle: l.block_title as string,
        blockType: l.block_type as WorkoutBlock['type'],
        status: l.status as BlockLog['status'],
        completedSets: Number(l.completed_sets) || 0,
        targetSets: Number(l.completed_sets) || 0,
        actualWorkSeconds: Number(l.actual_work_seconds) || 0,
        actualRestSeconds: Number(l.actual_rest_seconds) || 0,
        rpe: l.rpe ? Number(l.rpe) : undefined,
        notes: l.notes as string | undefined,
      })),
    }));

    // Fusionar con el store local
    const localStore = useWorkoutStore.getState();
    const remoteIds = new Set(formattedSessions.map((s) => s.id));

    // Subir sesiones locales pendientes
    for (const localSession of localStore.sessions) {
      if (!remoteIds.has(localSession.id)) {
        await this.pushSession(localSession, userId);
      }
    }

    if (formattedSessions.length > 0) {
      useWorkoutStore.setState({ sessions: formattedSessions });
    }
  }

  /**
   * Subir una sesión completada a Supabase
   */
  async pushSession(session: WorkoutSession, userId: string) {
    if (!supabase) return;

    try {
      const { data: sessionData, error: sessionErr } = await supabase
        .from('workout_sessions')
        .upsert({
          user_id: userId,
          template_id: session.templateId && !session.templateId.startsWith('template-') ? session.templateId : null,
          title: session.title,
          started_at: session.startedAt,
          completed_at: session.completedAt,
          duration_seconds: session.durationSeconds,
          overall_rpe: session.overallRpe,
          status: session.status,
          notes: session.notes,
        })
        .select()
        .single();

      if (sessionErr || !sessionData) return;

      const sessionId = sessionData.id;

      if (session.logs && session.logs.length > 0) {
        const logsToInsert = session.logs.map((log, idx) => ({
          session_id: sessionId,
          position: idx,
          block_title: log.blockTitle,
          block_type: log.blockType,
          status: log.status,
          completed_sets: log.completedSets,
          actual_work_seconds: log.actualWorkSeconds,
          actual_rest_seconds: log.actualRestSeconds,
          rpe: log.rpe,
          notes: log.notes,
        }));

        await supabase.from('block_logs').insert(logsToInsert);
      }
    } catch (err) {
      console.warn('Error al guardar sesión en Supabase:', err);
    }
  }

  /**
   * Sincronizar Tests Físicos
   */
  async syncTests(userId: string) {
    if (!supabase) return;

    const { data: remoteTests, error } = await supabase
      .from('tests')
      .select('*')
      .order('tested_at', { ascending: false });

    if (error || !remoteTests) return;

    const formattedTests: TestRecord[] = remoteTests.map((t: Record<string, unknown>) => ({
      id: t.id as string,
      userId: t.user_id as string,
      title: t.title as string,
      protocol: t.protocol as string | undefined,
      value: Number(t.value),
      unit: t.unit as string,
      testedAt: t.tested_at as string,
      notes: t.notes as string | undefined,
      createdAt: t.created_at as string,
    }));

    const localStore = useTestStore.getState();
    const remoteIds = new Set(formattedTests.map((t) => t.id));

    // Subir tests locales pendientes
    for (const localTest of localStore.tests) {
      if (!remoteIds.has(localTest.id)) {
        await this.pushTest(localTest, userId);
      }
    }

    if (formattedTests.length > 0) {
      useTestStore.setState({ tests: formattedTests });
    }
  }

  /**
   * Subir un test físico a Supabase
   */
  async pushTest(test: TestRecord, userId: string) {
    if (!supabase) return;

    try {
      await supabase.from('tests').insert({
        user_id: userId,
        title: test.title,
        protocol: test.protocol,
        value: test.value,
        unit: test.unit,
        tested_at: test.testedAt,
        notes: test.notes,
      });
    } catch (err) {
      console.warn('Error al guardar test en Supabase:', err);
    }
  }

  /**
   * Eliminar una plantilla de Supabase
   */
  async deleteTemplate(id: string) {
    if (!supabase) return;
    try {
      await supabase.from('workout_templates').delete().eq('id', id);
    } catch {}
  }

  /**
   * Eliminar una sesión de Supabase
   */
  async deleteSession(id: string) {
    if (!supabase) return;
    try {
      await supabase.from('workout_sessions').delete().eq('id', id);
    } catch {}
  }

  /**
   * Eliminar un test de Supabase
   */
  async deleteTest(id: string) {
    if (!supabase) return;
    try {
      await supabase.from('tests').delete().eq('id', id);
    } catch {}
  }
}

export const syncService = new SupabaseSyncService();
