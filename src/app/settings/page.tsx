'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Volume2,
  VolumeX,
  Vibrate,
  Bell,
  BellOff,
  Moon,
  Sun,
  Database,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { useSettingsStore } from '@/lib/store/settingsStore';
import { useWorkoutStore } from '@/lib/store/workoutStore';
import { useTestStore } from '@/lib/store/testStore';
import { useAuthStore } from '@/lib/supabase/authStore';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const {
    soundEnabled,
    setSoundEnabled,
    vibrationEnabled,
    setVibrationEnabled,
    darkMode,
    toggleDarkMode,
    autoStartRest,
    setAutoStartRest,
    notificationsEnabled,
    setNotificationsEnabled,
  } = useSettingsStore();

  const { sessions } = useWorkoutStore();
  const { tests } = useTestStore();

  const [notifMessage, setNotifMessage] = useState<string | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported' | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotifPermission('unsupported');
      return;
    }
    setNotifPermission(Notification.permission);
  }, []);

  const handleTestNotification = async () => {
    setNotifMessage(null);
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      setNotifMessage('Este navegador no soporta Service Workers, así que no puede mostrar notificaciones.');
      return;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification('CRUX', {
        body: 'Notificación de prueba — si ves esto, el sistema funciona correctamente.',
        tag: 'crux-test-notification',
        icon: '/icons/icon-192.svg',
        badge: '/icons/icon-192.svg',
      });
    } catch (err) {
      setNotifMessage(`No se pudo mostrar la notificación de prueba: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      setNotifMessage(null);
      return;
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotifMessage('Tu navegador no soporta notificaciones.');
      return;
    }

    if (Notification.permission === 'granted') {
      setNotificationsEnabled(true);
      setNotifMessage(null);
      return;
    }

    if (Notification.permission === 'denied') {
      setNotifMessage('Bloqueaste las notificaciones para CRUX. Actívalas desde los ajustes de sitio de tu navegador.');
      return;
    }

    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      setNotifMessage(null);
    } else {
      setNotifMessage('No se concedió el permiso de notificaciones.');
    }
  };

  const handleExportData = () => {
    const data = {
      cruxExportVersion: 1,
      exportedAt: new Date().toISOString(),
      sessions,
      tests,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crux-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-bold text-graphite-600 dark:text-graphite-400 hover:text-terracotta transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Inicio
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black tracking-tight text-graphite-950 dark:text-white">
          Ajustes y Preferencias
        </h1>
        <p className="text-xs text-graphite-500 mt-0.5">
          Configuración del temporizador, accesibilidad y sincronización
        </p>
      </div>

      {/* 1. Temporizador y Feedback */}
      <div className="bg-white dark:bg-graphite-900 p-5 rounded-3xl border border-chalk-300 dark:border-graphite-800 shadow-sm space-y-4">
        <h2 className="font-bold text-sm text-graphite-900 dark:text-graphite-100 uppercase tracking-wider">
          Temporizador y Alertas
        </h2>

        <div className="divide-y divide-chalk-200 dark:divide-graphite-800">
          {/* Sonido */}
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-terracotta-100 dark:bg-terracotta-900/40 text-terracotta flex items-center justify-center">
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <div className="font-bold text-sm text-graphite-900 dark:text-graphite-100">
                  Sonidos de Transición
                </div>
                <div className="text-xs text-graphite-500">
                  Beeps de 3-2-1 y acordes al cambiar de fase
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                soundEnabled ? 'bg-terracotta' : 'bg-chalk-300 dark:bg-graphite-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Vibración */}
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-moss-100 dark:bg-moss-900/40 text-moss flex items-center justify-center">
                <Vibrate className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-graphite-900 dark:text-graphite-100">
                  Vibración Háptica
                </div>
                <div className="text-xs text-graphite-500">
                  Patrón de vibración en cambios de fase (móvil)
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setVibrationEnabled(!vibrationEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                vibrationEnabled ? 'bg-moss' : 'bg-chalk-300 dark:bg-graphite-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  vibrationEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Auto Descanso */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-graphite-900 dark:text-graphite-100">
                Iniciar Descanso Automático
              </div>
              <div className="text-xs text-graphite-500">
                Arrancar descanso tan pronto termina el trabajo
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAutoStartRest(!autoStartRest)}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                autoStartRest ? 'bg-terracotta' : 'bg-chalk-300 dark:bg-graphite-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  autoStartRest ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Notificaciones en segundo plano */}
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </div>
              <div>
                <div className="font-bold text-sm text-graphite-900 dark:text-graphite-100">
                  Notificación del Temporizador
                </div>
                <div className="text-xs text-graphite-500">
                  Cuenta atrás en la bandeja de notificaciones al salir de la app. Mejor esfuerzo: fiable en Android, no funciona en iPhone (limitación de Apple para apps web).
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleNotifications}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                notificationsEnabled ? 'bg-terracotta' : 'bg-chalk-300 dark:bg-graphite-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  notificationsEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {notifPermission && (
            <div className="pt-1 pb-2 flex items-center justify-between gap-2 text-xs">
              <span className="text-graphite-500">
                Permiso del navegador:{' '}
                <strong className="font-mono text-graphite-700 dark:text-graphite-300">
                  {notifPermission === 'granted'
                    ? 'concedido'
                    : notifPermission === 'denied'
                    ? 'denegado'
                    : notifPermission === 'unsupported'
                    ? 'no soportado'
                    : 'no solicitado'}
                </strong>
              </span>
              {notifPermission === 'granted' && (
                <button
                  type="button"
                  onClick={handleTestNotification}
                  className="font-bold text-terracotta hover:underline"
                >
                  Probar notificación
                </button>
              )}
            </div>
          )}

          {notifMessage && (
            <div className="mt-1 mb-2 p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{notifMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Apariencia */}
      <div className="bg-white dark:bg-graphite-900 p-5 rounded-3xl border border-chalk-300 dark:border-graphite-800 shadow-sm space-y-4">
        <h2 className="font-bold text-sm text-graphite-900 dark:text-graphite-100 uppercase tracking-wider">
          Apariencia
        </h2>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center">
              {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <div className="font-bold text-sm text-graphite-900 dark:text-graphite-100">
                Modo Oscuro
              </div>
              <div className="text-xs text-graphite-500">
                Fondo grafito de alto contraste para rocódromos oscuros
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleDarkMode}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              darkMode ? 'bg-terracotta' : 'bg-chalk-300 dark:bg-graphite-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 3. Base de Datos y Supabase */}
      <div className="bg-white dark:bg-graphite-900 p-5 rounded-3xl border border-chalk-300 dark:border-graphite-800 shadow-sm space-y-4">
        <h2 className="font-bold text-sm text-graphite-900 dark:text-graphite-100 uppercase tracking-wider">
          Base de Datos en la Nube
        </h2>

        <div className="p-4 rounded-2xl bg-chalk-100 dark:bg-graphite-850 flex items-start gap-3 border border-chalk-200 dark:border-graphite-800">
          <Database className="w-5 h-5 text-terracotta shrink-0 mt-0.5" />
          <div className="text-xs space-y-1.5 flex-1">
            <div className="font-bold text-graphite-900 dark:text-graphite-100 flex items-center justify-between">
              <span>Estado: {isSupabaseConfigured ? 'Supabase Conectado' : 'Supabase No Configurado'}</span>
              {isSupabaseConfigured && (
                <span className="inline-flex items-center gap-1 text-moss font-bold">
                  <CheckCircle className="w-3.5 h-3.5" /> Activo
                </span>
              )}
            </div>

            {user ? (
              <p className="text-graphite-600 dark:text-graphite-300">
                Sesión iniciada como <strong className="text-graphite-900 dark:text-white font-mono">{user.email}</strong>. Todos tus entrenamientos y tests se leen y guardan directamente en tu base de datos de Supabase.
              </p>
            ) : (
              <p className="text-graphite-500">
                {isSupabaseConfigured
                  ? 'Inicia sesión para acceder a tu historial y tests almacenados en Supabase.'
                  : 'CRUX necesita Supabase para funcionar. Configura `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en `.env.local`.'}
              </p>
            )}
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <Button variant="outline" size="sm" onClick={handleExportData} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-1.5" />
            Exportar Backup JSON
          </Button>

          {user && (
            <Button
              variant="primary"
              size="sm"
              onClick={async () => {
                await Promise.all([
                  useWorkoutStore.getState().fetchAll(user.id),
                  useTestStore.getState().fetchAll(user.id),
                ]);
                alert('¡Datos recargados desde Supabase!');
              }}
              className="w-full sm:w-auto"
            >
              <Database className="w-4 h-4 mr-1.5" />
              Recargar Datos
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
