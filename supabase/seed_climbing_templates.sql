-- ==============================================================================
-- CRUX - Script SQL de Plantillas de Ejercicios de Escalada para Supabase
-- ==============================================================================
-- Modelo de Plantilla: (Nombre, Descanso entre series, Descanso entre reps, Tiempo de trabajo o Reps)
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

  -- 1.1 Bloques de 3-4 Movimientos
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id, v_user_id,
    'Bloques de 3-4 movimientos',
    'Fuerza máxima y potencia sobre pasos límite en muro desplomado a 40°-45°.',
    1920, false, now(), now()
  );
  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, repetitions, rest_duration_seconds, notes)
  VALUES (
    gen_random_uuid(), v_tpl_id, 0,
    'Bloques de 3-4 movimientos', 'reps',
    4, 4, 120,
    'Centrarse en explosividad, precisión de pies y agarres duros al límite.'
  );

  -- 1.2 Bloques de 6-8 Movimientos
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id, v_user_id,
    'Bloques de 6-8 movimientos',
    'Fuerza-resistencia corta sobre bloques de media longitud a alta intensidad.',
    1800, false, now(), now()
  );
  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, repetitions, rest_duration_seconds, notes)
  VALUES (
    gen_random_uuid(), v_tpl_id, 0,
    'Bloques de 6-8 movimientos', 'reps',
    4, 7, 150,
    'Mantener el ritmo y la tensión corporal sin acelerarse en los pasos clave.'
  );

  -- 1.3 4x4 en Bloque
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id, v_user_id,
    '4x4 en Bloque',
    'Capacidad anaeróbica láctica: escalar 4 bloques seguidos sin descanso y reposar entre series.',
    1440, false, now(), now()
  );
  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, repetitions, rest_duration_seconds, notes)
  VALUES (
    gen_random_uuid(), v_tpl_id, 0,
    '4x4 en Bloque', 'reps',
    4, 4, 240,
    'Escalar los 4 bloques encadenados sin bajar de la pared si es posible.'
  );

  -- 1.4 Intentos a Proyectos Límite
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id, v_user_id,
    'Intentos a Proyectos Límite',
    'Pegues de máxima calidad al 100% de intensidad con descanso completo.',
    1500, false, now(), now()
  );
  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, repetitions, rest_duration_seconds, notes)
  VALUES (
    gen_random_uuid(), v_tpl_id, 0,
    'Intentos a Proyectos Límite', 'reps',
    5, 1, 240,
    'Visualizar cada movimiento antes de salir. Parar si la calidad del pegue decae.'
  );


  -- ----------------------------------------------------------------------------
  -- 2. FUERZA DE DEDOS Y SUSPENSIONES
  -- ----------------------------------------------------------------------------

  -- 2.1 Suspensiones Máximas 10s (Por Tiempo de Trabajo)
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id, v_user_id,
    'Suspensiones Máximas 10s',
    'Suspensiones de 10 segundos al 85-90% de intensidad con cinto de lastre en regleta de 20 mm.',
    950, false, now(), now()
  );
  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, work_duration_seconds, rest_duration_seconds, notes)
  VALUES (
    gen_random_uuid(), v_tpl_id, 0,
    'Suspensiones Máximas 10s', 'intervals',
    5, 10, 180,
    'Semiarqueo estricto a 90° en falanges, hombros activos y escápulas conectadas.'
  );

  -- 2.2 Suspensiones Intermitentes 7/3 (Por Tiempo + Pausa entre reps)
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id, v_user_id,
    'Suspensiones Intermitentes 7/3',
    'Protocolo 7s suspensión + 3s descanso por repetición en regleta de 20 mm.',
    900, false, now(), now()
  );
  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, repetitions, work_duration_seconds, rest_duration_seconds, notes)
  VALUES (
    gen_random_uuid(), v_tpl_id, 0,
    'Suspensiones Intermitentes 7/3', 'intervals',
    4, 6, 7, 120,
    'Pausa de 3 segundos entre repeticiones de la serie.'
  );

  -- 2.3 Suspensiones en Regleta Mínima (10-14mm)
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id, v_user_id,
    'Suspensiones en Regleta Mínima (10-14mm)',
    'Adaptación neuromuscular y fuerza de contacto sobre regletas pequeñas sin lastre.',
    750, false, now(), now()
  );
  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, work_duration_seconds, rest_duration_seconds, notes)
  VALUES (
    gen_random_uuid(), v_tpl_id, 0,
    'Suspensiones en Regleta Mínima (10-14mm)', 'intervals',
    4, 8, 180,
    'Evitar arquear excesivamente; buscar semiarqueo limpio.'
  );


  -- ----------------------------------------------------------------------------
  -- 3. RESISTENCIA Y CONTINUIDAD
  -- ----------------------------------------------------------------------------

  -- 3.1 Continuidad Aeróbica (ARC 15 min)
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id, v_user_id,
    'Continuidad Aeróbica (ARC 15 min)',
    'Capilarización y recuperación activa: escalada continua sin hinchazón excesiva de antebrazos.',
    2400, false, now(), now()
  );
  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, work_duration_seconds, rest_duration_seconds, notes)
  VALUES (
    gen_random_uuid(), v_tpl_id, 0,
    'Continuidad Aeróbica (ARC 15 min)', 'intervals',
    2, 900, 300,
    'Mantener respiración nasal constante. Sacudir un brazo en reposos sobre presas buenas.'
  );

  -- 3.2 Intervalos ULAC (3 min trabajo / 1 min descanso)
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id, v_user_id,
    'Intervalos ULAC (3 min / 1 min)',
    'Resistencia anaeróbica láctica: 3 minutos escalando a ritmo constante y 1 minuto de pausa.',
    960, false, now(), now()
  );
  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, work_duration_seconds, rest_duration_seconds, notes)
  VALUES (
    gen_random_uuid(), v_tpl_id, 0,
    'Intervalos ULAC (3 min / 1 min)', 'intervals',
    4, 180, 60,
    'No detenerse; gestionar el gasto de energía mediante pies precisos.'
  );

  -- 3.3 Travesías de Continuidad (25-30 movimientos)
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id, v_user_id,
    'Travesías de Continuidad (25 movs)',
    'Volumen de escalada en travesía buscando fluidez, lectura y optimización del agarre.',
    720, false, now(), now()
  );
  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, repetitions, rest_duration_seconds, notes)
  VALUES (
    gen_random_uuid(), v_tpl_id, 0,
    'Travesías de Continuidad (25 movs)', 'reps',
    4, 25, 120,
    'Alternar manos abiertas y semiarqueos con pasos fluidos.'
  );


  -- ----------------------------------------------------------------------------
  -- 4. POTENCIA Y CAMPUS BOARD
  -- ----------------------------------------------------------------------------

  -- 4.1 Campus Board: Escaleras 1-3-5 / 1-4-7
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id, v_user_id,
    'Campus Board: Escaleras 1-3-5 / 1-4-7',
    'Potencia y coordinación neuromuscular en listones de campus.',
    900, false, now(), now()
  );
  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, repetitions, rest_duration_seconds, notes)
  VALUES (
    gen_random_uuid(), v_tpl_id, 0,
    'Campus Board: Escaleras 1-3-5 / 1-4-7', 'reps',
    5, 3, 180,
    'Llegar arriba con fuerza explosiva sin colgarse pasivamente.'
  );


  -- ----------------------------------------------------------------------------
  -- 5. FUERZA GENERAL Y ACONDICIONAMIENTO
  -- ----------------------------------------------------------------------------

  -- 5.1 Dominadas con Lastre (Fuerza Máxima)
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id, v_user_id,
    'Dominadas con Lastre',
    'Fuerza máxima de tracción para el tren superior con cinto de lastre.',
    720, false, now(), now()
  );
  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, repetitions, rest_duration_seconds, notes)
  VALUES (
    gen_random_uuid(), v_tpl_id, 0,
    'Dominadas con Lastre', 'reps',
    4, 5, 150,
    'Recorrido completo: barbilla claramente por encima de la barra y bloqueo controlado abajo.'
  );

  -- 5.2 Dominadas Explosivas al Pecho
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id, v_user_id,
    'Dominadas Explosivas al Pecho',
    'Potencia de tracción buscando la máxima aceleración hacia el esternón.',
    600, false, now(), now()
  );
  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, repetitions, rest_duration_seconds, notes)
  VALUES (
    gen_random_uuid(), v_tpl_id, 0,
    'Dominadas Explosivas al Pecho', 'reps',
    4, 4, 120,
    'Tirar a máxima velocidad desde la primera repetición.'
  );

  -- 5.3 Core Específico para Escalada
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id, v_user_id,
    'Core Específico (Rueda + Hollow Body)',
    'Tensión corporal y cadena anterior para mantener los pies pegados en muros desplomados.',
    450, false, now(), now()
  );
  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, repetitions, rest_duration_seconds, notes)
  VALUES (
    gen_random_uuid(), v_tpl_id, 0,
    'Core Específico (Rueda + Hollow Body)', 'reps',
    3, 10, 90,
    'Pelvis retrovertida, glúteos contraídos y control excéntrico.'
  );

  -- 5.4 Bloqueos Isométricos en Barra
  v_tpl_id := gen_random_uuid();
  INSERT INTO workout_templates (id, user_id, title, description, estimated_duration_seconds, is_default, created_at, updated_at)
  VALUES (
    v_tpl_id, v_user_id,
    'Bloqueos Isométricos en Barra (90° y 120°)',
    'Fuerza estática de bloqueo para fijar pasos duros y chapajes comprometidos en pared.',
    450, false, now(), now()
  );
  INSERT INTO workout_blocks (id, template_id, position, title, type, sets, work_duration_seconds, rest_duration_seconds, notes)
  VALUES (
    gen_random_uuid(), v_tpl_id, 0,
    'Bloqueos Isométricos en Barra (90° y 120°)', 'intervals',
    3, 15, 120,
    'Mantener la espalda dorsal y hombros firmes sin hundirse.'
  );

  RAISE NOTICE '¡Plantillas de escalada insertadas exitosamente!';
END $$;
