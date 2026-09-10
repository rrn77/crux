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
}

const INITIAL_TESTS: TestRecord[] = [
  {
    id: 'test-1',
    title: 'Suspensiones 20 mm (Lastre máx)',
    protocol: '5 segundos en semiarqueo estricto a 90°',
    value: 20,
    unit: 'kg',
    testedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    notes: 'Lastre con cinturón. Buena sensación.',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'test-2',
    title: 'Suspensiones 20 mm (Lastre máx)',
    protocol: '5 segundos en semiarqueo estricto a 90°',
    value: 22.5,
    unit: 'kg',
    testedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    notes: 'Mejora clara en la solidez del hombro.',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'test-3',
    title: 'Dominada con Lastre (1RM)',
    protocol: '1 repetición completa pasando barbilla',
    value: 35,
    unit: 'kg',
    testedAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    notes: 'Primer test del mes.',
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
  },
  {
    id: 'test-4',
    title: 'Dominada con Lastre (1RM)',
    protocol: '1 repetición completa pasando barbilla',
    value: 37.5,
    unit: 'kg',
    testedAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    notes: 'Sensación potente al arranque.',
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    id: 'test-5',
    title: 'Tiempo Máx Suspensión 20 mm',
    protocol: 'Suspensión isométrica a dos manos peso corporal',
    value: 38,
    unit: 's',
    testedAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    notes: 'Resistencia pura de dedos.',
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
];

export const useTestStore = create<TestStore>()(
  persist(
    (set, get) => ({
      tests: INITIAL_TESTS,

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
          .tests.filter((t) => t.title.toLowerCase().trim() === title.toLowerCase().trim())
          .sort((a, b) => new Date(a.testedAt).getTime() - new Date(b.testedAt).getTime());
      },

      getPreviousTest: (title, currentTestDate) => {
        const matching = get()
          .tests.filter(
            (t) =>
              t.title.toLowerCase().trim() === title.toLowerCase().trim() &&
              new Date(t.testedAt).getTime() < new Date(currentTestDate).getTime()
          )
          .sort((a, b) => new Date(b.testedAt).getTime() - new Date(a.testedAt).getTime());

        return matching[0];
      },

      getUniqueTitles: () => {
        const setTitles = new Set(get().tests.map((t) => t.title.trim()));
        return Array.from(setTitles);
      },
    }),
    {
      name: 'crux-tests-store',
    }
  )
);

/**
 * Calcula la diferencia entre un test y su registro previo
 */
export function calculateTestDelta(currentVal: number, previousVal?: number, unit?: string) {
  if (previousVal === undefined || previousVal === null) return null;

  const diff = Number((currentVal - previousVal).toFixed(2));
  const percent = previousVal !== 0 ? Number(((diff / previousVal) * 100).toFixed(1)) : 0;
  const isPositive = diff > 0;
  const isNeutral = diff === 0;

  return {
    diff,
    percent,
    isPositive,
    isNeutral,
    formatted: `${diff > 0 ? '+' : ''}${diff} ${unit || ''} (${diff > 0 ? '+' : ''}${percent}%)`,
  };
}
