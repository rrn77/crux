'use client';

import React, { useEffect, useState } from 'react';
import { Flame, LogIn, UserPlus, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/lib/supabase/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { user, isLoading, isConfigured, initAuth, signInWithEmail, signUpWithEmail, errorMessage, clearError } =
    useAuthStore();
  
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initAuth().catch(() => {});
  }, [initAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage(null);

    if (mode === 'login') {
      await signInWithEmail(email, password);
    } else {
      const res = await signUpWithEmail(email, password, name);
      if (res.success) {
        setSuccessMessage('¡Cuenta creada con éxito! Si tu proyecto requiere confirmación, revisa tu correo o inicia sesión.');
      }
    }
  };

  // Durante la carga inicial del estado de autenticación
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-chalk-100 dark:bg-graphite-950 p-4">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-16 h-16 rounded-2xl bg-terracotta flex items-center justify-center text-white shadow-xl shadow-terracotta/20">
            <Flame className="w-10 h-10 fill-current" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black tracking-widest text-graphite-950 dark:text-white">CRUX</h1>
            <p className="text-xs font-bold text-terracotta uppercase tracking-wider">Cargando sesión...</p>
          </div>
        </div>
      </div>
    );
  }

  // Si el usuario NO está autenticado, mostramos la pantalla de acceso obligatorio
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-chalk-100 dark:bg-graphite-950 p-4 sm:p-6">
        <div className="w-full max-w-md bg-white dark:bg-graphite-900 border border-chalk-300 dark:border-graphite-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-graphite-950/5 space-y-6 animate-scale-up">
          {/* Cabecera de Marca */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-terracotta flex items-center justify-center text-white shadow-md shadow-terracotta/20">
              <Flame className="w-8 h-8 fill-current" />
            </div>
            <h1 className="text-2xl font-black tracking-wider text-graphite-950 dark:text-white">
              CRUX
            </h1>
            <p className="text-xs font-semibold text-graphite-500 max-w-xs">
              Planificación, ejecución y registro de entrenamientos de escalada personalizados
            </p>
          </div>

          {/* Selector de Pestañas: Login vs Registro */}
          <div className="flex bg-chalk-200 dark:bg-graphite-800 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                clearError();
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-white dark:bg-graphite-900 text-terracotta shadow-sm'
                  : 'text-graphite-600 dark:text-graphite-400 hover:text-graphite-900 dark:hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                clearError();
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                mode === 'signup'
                  ? 'bg-white dark:bg-graphite-900 text-terracotta shadow-sm'
                  : 'text-graphite-600 dark:text-graphite-400 hover:text-graphite-900 dark:hover:text-white'
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          {/* Notificación de Error */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-2xl text-xs flex items-center gap-2.5 animate-scale-up">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Notificación de Éxito */}
          {successMessage && (
            <div className="p-3.5 bg-moss-100 dark:bg-moss-900/40 border border-moss-300 dark:border-moss-800 text-moss-900 dark:text-moss-200 rounded-2xl text-xs flex items-center gap-2.5 animate-scale-up">
              <CheckCircle className="w-4 h-4 text-moss shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Formulario de Login / Registro */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <Input
                label="Nombre o Apodo"
                placeholder="Ej: Álex Megos"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}

            <Input
              type="email"
              label="Correo Electrónico"
              placeholder="escalador@crux.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              type="password"
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              className="mt-2 py-3.5 shadow-md shadow-terracotta/20 font-bold"
            >
              {mode === 'login' ? (
                <span className="flex items-center justify-center gap-2">
                  <LogIn className="w-5 h-5" />
                  Acceder a mis entrenamientos
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Registrarme en CRUX
                </span>
              )}
            </Button>
          </form>

          {/* Pie informativo */}
          <div className="text-center pt-2">
            <p className="text-[11px] text-graphite-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-moss" />
              Tus entrenamientos, sesiones y marcas se guardan de forma privada y segura en tu cuenta.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Si el usuario está autenticado, renderiza la app normal
  return <>{children}</>;
}
