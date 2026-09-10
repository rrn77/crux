'use client';

import React from 'react';
import Link from 'next/link';
import {
  Volume2,
  VolumeX,
  Vibrate,
  Moon,
  Sun,
  Database,
  Download,
  Trash2,
  CheckCircle,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { useSettingsStore } from '@/lib/store/settingsStore';
import { useWorkoutStore } from '@/lib/store/workoutStore';
import { useTestStore } from '@/lib/store/testStore';
import { useAuthStore } from '@/lib/supabase/authStore';
import { syncService } from '@/lib/supabase/syncService';
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
  } = useSettingsStore();

  const { sessions, templates } = useWorkoutStore();
  const { tests } = useTestStore();

  const handleExportData = () => {
    const data = {
      cruxExportVersion: 1,
      exportedAt: new Date().toISOString(),
      templates,
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
          Persistencia y Sincronización en la Nube
        </h2>

        <div className="p-4 rounded-2xl bg-chalk-100 dark:bg-graphite-850 flex items-start gap-3 border border-chalk-200 dark:border-graphite-800">
          <Database className="w-5 h-5 text-terracotta shrink-0 mt-0.5" />
          <div className="text-xs space-y-1.5 flex-1">
            <div className="font-bold text-graphite-900 dark:text-graphite-100 flex items-center justify-between">
              <span>Estado: {isSupabaseConfigured ? 'Supabase Conectado' : 'Modo Local / Offline'}</span>
              {isSupabaseConfigured && (
                <span className="inline-flex items-center gap-1 text-moss font-bold">
                  <CheckCircle className="w-3.5 h-3.5" /> Activo
                </span>
              )}
            </div>

            {user ? (
              <p className="text-graphite-600 dark:text-graphite-300">
                Sesión iniciada como <strong className="text-graphite-900 dark:text-white font-mono">{user.email}</strong>. Tus entrenamientos se sincronizan automáticamente con tu base de datos.
              </p>
            ) : (
              <p className="text-graphite-500">
                {isSupabaseConfigured
                  ? 'Inicia sesión para sincronizar tus plantillas, historial y tests en la nube de Supabase.'
                  : 'La aplicación almacena tus datos de forma segura en tu navegador. Puedes añadir tus credenciales en `.env.local` para activar Supabase.'}
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
                const ok = await syncService.syncAll(user.id);
                alert(ok ? '¡Datos sincronizados con éxito con Supabase!' : 'Error al sincronizar datos.');
              }}
              className="w-full sm:w-auto"
            >
              <Database className="w-4 h-4 mr-1.5" />
              Sincronizar Ahora
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
