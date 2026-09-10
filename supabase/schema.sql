-- =========================================================
-- CRUX - Esquema de Base de Datos para Supabase
-- Sistema de Planificación, Ejecución y Registro de Escalada
-- =========================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. Tabla: profiles (Perfil público de usuario)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 1. Tabla: workout_sessions (Sesiones de entrenamiento ejecutadas)
-- Cada sesión guarda sus propios ejercicios (bloques) serializados en `notes` — no hay
-- plantillas ni catálogo compartido, cada ejercicio se define y prescribe en su sesión.
-- Tipos de ejercicio admitidos dentro de blocks:
-- 'intervals' (Series + Tiempo Trabajo + Descanso entre series + Descanso entre reps)
-- 'reps' (Series + Repeticiones + Descanso entre series + Descanso entre reps)
-- 'attempts' (Series + Intentos + Descanso entre series + Descanso entre intentos)
-- 'problems' (Bloques + Movimientos + Intentos por bloque + Descanso entre series + Descanso entre reps)
-- 'free' (Registro libre con objetivo y notas, sin temporizador)
CREATE TABLE IF NOT EXISTS public.workout_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    overall_rpe INTEGER CHECK (overall_rpe BETWEEN 1 AND 10),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Tabla: block_logs (Registro detallado de ejecución por bloque)
CREATE TABLE IF NOT EXISTS public.block_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    block_id UUID,
    position INTEGER NOT NULL DEFAULT 0,
    block_title TEXT NOT NULL,
    block_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
    completed_sets INTEGER DEFAULT 0,
    actual_work_seconds INTEGER DEFAULT 0,
    actual_rest_seconds INTEGER DEFAULT 0,
    rpe INTEGER CHECK (rpe BETWEEN 1 AND 10),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Tabla: tests (Tests físicos y marcas de progreso)
CREATE TABLE IF NOT EXISTS public.tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    protocol TEXT,
    value NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    tested_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================
-- ÍNDICES PARA RENDIMIENTO
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON public.workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_started_at ON public.workout_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_block_logs_session_id ON public.block_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_tests_user_id ON public.tests(user_id);
CREATE INDEX IF NOT EXISTS idx_tests_title_tested_at ON public.tests(user_id, title, tested_at DESC);

-- =========================================================
-- ROW LEVEL SECURITY (RLS)
-- Cada usuario solo puede ver y modificar sus propios datos
-- =========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Políticas para workout_sessions
CREATE POLICY "Users can view their own workout sessions"
    ON public.workout_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout sessions"
    ON public.workout_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout sessions"
    ON public.workout_sessions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout sessions"
    ON public.workout_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para block_logs
CREATE POLICY "Users can view logs of their sessions"
    ON public.block_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workout_sessions
            WHERE public.workout_sessions.id = public.block_logs.session_id
            AND public.workout_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert logs in their sessions"
    ON public.block_logs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workout_sessions
            WHERE public.workout_sessions.id = public.block_logs.session_id
            AND public.workout_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update logs in their sessions"
    ON public.block_logs FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.workout_sessions
            WHERE public.workout_sessions.id = public.block_logs.session_id
            AND public.workout_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete logs from their sessions"
    ON public.block_logs FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.workout_sessions
            WHERE public.workout_sessions.id = public.block_logs.session_id
            AND public.workout_sessions.user_id = auth.uid()
        )
    );

-- Políticas para tests
CREATE POLICY "Users can view their own tests"
    ON public.tests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tests"
    ON public.tests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tests"
    ON public.tests FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tests"
    ON public.tests FOR DELETE
    USING (auth.uid() = user_id);

-- =========================================================
-- TRIGGER PARA REGISTRO AUTOMÁTICO DE USUARIOS
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparador después de la creación de usuario en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
