import { WorkoutTemplate } from '../lib/types';

export const DEFAULT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'template-ulac',
    title: 'ULAC (Umbral Láctico Acumulado)',
    description: 'Entrenamiento clásico de resistencia a la fuerza. Mantén una escalada fluida continua sin llegar al fallo total.',
    estimatedDurationSeconds: 4 * (180 + 60), // 16 min
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    blocks: [
      {
        id: 'block-ulac-1',
        position: 0,
        title: 'ULAC 3x1',
        type: 'intervals',
        sets: 4,
        workDurationSeconds: 180, // 3:00
        restDurationSeconds: 60,  // 1:00
        target: 'Intensidad 70-75% - Continuidad',
        notes: '4 series de 3 minutos de trabajo continuo y 1 minuto de descanso activo.',
      },
    ],
  },
  {
    id: 'template-bloques-cortos',
    title: 'BLOQUES CORTOS',
    description: 'Fuerza máxima y coordinación. Ejecuta 4 problemas de alta intensidad con intentos de calidad.',
    estimatedDurationSeconds: 4 * 4 * (25 + 90), // ~30 min
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    blocks: [
      {
        id: 'block-bc-1',
        position: 0,
        title: 'Bloques de Alta Intensidad',
        type: 'problems',
        problems: 4,
        movements: 5,
        attempts: 4,
        restDurationSeconds: 90, // 1:30
        target: 'Proyectos a tu límite (RPE 9)',
        notes: '4 bloques de 5 movimientos. Máximo 4 intentos por bloque con 1:30 de reposo entre pegues.',
      },
    ],
  },
  {
    id: 'template-hangboard-20mm',
    title: 'Suspensiones 20 mm (Max Hangs)',
    description: 'Protocolo de fuerza máxima de dedos en regleta de 20 mm. Añade lastre si es necesario.',
    estimatedDurationSeconds: 6 * (7 + 180), // ~18 min
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    blocks: [
      {
        id: 'block-hangboard-1',
        position: 0,
        title: 'Suspensiones 20 mm',
        type: 'intervals',
        sets: 6,
        workDurationSeconds: 7,   // 7s
        restDurationSeconds: 180, // 3:00
        target: 'Regleta 20 mm - Semiarqueo',
        notes: '6 suspensiones de 7 segundos a máxima intensidad con 3 minutos de descanso completo.',
      },
    ],
  },
  {
    id: 'template-core-escalador',
    title: 'Core Específico para Escalada',
    description: 'Tensión corporal, palancas y estabilidad de hombros para mantener los pies en la pared.',
    estimatedDurationSeconds: 3 * (12 * 4 + 60), // ~5 min
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    blocks: [
      {
        id: 'block-core-1',
        position: 0,
        title: 'Dragon Flags / Elevaciones L-Sit',
        type: 'reps',
        sets: 3,
        repetitions: 12,
        restDurationSeconds: 60,
        target: 'Control excéntrico',
        notes: '3 series de 12 repeticiones con 1 minuto de descanso entre series.',
      },
    ],
  },
  {
    id: 'template-sesion-completa',
    title: 'Sesión Combinada: Dedos + Bloque',
    description: 'Sesión integral que combina fuerza de dedos en multipresa y transferencia a problemas duros.',
    estimatedDurationSeconds: 6 * (7 + 180) + 4 * 4 * (25 + 90) + 300,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    blocks: [
      {
        id: 'block-comb-1',
        position: 0,
        title: 'Calentamiento Libre y Movilidad',
        type: 'free',
        target: 'Movilidad articular y travesías suaves',
        notes: '10 minutos de movilidad, hombros con elástico y pies en placa.',
      },
      {
        id: 'block-comb-2',
        position: 1,
        title: 'Suspensiones 20 mm',
        type: 'intervals',
        sets: 5,
        workDurationSeconds: 7,
        restDurationSeconds: 180,
        target: 'Semiarqueo estricto',
        notes: 'Descanso de 3 min estricto entre series.',
      },
      {
        id: 'block-comb-3',
        position: 2,
        title: 'Bloques de Coordinación y Potencia',
        type: 'problems',
        problems: 3,
        movements: 6,
        attempts: 3,
        restDurationSeconds: 120,
        target: 'Problemas desplomados',
        notes: 'Enfócate en la colocación de talones y empeines.',
      },
    ],
  },
];
