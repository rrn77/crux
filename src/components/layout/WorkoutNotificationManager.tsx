'use client';

import { useEffect } from 'react';
import { useActiveWorkoutStore } from '@/lib/store/activeWorkoutStore';
import { useSettingsStore } from '@/lib/store/settingsStore';
import { formatSecondsToTime } from '@/lib/timer/durationHelper';

const NOTIFICATION_TAG = 'crux-workout-timer';

function phaseLabel(phase: string): string {
  switch (phase) {
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

/**
 * Muestra una notificación del sistema con la cuenta atrás mientras el usuario ha salido
 * de la app (pestaña/app en segundo plano) con un entrenamiento activo. Es "mejor esfuerzo":
 * solo se actualiza mientras el navegador mantenga el proceso vivo en segundo plano, lo que
 * en la práctica solo es fiable en Android — iOS Safari suspende la ejecución en cuanto la
 * PWA deja de estar en primer plano, así que ahí simplemente no llegará a actualizarse.
 */
export function WorkoutNotificationManager() {
  const isActive = useActiveWorkoutStore((s) => s.isActive);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);

  // Cerrar la notificación en cuanto se recupera el foco o termina/aborta la sesión
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        closeWorkoutNotification();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    if (!isActive) {
      closeWorkoutNotification();
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !notificationsEnabled) return;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window)) return;

    const intervalId = setInterval(async () => {
      if (document.visibilityState !== 'hidden') return;
      if (Notification.permission !== 'granted') return;

      const state = useActiveWorkoutStore.getState();
      if (!state.isActive || !state.session) return;

      const block = state.session.blocks[state.currentBlockIndex];
      const title = `${phaseLabel(state.timerState.phase)} · ${formatSecondsToTime(state.timerState.secondsRemaining)}`;
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
      } catch {}
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isActive, notificationsEnabled]);

  return null;
}
