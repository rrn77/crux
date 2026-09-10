# 🧗 CRUX - Climbing Training App

**CRUX** es una aplicación web responsive y mobile-first diseñada para planificar, ejecutar y registrar entrenamientos de escalada personalizados y tests físicos de rendimiento.

---

## 🌟 Principio de Producto

CRUX **no impone un catálogo cerrado de ejercicios**. Puedes crear cualquier bloque de entrenamiento con un título libre y configurar su estructura exacta:
- **Intervalos:** Series + Duración de trabajo + Descanso (Ej: *ULAC: 4 series × 3:00 / descanso 1:00*, *Suspensiones 20mm: 6 series × 7s / descanso 3:00*).
- **Problemas / Bloques:** Número de problemas, movimientos por bloque, intentos por problema y descanso (Ej: *BLOQUES CORTOS: 4 bloques de 5 movs, 4 intentos c/u, 1:30 descanso*).
- **Repeticiones:** Series + Repeticiones + Descanso (Ej: *Core: 3 series × 12 reps, 1:00 descanso*).
- **Intentos:** Número de intentos libres + Descanso entre pegues.
- **Registro libre:** Título, objetivo e indicaciones sin temporizador forzado.

## 🌐 Despliegue en Vercel

1. Importa el repositorio `rrn77/crux` en [Vercel](https://vercel.com).
2. En **Project Settings > Environment Variables**, agrega:
   - `NEXT_PUBLIC_SUPABASE_URL`: Tu URL de proyecto Supabase.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Tu clave anon/publishable de Supabase.
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Tu clave anon/publishable de Supabase.
3. Cada push a la rama `main` despliega automáticamente una nueva versión de producción.

---

## 🚀 Tecnologías

- **Framework:** Next.js 14+ con App Router y TypeScript.
- **Estilos:** Tailwind CSS con paleta deportiva de alto contraste (Terracota, Verde Musgo, Crema/Piedra, Grafito).
- **Temporizador Inteligente:** Basado en timestamps (`Date.now()`) con máquina de estados (`idle` → `work` → `rest` → `blockCompleted` → `sessionCompleted`) resistente al bloqueo de pantalla y segundo plano.
- **Audio y Háptica:** Síntesis Web Audio API (beeps 3-2-1 y acordes polifónicos) + API de vibración.
- **Estado y Persistencia:** Zustand con almacenamiento persistente local para funcionamiento offline continuo.
- **Base de Datos & Auth:** Supabase con esquema SQL completo y Row Level Security (RLS).
- **Visualización de Datos:** Recharts para curvas de evolución de tests y volumen semanal.
- **Iconografía:** Lucide React.
- **PWA:** Manifiesto Web e instalación nativa como aplicación móvil offline.

---

## 📂 Estructura del Proyecto

```
crux/
├── public/
│   ├── manifest.json              # Manifiesto PWA instalable
│   ├── sw.js                      # Service Worker para soporte offline
│   └── icons/                     # Iconos SVG de alta resolución
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout con temas y PWA
│   │   ├── globals.css            # Paleta de colores y variables
│   │   ├── page.tsx               # Pantalla Inicio / Hoy
│   │   ├── workouts/
│   │   │   ├── new/page.tsx       # Constructor de sesiones y plantillas
│   │   │   └── templates/page.tsx # Catálogo de plantillas
│   │   ├── workout/
│   │   │   └── active/page.tsx    # Entrenamiento activo con temporizador gigante
│   │   ├── history/
│   │   │   ├── page.tsx           # Historial de sesiones completadas
│   │   │   └── [id]/page.tsx      # Detalle de sesión con desglose por bloque
│   │   ├── tests/
│   │   │   ├── page.tsx           # Lista de tests y comparativa delta
│   │   │   └── new/page.tsx       # Registro de nuevo test
│   │   ├── progress/
│   │   │   └── page.tsx           # Gráficas de evolución y volumen
│   │   └── settings/page.tsx      # Ajustes de audio, vibración y tema
│   ├── components/
│   │   ├── layout/                # Header, Navbar, ActiveWorkoutBanner, PwaRegister
│   │   ├── timer/                 # TimerDisplay, TimerControls, SessionCompleteModal
│   │   ├── workout/               # BlockFormModal, BlockCard, TemplatePickerModal
│   │   ├── progress/              # ProgressCharts (Recharts)
│   │   └── ui/                    # Button, Input, Modal, Badge, Card
│   ├── lib/
│   │   ├── timer/
│   │   │   ├── timerEngine.ts     # Matemática pura y máquina de estados basada en timestamps
│   │   │   ├── useWorkoutTimer.ts # Hook con sincronización de visibilidad
│   │   │   ├── audioService.ts    # Sintetizador Web Audio API y vibración
│   │   │   └── durationHelper.ts  # Cálculo dinámico de duraciones
│   │   ├── store/
│   │   │   ├── activeWorkoutStore.ts # Sesión activa persistida en tiempo real
│   │   │   ├── workoutStore.ts       # Plantillas e historial
│   │   │   ├── testStore.ts          # Benchmarks y deltas
│   │   │   └── settingsStore.ts      # Preferencias de usuario
│   │   ├── supabase/
│   │   │   └── client.ts          # Cliente Supabase tipado con fallback offline
│   │   └── types/
│   │       └── index.ts           # Modelos de datos TypeScript
│   ├── data/
│   │   └── defaultTemplates.ts    # Plantillas de ejemplo: ULAC, BLOQUES CORTOS, Suspensiones, Core
│   └── tests/
│       ├── directRunner.ts        # Runner de pruebas unitarias
│       ├── duration.test.ts       # Tests de estimación de duraciones
│       ├── timerMachine.test.ts   # Tests de transiciones de estados
│       └── backgroundRecovery.test.ts # Tests de recuperación ante bloqueo
└── supabase/
    └── schema.sql                 # Esquema DDL SQL con RLS para Supabase
```

---

## 🛠️ Instalación y Puesta en Marcha

### 1. Requisitos previos
- Node.js 18+ (recomendado Node 20 o 24)
- npm

### 2. Clonar / Navegar al directorio del proyecto
```bash
cd crux
```

### 3. Instalar dependencias
```bash
npm install
```

### 4. Configurar variables de entorno (Opcional)
Copia `.env.example` a `.env.local`:
```bash
cp .env.example .env.local
```
*(Nota: Si no configuras Supabase, CRUX funciona de manera 100% funcional y persistente en modo local offline).*

### 5. Iniciar servidor de desarrollo
```bash
npm run dev
```
Abre en tu navegador: [http://localhost:4000](http://localhost:4000)

---

## 🧪 Ejecución de Pruebas Unitarias

CRUX incluye pruebas automatizadas para:
1. Cálculo y estimación de duraciones de los 5 tipos de bloque.
2. Transiciones de la máquina de estados del temporizador (trabajo → descanso → siguiente serie → fin de bloque).
3. Recuperación ante bloqueo de pantalla y segundo plano.

Ejecutar las pruebas:
```bash
npm test
```

---

## 🗄️ Esquema de Supabase (SQL)

Si deseas conectar Supabase, ejecuta el contenido de `supabase/schema.sql` en el SQL Editor de tu panel de Supabase. El script crea automáticamente:
- `workout_templates`
- `workout_blocks`
- `workout_sessions`
- `block_logs`
- `tests`
- Políticas completas de Row Level Security (RLS) e índices de consulta optimizados.

---

## 📱 Funcionalidades PWA

- **Instalable en móvil y escritorio:** Añade CRUX a tu pantalla de inicio desde Chrome, Safari iOS o Edge.
- **Offline-ready:** Funciona sin conexión a internet en el rocódromo o en la pared.
- **Protección de sesión activa:** Si la aplicación se cierra accidentalmente o el teléfono se apaga, al volver a abrir CRUX recuperas tu sesión activa exactamente en el segundo correspondiente.
