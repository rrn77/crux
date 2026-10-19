'use client';

import { useEffect } from 'react';
import { useActiveWorkoutStore } from '@/lib/store/activeWorkoutStore';
import { useSettingsStore } from '@/lib/store/settingsStore';
import { formatSecondsToTime } from '@/lib/timer/durationHelper';
import { calculateRemainingSeconds } from '@/lib/timer/timerEngine';

const NOTIFICATION_TAG = 'crux-workout-timer';

function phaseLabel(phase: string): string {
  switch (phase) {
    case 'preparation':
      return 'Preparación';
    case 'work':
      return 'Trabajo';
    case 'rest':
      return 'Descanso';
    case 'blockCompleted':
      return 'Bloque completado';
    default:
      return 'Entrenamiento';
  }
}

async function closeWorkoutNotification() {
  try {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return;
    const notifications = await reg.getNotifications({ tag: NOTIFICATION_TAG });
    notifications.forEach((n) => n.close());
  } catch {}
}

async function updateWorkoutNotification() {
  const state = useActiveWorkoutStore.getState();
  if (!state.isActive || !state.session) return;

  const block = state.session.blocks[state.currentBlockIndex];
  // Se recalcula desde el timestamp de la fase (no desde el contador de la store) para que
  // el valor mostrado sea correcto aunque el intervalo de esta pestaña se haya visto frenado
  // por el navegador mientras la app estaba en segundo plano.
  const remaining = calculateRemainingSeconds(state.timerState, Date.now());
  const title = `${phaseLabel(state.timerState.phase)} · ${formatSecondsToTime(remaining)}`;
  const body = block ? `${block.title} — ${state.session.title}` : state.session.title;

  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, {
      body,
      tag: NOTIFICATION_TAG,
      silent: true,
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
    });
  } catch (err) {
    console.warn('CRUX: no se pudo mostrar la notificación del temporizador', err);
  }
}

/**
 * Muestra una notificación del sistema con la cuenta atrás mientras hay un entrenamiento
 * activo, igual que el contador de un cronómetro/temporizador nativo — se actualiza tanto
 * en primer plano como en segundo plano, y se cierra al terminar/abandonar la sesión.
 * Es "mejor esfuerzo": solo sigue actualizándose mientras el navegador mantenga el proceso
 * vivo en segundo plano, lo que en la práctica solo es fiable en Android — iOS Safari
 * suspende la ejecución en cuanto la PWA deja de estar en primer plano.
 */
export function WorkoutNotificationManager() {
  const isActive = useActiveWorkoutStore((s) => s.isActive);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);

  useEffect(() => {
    if (!isActive) {
      closeWorkoutNotification();
      return;
    }

    if (!notificationsEnabled) return;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    updateWorkoutNotification();
    const intervalId = setInterval(updateWorkoutNotification, 1000);

    return () => clearInterval(intervalId);
  }, [isActive, notificationsEnabled]);

  return null;
}
