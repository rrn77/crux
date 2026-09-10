-- ==============================================================================
-- CRUX - Script SQL de Plantillas de Ejercicios de Escalada para Supabase
-- ==============================================================================
-- Instrucciones de uso en Supabase:
-- 1. Ve a tu panel de Supabase -> SQL Editor -> New Query.
-- 2. Copia y pega este script completo.
-- 3. Pulsa "Run". 
--    (El script usa automáticamente el `auth.uid()` del usuario autenticado actual,
--     o puedes indicar manualmente un `v_user_id` si lo ejecutas desde el rol de servicio).
-- ==============================================================================

DO $$
DECLARE
  v_user_id uuid;
  v_tpl_id uuid;
BEGIN
  -- Obtener el ID del usuario actual en Supabase o el primer usuario registrado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  END IF;

  RAISE NOTICE 'Insertando plantillas de escalada para user_id: %', v_user_id;

  -- ----------------------------------------------------------------------------
  -- 1. BLOQUES Y PLAFÓN
  -- ----------------------------------------------------------------------------

  -- 1.1 Bloques de 3-4 Movimientos (Fuerza y Potencia Máxima)
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id,
    v_user_id,
    'Bloques de 3-4 movimientos',
    'Fuerza máxima y potencia sobre pasos límite en muro desplomado a 40°-45°. Máxima calidad por intento.',
    1920, -- 32 min aprox
    false,
    now(),
    now()
  );

  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, problems, movements, attempts, rest_duration_seconds, target, notes)
  VALUES (
    gen_random_uuid(),
    v_tpl_id,
    0,
    'Bloques de 3-4 movimientos',
    'problems',
    4,
    4,
    4,
    1,
    120,
    'Muro 40°-45° desplome',
    'Centrarse en explosividad, precisión de pies y agarres duros al límite.'
  );

  -- 1.2 Bloques de 6-8 Movimientos (Fuerza-Resistencia Corta)
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id,
    'Bloques de 6-8 movimientos',
    'Fuerza-resistencia corta sobre bloques de media longitud a alta intensidad.',
    1800,
    false,
    now(),
    now()
  );

  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, problems, movements, attempts, rest_duration_seconds, target, notes)
  VALUES (
    gen_random_uuid(),
    v_tpl_id,
    0,
    'Bloques de 6-8 movimientos',
    'problems',
    4,
    3,
    7,
    1,
    150,
    'Grado límite (ej. 7b/7c)',
    'Mantener el ritmo y la tensión corporal sin acelerarse en los pasos clave.'
  );

  -- 1.3 4x4 en Bloque (Capacidad Anaeróbica Láctica)
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id,
    v_user_id,
    '4x4 en Bloque',
    'Capacidad anaeróbica láctica: escalar 4 bloques seguidos sin descanso y reposar entre series.',
    1440,
    false,
    now(),
    now()
  );

  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, problems, movements, attempts, rest_duration_seconds, target, notes)
  VALUES (
    gen_random_uuid(),
    v_tpl_id,
    0,
    '4x4 en Bloque',
    'problems',
    4,
    4,
    5,
    1,
    240,
    '2 grados por debajo del máx (ej. 6c/7a)',
    'Escalar los 4 bloques encadenados sin bajar de la pared si es posible, o bajando y subiendo de inmediato.'
  );

  -- 1.4 Intentos a Proyectos Límite
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id,
    v_user_id,
    'Intentos a Proyectos Límite',
    'Pegues de máxima calidad al 100% de intensidad con descanso completo entre intentos.',
    1500,
    false,
    now(),
    now()
  );

  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, attempts, rest_duration_seconds, target, notes)
  VALUES (
    gen_random_uuid(),
    v_tpl_id,
    0,
    'Intentos a Proyectos Límite',
    'attempts',
    5,
    1,
    240,
    'Grado máximo de proyecto',
    'Visualizar cada movimiento antes de salir. Parar si la calidad del pegue decae.'
  );


  -- ----------------------------------------------------------------------------
  -- 2. FUERZA DE DEDOS Y SUSPENSIONES
  -- ----------------------------------------------------------------------------

  -- 2.1 Suspensiones Máximas (Max Hangs 10s)
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id,
    v_user_id,
    'Suspensiones Máximas 10s',
    'Suspensiones de 10 segundos al 85-90% de intensidad con cinto de lastre en regleta de 20 mm.',
    950,
    false,
    now(),
    now()
  );

  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, work_duration_seconds, rest_duration_seconds, target, notes)
  VALUES (
    gen_random_uuid(),
    v_tpl_id,
    0,
    'Suspensiones Máximas 10s',
    'intervals',
    5,
    10,
    180,
    'Regleta 20mm + lastre',
    'Semiarqueo estricto a 90° en falanges, hombros activos y escápulas conectadas.'
  );

  -- 2.2 Suspensiones Intermitentes 7/3 (Repeaters)
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id,
    v_user_id,
    'Suspensiones Intermitentes 7/3',
    'Protocolo de fuerza-resistencia en dedos: 7s suspensión + 3s descanso por repetición.',
    900,
    false,
    now(),
    now()
  );

  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, work_duration_seconds, rest_duration_seconds, target, notes)
  VALUES (
    gen_random_uuid(),
    v_tpl_id,
    0,
    'Suspensiones Intermitentes 7/3',
    'intervals',
    6,
    10,
    60,
    'Regleta 20mm peso corporal',
    'Mantener la forma de agarre hasta el último segundo de cada repetición.'
  );

  -- 2.3 Suspensiones en Regleta Mínima (Min Edge)
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id,
    v_user_id,
    'Suspensiones en Regleta Mínima (10-14mm)',
    'Adaptación neuromuscular y fuerza de contacto sobre regletas pequeñas sin lastre.',
    750,
    false,
    now(),
    now()
  );

  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, work_duration_seconds, rest_duration_seconds, target, notes)
  VALUES (
    gen_random_uuid(),
    v_tpl_id,
    0,
    'Suspensiones en Regleta Mínima (10-14mm)',
    'intervals',
    4,
    8,
    180,
    'Regleta 10mm o 12mm',
    'Evitar arquear excesivamente; buscar semiarqueo limpio.'
  );


  -- ----------------------------------------------------------------------------
  -- 3. RESISTENCIA Y CONTINUIDAD
  -- ----------------------------------------------------------------------------

  -- 3.1 Continuidad Aeróbica (ARC 15-20 min)
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id,
    v_user_id,
    'Continuidad Aeróbica (ARC 15 min)',
    'Capilarización y recuperación activa: escalada continua sin hinchazón excesiva de antebrazos.',
    2400,
    false,
    now(),
    now()
  );

  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, work_duration_seconds, rest_duration_seconds, target, notes)
  VALUES (
    gen_random_uuid(),
    v_tpl_id,
    0,
    'Continuidad Aeróbica (ARC 15 min)',
    'intervals',
    2,
    900, -- 15 min
    300, -- 5 min descanso
    'Muro vertical / Grado bajo 5c-6a',
    'Mantener respiración nasal constante. Sacudir un brazo en reposos sobre presas buenas.'
  );

  -- 3.2 Intervalos ULAC / Resistencia Láctica (3:00 / 1:00)
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id,
    v_user_id,
    'Intervalos ULAC (3 min escalada / 1 min descanso)',
    'Resistencia anaeróbica láctica: 3 minutos escalando a ritmo constante seguidos de 1 minuto de pausa.',
    960,
    false,
    now(),
    now()
  );

  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, work_duration_seconds, rest_duration_seconds, target, notes)
  VALUES (
    gen_random_uuid(),
    v_tpl_id,
    0,
    'Intervalos ULAC (3 min escalada / 1 min descanso)',
    'intervals',
    4,
    180,
    60,
    'Muro desplomado / Grado 6b-6c',
    'No detenerse; gestionar el gasto de energía mediante pies precisos.'
  );

  -- 3.3 Travesías de Continuidad
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id,
    v_user_id,
    'Travesías de Continuidad (25-30 movimientos)',
    'Volumen de escalada en travesía buscando fluidez, lectura y optimización del agarre.',
    720,
    false,
    now(),
    now()
  );

  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, movements, rest_duration_seconds, target, notes)
  VALUES (
    gen_random_uuid(),
    v_tpl_id,
    0,
    'Travesías de Continuidad (25-30 movimientos)',
    'problems',
    4,
    1,
    25,
    1,
    120,
    'Muro plafón continuo',
    'Alternar manos abiertas y semiarqueos con pasos fluidos.'
  );


  -- ----------------------------------------------------------------------------
  -- 4. POTENCIA Y CAMPUS BOARD
  -- ----------------------------------------------------------------------------

  -- 4.1 Campus Board: Escalera Básica (1-3-5 / 1-4-7)
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id,
    v_user_id,
    'Campus Board: Escaleras 1-3-5 / 1-4-7',
    'Potencia y coordinación neuromuscular en listones de campus.',
    900,
    false,
    now(),
    now()
  );

  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, attempts, rest_duration_seconds, target, notes)
  VALUES (
    gen_random_uuid(),
    v_tpl_id,
    0,
    'Campus Board: Escaleras 1-3-5 / 1-4-7',
    'attempts',
    5,
    3,
    180,
    'Listón mediano (25-32mm)',
    'Llegar arriba con fuerza explosiva sin colgarse pasivamente.'
  );


  -- ----------------------------------------------------------------------------
  -- 5. FUERZA GENERAL Y ACONDICIONAMIENTO
  -- ----------------------------------------------------------------------------

  -- 5.1 Dominadas con Lastre (Fuerza Máxima)
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id,
    v_user_id,
    'Dominadas con Lastre (Fuerza Máxima)',
    'Fuerza máxima de tracción para el tren superior con cinto de lastre.',
    720,
    false,
    now(),
    now()
  );

  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, repetitions, rest_duration_seconds, target, notes)
  VALUES (
    gen_random_uuid(),
    v_tpl_id,
    0,
    'Dominadas con Lastre (Fuerza Máxima)',
    'reps',
    4,
    5,
    150,
    '+10kg a +25kg según nivel',
    'Recorrido completo: barbilla claramente por encima de la barra y bloqueo controlado abajo.'
  );

  -- 5.2 Dominadas Explosivas al Pecho
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id,
    v_user_id,
    'Dominadas Explosivas al Pecho',
    'Potencia de tracción buscando la máxima aceleración hacia el esternón.',
    600,
    false,
    now(),
    now()
  );

  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, repetitions, rest_duration_seconds, target, notes)
  VALUES (
    gen_random_uuid(),
    v_tpl_id,
    0,
    'Dominadas Explosivas al Pecho',
    'reps',
    4,
    4,
    120,
    'Peso corporal',
    'Tirar a máxima velocidad desde la primera repetición.'
  );

  -- 5.3 Core Específico para Escalada
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id,
    v_user_id,
    'Core Específico (Rueda Abdominal + Hollow Body)',
    'Tensión corporal y cadena anterior para mantener los pies pegados en muros desplomados.',
    450,
    false,
    now(),
    now()
  );

  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, repetitions, rest_duration_seconds, target, notes)
  VALUES (
    gen_random_uuid(),
    v_tpl_id,
    0,
    'Core Específico (Rueda Abdominal + Hollow Body)',
    'reps',
    3,
    10,
    90,
    'RPE 8',
    'Pelvis retrovertida, glúteos contraídos y control excéntrico.'
  );

  -- 5.4 Bloqueos Isométricos en Barra
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id,
    v_user_id,
    'Bloqueos Isométricos en Barra (90° y 120°)',
    'Fuerza estática de bloqueo para fijar pasos duros y chapajes comprometidos en pared.',
    450,
    false,
    now(),
    now()
  );

  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, work_duration_seconds, rest_duration_seconds, target, notes)
  VALUES (
    gen_random_uuid(),
    v_tpl_id,
    0,
    'Bloqueos Isométricos en Barra (90° y 120°)',
    'intervals',
    3,
    15,
    120,
    'Ángulo de 90° o 120°',
    'Mantener la espalda dorsal y hombros firmes sin hundirse.'
  );

  RAISE NOTICE '¡Plantillas de escalada insertadas exitosamente!';
END $$;
