import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TestRecord } from '../types';

interface TestStore {
  tests: TestRecord[];
  addTest: (test: Omit<TestRecord, 'id' | 'createdAt'>) => TestRecord;
  deleteTest: (id: string) => void;
  getTestsByTitle: (title: string) => TestRecord[];
  getPreviousTest: (title: string, currentTestDate: string) => TestRecord | undefined;
  getUniqueTitles: () => string[];
  clearTestStore: () => void;
}

export const useTestStore = create<TestStore>()(
  persist(
    (set, get) => ({
      tests: [],

      addTest: (testData) => {
        const id = `test-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const newTest: TestRecord = {
          ...testData,
          id,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          tests: [newTest, ...state.tests],
        }));

        return newTest;
      },

      deleteTest: (id) => {
        set((state) => ({
          tests: state.tests.filter((t) => t.id !== id),
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
        set({ tests: [] });
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
  unit: string = ''
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
  const isPositive = deltaValue > 0;
  const isNeutral = deltaValue === 0;
  const isImprovement = deltaValue > 0;
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
