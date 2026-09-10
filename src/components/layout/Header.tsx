'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Volume2, VolumeX, Moon, Sun, Flame, User as UserIcon, LogOut } from 'lucide-react';
import { useSettingsStore } from '@/lib/store/settingsStore';
import { useActiveWorkoutStore } from '@/lib/store/activeWorkoutStore';
import { useAuthStore } from '@/lib/supabase/authStore';
import { AuthModal } from '@/components/auth/AuthModal';

export function Header() {
  const { soundEnabled, setSoundEnabled, darkMode, toggleDarkMode } = useSettingsStore();
  const { isActive, session } = useActiveWorkoutStore();
  const { user, initAuth, signOut, isConfigured } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    initAuth().catch(() => {});
  }, [initAuth]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <header className="sticky top-0 z-40 bg-chalk-100/90 dark:bg-graphite-950/90 backdrop-blur-md border-b border-chalk-300 dark:border-graphite-800 transition-colors">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logotipo CRUX */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-terracotta flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-wider text-graphite-950 dark:text-white leading-none">
              CRUX
            </span>
            <span className="text-[9px] font-bold text-terracotta uppercase tracking-widest leading-none mt-0.5">
              Climbing Training
            </span>
          </div>
        </Link>

        {/* Acciones de cabecera */}
        <div className="flex items-center gap-1.5">
          {/* Indicador de Sesión Activa */}
          {mounted && isActive && session && (
            <Link
              href="/workout/active"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-terracotta-100 dark:bg-terracotta-900/40 text-terracotta-800 dark:text-terracotta-300 text-xs font-bold animate-pulse hover:bg-terracotta-200 transition-colors mr-1"
            >
              <span className="w-2 h-2 rounded-full bg-terracotta"></span>
              <span>En curso</span>
            </Link>
          )}

          {/* Botón Usuario / Auth */}
          {mounted && (
            user ? (
              <div className="flex items-center gap-1">
                <span className="hidden sm:inline-block text-[11px] font-bold font-mono bg-chalk-200 dark:bg-graphite-800 text-graphite-700 dark:text-graphite-300 px-2 py-1 rounded-lg truncate max-w-[100px]">
                  {user.email?.split('@')[0]}
                </span>
                <button
                  type="button"
                  onClick={() => signOut()}
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                  className="p-2 rounded-xl text-graphite-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                title="Iniciar sesión con Supabase"
                className="p-2 rounded-xl text-graphite-600 dark:text-graphite-300 hover:bg-chalk-200 dark:hover:bg-graphite-800 transition-colors"
              >
                <UserIcon className="w-5 h-5" />
              </button>
            )
          )}

          {/* Botón Sonido */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            aria-label={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}
            className="p-2 rounded-xl text-graphite-600 dark:text-graphite-300 hover:bg-chalk-200 dark:hover:bg-graphite-800 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-graphite-400" />}
          </button>

          {/* Botón Modo Oscuro */}
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="p-2 rounded-xl text-graphite-600 dark:text-graphite-300 hover:bg-chalk-200 dark:hover:bg-graphite-800 transition-colors"
          >
            {mounted && darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
}
