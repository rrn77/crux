import { create } from 'zustand';
import { TestRecord, TestSet } from '../types';
import { supabase } from '../supabase/client';

interface TestStore {
  tests: TestRecord[];
  userId: string | null;
  isLoading: boolean;

  setUserId: (userId: string | null) => void;
  fetchAll: (userId: string) => Promise<void>;

  addTest: (test: Omit<TestRecord, 'id' | 'createdAt'>) => Promise<TestRecord>;
  updateTest: (id: string, test: Partial<TestRecord>) => Promise<void>;
  deleteTest: (id: string) => Promise<void>;
  getTestsByTitle: (title: string) => TestRecord[];
  getPreviousTest: (title: string, currentTestDate: string) => TestRecord | undefined;
  getUniqueTitles: () => string[];
  clearTestStore: () => void;
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// El esquema de Supabase no tiene columnas propias para las series individuales ni el
// criterio de mejora, así que viajan serializados dentro de `notes`.
function serializeNotesAndSets(
  notes?: string,
  sets?: TestSet[],
  targetMetric?: 'higher_is_better' | 'lower_is_better'
): string | undefined {
  if ((!sets || sets.length === 0) && (!targetMetric || targetMetric === 'higher_is_better')) {
    return notes;
  }
  return `[SETS]:${JSON.stringify({ notes: notes || '', sets, targetMetric })}`;
}

function deserializeNotesAndSets(rawNotes?: string): {
  notes?: string;
  sets?: TestSet[];
  targetMetric?: 'higher_is_better' | 'lower_is_better';
} {
  if (!rawNotes) return { notes: undefined, sets: undefined, targetMetric: undefined };
  if (rawNotes.startsWith('[SETS]:')) {
    try {
      const parsed = JSON.parse(rawNotes.slice(7));
      return {
        notes: parsed.notes || undefined,
        sets: parsed.sets && parsed.sets.length > 0 ? parsed.sets : undefined,
        targetMetric: parsed.targetMetric || undefined,
      };
    } catch {
      return { notes: rawNotes, sets: undefined, targetMetric: undefined };
    }
  }
  return { notes: rawNotes, sets: undefined, targetMetric: undefined };
}

function mapRemoteTest(t: Record<string, unknown>): TestRecord {
  const { notes, sets, targetMetric } = deserializeNotesAndSets(t.notes as string | undefined);
  return {
    id: t.id as string,
    userId: t.user_id as string,
    title: t.title as string,
    protocol: t.protocol as string | undefined,
    value: Number(t.value),
    unit: t.unit as string,
    testedAt: t.tested_at as string,
    notes,
    sets,
    targetMetric,
    createdAt: t.created_at as string,
  };
}

export const useTestStore = create<TestStore>()((set, get) => ({
  tests: [],
  userId: null,
  isLoading: false,

  setUserId: (userId) => set({ userId }),

  fetchAll: async (userId) => {
    if (!supabase) return;
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('user_id', userId)
        .order('tested_at', { ascending: false });
      if (error) throw error;
      set({ tests: (data || []).map(mapRemoteTest) });
    } catch (err) {
      console.warn('Error al cargar tests desde Supabase:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  addTest: async (testData) => {
    const userId = get().userId;
    const id = generateUUID();
    const newTest: TestRecord = {
      ...testData,
      id,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({ tests: [newTest, ...state.tests] }));

    if (supabase && userId) {
      try {
        const { error } = await supabase.from('tests').insert({
          id,
          user_id: userId,
          title: newTest.title,
          protocol: newTest.protocol,
          value: newTest.value,
          unit: newTest.unit,
          tested_at: newTest.testedAt,
          notes: serializeNotesAndSets(newTest.notes, newTest.sets, newTest.targetMetric),
        });
        if (error) throw error;
      } catch (err) {
        console.warn('Error al guardar test en Supabase:', err);
      }
    }

    return newTest;
  },

  updateTest: async (id, data) => {
    set((state) => ({
      tests: state.tests.map((t) => (t.id === id ? { ...t, ...data } : t)),
    }));

    if (!supabase) return;
    try {
      const test = get().tests.find((t) => t.id === id);
      if (!test) return;

      const { error } = await supabase
        .from('tests')
        .update({
          title: test.title,
          protocol: test.protocol,
          value: test.value,
          unit: test.unit,
          tested_at: test.testedAt,
          notes: serializeNotesAndSets(test.notes, test.sets, test.targetMetric),
        })
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.warn('Error al actualizar test en Supabase:', err);
    }
  },

  deleteTest: async (id) => {
    set((state) => ({ tests: state.tests.filter((t) => t.id !== id) }));

    if (!supabase) return;
    try {
      const { error } = await supabase.from('tests').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.warn('Error al eliminar test en Supabase:', err);
    }
  },

  getTestsByTitle: (title) => {
    return get()
      .tests.filter((t) => t.title.toLowerCase() === title.toLowerCase())
      .sort((a, b) => new Date(b.testedAt).getTime() - new Date(a.testedAt).getTime());
  },

  getPreviousTest: (title, currentTestDate) => {
    const currentTimestamp = new Date(currentTestDate).getTime();
    const sameTypeTests = get()
      .tests.filter(
        (t) =>
          t.title.toLowerCase() === title.toLowerCase() &&
          new Date(t.testedAt).getTime() < currentTimestamp
      )
      .sort((a, b) => new Date(b.testedAt).getTime() - new Date(a.testedAt).getTime());

    return sameTypeTests[0];
  },

  getUniqueTitles: () => {
    const titles = get().tests.map((t) => t.title);
    return Array.from(new Set(titles));
  },

  clearTestStore: () => {
    set({ tests: [], userId: null, isLoading: false });
  },
}));

/**
 * Helper para calcular la diferencia (delta) entre dos tests del mismo tipo
 */
export function calculateTestDelta(
  currentValue: number,
  previousValue?: number,
  unit: string = '',
  targetMetric: 'higher_is_better' | 'lower_is_better' = 'higher_is_better'
): {
  deltaValue: number;
  percentage: number;
  isImprovement: boolean;
  isPositive: boolean;
  isNeutral: boolean;
  formatted: string;
} | null {
  if (previousValue === undefined || previousValue === null) return null;

  const deltaValue = currentValue - previousValue;
  const percentage = previousValue !== 0 ? (deltaValue / previousValue) * 100 : 0;
  const isNeutral = deltaValue === 0;

  // Si targetMetric === 'lower_is_better' (ej: mm de regleta o tiempo):
  // Disminuir (deltaValue < 0) es MEJORA (isImprovement = true)
  // Aumentar (deltaValue > 0) es EMPEORAMIENTO (isImprovement = false)
  const isImprovement = targetMetric === 'lower_is_better' ? deltaValue < 0 : deltaValue > 0;
  const isPositive = deltaValue > 0;
  const sign = deltaValue > 0 ? '+' : '';
  const formatted = `${sign}${Math.round(deltaValue * 10) / 10} ${unit} (${sign}${Math.round(percentage * 10) / 10}%)`;

  return {
    deltaValue: Math.round(deltaValue * 10) / 10,
    percentage: Math.round(percentage * 10) / 10,
    isImprovement,
    isPositive,
    isNeutral,
    formatted,
  };
}

export interface SetFatigueAnalysis {
  setNumber: number;
  value: number;
  percentageOfFirst: number;
  deltaFromFirst: number;
  percentageDrop: number;
  isLoss: boolean;
  notes?: string;
}

export interface TestFatigueSummary {
  totalSets: number;
  peakValue: number;
  firstValue: number;
  lastValue: number;
  averageValue: number;
  totalDropAbsolute: number;
  totalDropPercentage: number;
  isTotalLoss: boolean;
  setsAnalysis: SetFatigueAnalysis[];
}

/**
 * Helper para calcular la fatiga acumulada entre series de un mismo test
 */
export function calculateTestFatigue(
  sets?: TestSet[],
  targetMetric: 'higher_is_better' | 'lower_is_better' = 'higher_is_better'
): TestFatigueSummary | null {
  if (!sets || sets.length === 0) return null;

  const firstValue = sets[0].value;
  const lastValue = sets[sets.length - 1].value;
  const peakValue =
    targetMetric === 'lower_is_better'
      ? Math.min(...sets.map((s) => s.value))
      : Math.max(...sets.map((s) => s.value));

  const sum = sets.reduce((acc, s) => acc + s.value, 0);
  const averageValue = Math.round((sum / sets.length) * 10) / 10;

  const totalDropAbsolute = Math.round((firstValue - lastValue) * 10) / 10;
  const totalDropPercentage =
    firstValue !== 0 ? Math.round(((lastValue - firstValue) / firstValue) * 1000) / 10 : 0;

  const isTotalLoss =
    targetMetric === 'lower_is_better' ? lastValue > firstValue : lastValue < firstValue;

  const setsAnalysis: SetFatigueAnalysis[] = sets.map((s) => {
    const deltaFromFirst = Math.round((s.value - firstValue) * 10) / 10;
    const percentageOfFirst =
      firstValue !== 0
        ? targetMetric === 'lower_is_better' && s.value !== 0
          ? Math.round((firstValue / s.value) * 1000) / 10
          : Math.round((s.value / firstValue) * 1000) / 10
        : 100;

    const percentageDrop =
      firstValue !== 0 ? Math.round(((s.value - firstValue) / firstValue) * 1000) / 10 : 0;

    const isLoss =
      targetMetric === 'lower_is_better' ? s.value > firstValue : s.value < firstValue;

    return {
      setNumber: s.setNumber,
      value: s.value,
      percentageOfFirst,
      deltaFromFirst,
      percentageDrop,
      isLoss,
      notes: s.notes,
    };
  });

  return {
    totalSets: sets.length,
    peakValue,
    firstValue,
    lastValue,
    averageValue,
    totalDropAbsolute,
    totalDropPercentage,
    isTotalLoss,
    setsAnalysis,
  };
}
