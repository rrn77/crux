import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TestRecord } from '../types';

interface TestStore {
  tests: TestRecord[];
  deletedTestIds: string[];
  addTest: (test: Omit<TestRecord, 'id' | 'createdAt'>) => TestRecord;
  updateTest: (id: string, test: Partial<TestRecord>) => void;
  deleteTest: (id: string) => void;
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

export const useTestStore = create<TestStore>()(
  persist(
    (set, get) => ({
      tests: [],
      deletedTestIds: [],

      addTest: (testData) => {
        const id = generateUUID();
        const newTest: TestRecord = {
          ...testData,
          id,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          tests: [newTest, ...state.tests],
          deletedTestIds: (state.deletedTestIds || []).filter((delId) => delId !== id),
        }));

        return newTest;
      },

      updateTest: (id, data) => {
        set((state) => ({
          tests: state.tests.map((t) => (t.id === id ? { ...t, ...data } : t)),
        }));
      },

      deleteTest: (id) => {
        set((state) => ({
          tests: state.tests.filter((t) => t.id !== id),
          deletedTestIds: Array.from(new Set([...(state.deletedTestIds || []), id])),
        }));
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
        set({ tests: [], deletedTestIds: [] });
      },
    }),
    {
      name: 'crux-tests-store',
    }
  )
);

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
  sets?: import('../types').TestSet[],
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
