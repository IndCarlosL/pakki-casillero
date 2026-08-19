-- ================================================================
-- PAKKI CASILLERO — Tipos de Usuario y Tarifas
-- Ejecutar en Supabase SQL Editor
-- ================================================================

-- 1. Tabla de tipos de usuario
CREATE TABLE IF NOT EXISTS user_types (
    id          TEXT PRIMARY KEY,
    label       TEXT NOT NULL,
    description TEXT,
    active      BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Tipos por defecto
INSERT INTO user_types (id, label, description) VALUES
    ('cliente',       'Cliente',          'Cliente regular del servicio de casillero'),
    ('emprendedor',   'Emprendedor',      'Plan para emprendedores con tarifas preferenciales'),
    ('aliado',        'Aliado Comercial', 'Aliado o revendedor del servicio'),
    ('administrador', 'Administrador',    'Acceso total al panel de administración')
ON CONFLICT (id) DO NOTHING;

-- 2. Tabla de tarifas por tipo de usuario
CREATE TABLE IF NOT EXISTS tariffs (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_type_id TEXT NOT NULL REFERENCES user_types(id) ON DELETE CASCADE,
    concept      TEXT NOT NULL,
    value        NUMERIC(12,4) NOT NULL,
    unit         TEXT DEFAULT 'USD',
    description  TEXT,
    created_at   TIMESTAMPTZ DEFAULT now()
);

-- Tarifas iniciales por tipo
INSERT INTO tariffs (user_type_id, concept, value, unit, description) VALUES
    ('cliente',       'Precio por libra', 4.50,  'USD/lb',  'Tarifa estándar por peso'),
    ('cliente',       'Mínimo de libras', 1.0,   'lbs',     'Peso mínimo cobrable'),
    ('cliente',       'Seguro',           2.0,   '%',       'Porcentaje sobre valor declarado'),
    ('cliente',       'Costo de manejo',  3.00,  'USD',     'Cargo fijo por gestión'),
    ('emprendedor',   'Precio por libra', 3.80,  'USD/lb',  'Tarifa preferencial emprendedor'),
    ('emprendedor',   'Mínimo de libras', 10.0,  'lbs',     'Peso mínimo cobrable'),
    ('emprendedor',   'Seguro',           1.5,   '%',       'Porcentaje sobre valor declarado'),
    ('emprendedor',   'Costo de manejo',  0.00,  'USD',     'Sin cargo de manejo'),
    ('aliado',        'Precio por libra', 3.50,  'USD/lb',  'Tarifa especial aliado'),
    ('aliado',        'Mínimo de libras', 10.0,  'lbs',     'Peso mínimo cobrable'),
    ('aliado',        'Seguro',           1.0,   '%',       'Porcentaje sobre valor declarado'),
    ('aliado',        'Costo de manejo',  0.00,  'USD',     'Sin cargo de manejo'),
    ('administrador', 'Precio por libra', 0.00,  'USD/lb',  'Sin tarifa (uso interno)'),
    ('administrador', 'Seguro',           0.00,  '%',       'Sin seguro');

-- 3. Agregar columna userType a la tabla users
ALTER TABLE users ADD COLUMN IF NOT EXISTS "userType" TEXT DEFAULT 'cliente' REFERENCES user_types(id);

-- Verificar
SELECT 'user_types' AS tabla, COUNT(*) AS total FROM user_types
UNION ALL
SELECT 'tariffs', COUNT(*) FROM tariffs;
