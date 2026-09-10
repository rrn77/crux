-- ==============================================================================
-- CRUX - Script SQL de Plantillas de Ejercicios de Escalada para Supabase
-- ==============================================================================
-- Las plantillas son solo IDENTIDAD del ejercicio (título, tipo de ejecución y
-- notas técnicas). La prescripción (series, descansos, carga...) se decide cada
-- vez que se añade la plantilla a una sesión.
-- ==============================================================================

DO $$
DECLARE
  v_user_id uuid;
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

  INSERT INTO workout_templates (id, user_id, title, type, description, created_at, updated_at) VALUES
  (gen_random_uuid(), v_user_id, 'Bloques de 3-4 movimientos', 'problems',
    'Fuerza máxima y potencia sobre pasos límite en muro desplomado a 40°-45°. Centrarse en explosividad, precisión de pies y agarres duros al límite.', now(), now()),
  (gen_random_uuid(), v_user_id, 'Bloques de 6-8 movimientos', 'problems',
    'Fuerza-resistencia corta sobre bloques de media longitud a alta intensidad. Mantener el ritmo y la tensión corporal sin acelerarse en los pasos clave.', now(), now()),
  (gen_random_uuid(), v_user_id, '4x4 en Bloque', 'reps',
    'Capacidad anaeróbica láctica: escalar 4 bloques seguidos sin descanso y reposar entre series. Escalar los 4 bloques encadenados sin bajar de la pared si es posible.', now(), now()),
  (gen_random_uuid(), v_user_id, 'Intentos a Proyectos Límite', 'attempts',
    'Pegues de máxima calidad al 100% de intensidad con descanso completo. Visualizar cada movimiento antes de salir. Parar si la calidad del pegue decae.', now(), now());

  -- ----------------------------------------------------------------------------
  -- 2. FUERZA DE DEDOS Y SUSPENSIONES
  -- ----------------------------------------------------------------------------

  INSERT INTO workout_templates (id, user_id, title, type, description, created_at, updated_at) VALUES
  (gen_random_uuid(), v_user_id, 'Suspensiones Máximas 10s', 'intervals',
    'Suspensiones de 10 segundos al 85-90% de intensidad con cinto de lastre en regleta de 20 mm. Semiarqueo estricto a 90° en falanges, hombros activos y escápulas conectadas.', now(), now()),
  (gen_random_uuid(), v_user_id, 'Suspensiones Intermitentes 7/3', 'intervals',
    'Protocolo 7s suspensión + 3s descanso por repetición en regleta de 20 mm. Pausa de 3 segundos entre repeticiones de la serie.', now(), now()),
  (gen_random_uuid(), v_user_id, 'Suspensiones en Regleta Mínima (10-14mm)', 'intervals',
    'Adaptación neuromuscular y fuerza de contacto sobre regletas pequeñas sin lastre. Evitar arquear excesivamente; buscar semiarqueo limpio.', now(), now());

  -- ----------------------------------------------------------------------------
  -- 3. RESISTENCIA Y CONTINUIDAD
  -- ----------------------------------------------------------------------------

  INSERT INTO workout_templates (id, user_id, title, type, description, created_at, updated_at) VALUES
  (gen_random_uuid(), v_user_id, 'Continuidad Aeróbica (ARC)', 'intervals',
    'Capilarización y recuperación activa: escalada continua sin hinchazón excesiva de antebrazos. Mantener respiración nasal constante. Sacudir un brazo en reposos sobre presas buenas.', now(), now()),
  (gen_random_uuid(), v_user_id, 'Intervalos ULAC (3 min / 1 min)', 'intervals',
    'Resistencia anaeróbica láctica: minutos escalando a ritmo constante y minuto de pausa. No detenerse; gestionar el gasto de energía mediante pies precisos.', now(), now()),
  (gen_random_uuid(), v_user_id, 'Travesías de Continuidad', 'reps',
    'Volumen de escalada en travesía buscando fluidez, lectura y optimización del agarre. Alternar manos abiertas y semiarqueos con pasos fluidos.', now(), now());

  -- ----------------------------------------------------------------------------
  -- 4. POTENCIA Y CAMPUS BOARD
  -- ----------------------------------------------------------------------------

  INSERT INTO workout_templates (id, user_id, title, type, description, created_at, updated_at) VALUES
  (gen_random_uuid(), v_user_id, 'Campus Board: Escaleras 1-3-5 / 1-4-7', 'reps',
    'Potencia y coordinación neuromuscular en listones de campus. Llegar arriba con fuerza explosiva sin colgarse pasivamente.', now(), now());

  -- ----------------------------------------------------------------------------
  -- 5. FUERZA GENERAL Y ACONDICIONAMIENTO
  -- ----------------------------------------------------------------------------

  INSERT INTO workout_templates (id, user_id, title, type, description, created_at, updated_at) VALUES
  (gen_random_uuid(), v_user_id, 'Dominadas con Lastre', 'reps',
    'Fuerza máxima de tracción para el tren superior con cinto de lastre. Recorrido completo: barbilla claramente por encima de la barra y bloqueo controlado abajo.', now(), now()),
  (gen_random_uuid(), v_user_id, 'Dominadas Explosivas al Pecho', 'reps',
    'Potencia de tracción buscando la máxima aceleración hacia el esternón. Tirar a máxima velocidad desde la primera repetición.', now(), now()),
  (gen_random_uuid(), v_user_id, 'Core Específico (Rueda + Hollow Body)', 'reps',
    'Tensión corporal y cadena anterior para mantener los pies pegados en muros desplomados. Pelvis retrovertida, glúteos contraídos y control excéntrico.', now(), now()),
  (gen_random_uuid(), v_user_id, 'Bloqueos Isométricos en Barra (90° y 120°)', 'intervals',
    'Fuerza estática de bloqueo para fijar pasos duros y chapajes comprometidos en pared. Mantener la espalda dorsal y hombros firmes sin hundirse.', now(), now());

  RAISE NOTICE '¡Plantillas de escalada insertadas exitosamente!';
END $$;
