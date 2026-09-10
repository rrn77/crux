'use client';

import React, { useState } from 'react';
import { LogIn, UserPlus, Flame, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/lib/supabase/authStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { signInWithEmail, signUpWithEmail, isLoading, errorMessage, clearError, isConfigured } =
    useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage(null);

    if (mode === 'login') {
      const res = await signInWithEmail(email, password);
      if (res.success) {
        onClose();
      }
    } else {
      const res = await signUpWithEmail(email, password, name);
      if (res.success) {
        setSuccessMessage('¡Cuenta creada con éxito! Si Supabase requiere confirmación, revisa tu email.');
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'login' ? 'Iniciar Sesión en CRUX' : 'Crear Cuenta en CRUX'}
      description="Sincroniza tus entrenamientos y tests en la nube de Supabase"
      maxWidth="sm"
    >
      <div className="space-y-4 pt-1">
        {/* Selector de Pestañas: Login vs Sign Up */}
        <div className="flex bg-chalk-200 dark:bg-graphite-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              clearError();
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-white dark:bg-graphite-900 text-terracotta shadow-sm'
                : 'text-graphite-600 dark:text-graphite-400 hover:text-graphite-900'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              clearError();
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-white dark:bg-graphite-900 text-terracotta shadow-sm'
                : 'text-graphite-600 dark:text-graphite-400 hover:text-graphite-900'
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Mensaje de Error */}
        {errorMessage && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2 animate-scale-up">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Mensaje de Éxito */}
        {successMessage && (
          <div className="p-3 bg-moss-100 dark:bg-moss-900/40 text-moss-900 dark:text-moss-200 rounded-xl text-xs flex items-center gap-2 animate-scale-up">
            <CheckCircle className="w-4 h-4 text-moss shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Aviso si Supabase no tiene credenciales en .env */}
        {!isConfigured && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-xl text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Modo Local Activo
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              Para conectar con la nube de Supabase, añade `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en tu `.env.local`. Mientras tanto, todos tus datos se guardan de forma segura en tu dispositivo.
            </p>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-3">
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
            disabled={isLoading || !isConfigured}
            className="mt-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Procesando...
              </span>
            ) : mode === 'login' ? (
              <span className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Entrar
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Crear Cuenta
              </span>
            )}
          </Button>
        </form>

        <div className="text-center pt-1">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-graphite-500 hover:text-graphite-800 dark:hover:text-graphite-200 underline"
          >
            Continuar usando CRUX sin iniciar sesión
          </button>
        </div>
      </div>
    </Modal>
  );
}
