-- Supabase SQL schema for AgroConecta
-- Paste this into the Supabase SQL editor and run.

-- Table: productos
CREATE TABLE IF NOT EXISTS productos (
  id TEXT PRIMARY KEY,
  agricultor_id TEXT NOT NULL,
  nombre_agricultor TEXT NOT NULL,
  telefono_agricultor TEXT,
  reputacion_agricultor NUMERIC(2,1) DEFAULT 5.0,
  is_midagri_verified BOOLEAN DEFAULT FALSE,
  titulo TEXT NOT NULL,
  rubro TEXT,
  variedad TEXT,
  volumen_disponible NUMERIC DEFAULT 0,
  precio_per_kg NUMERIC DEFAULT 0,
  distrito_origen TEXT,
  imagen_url TEXT,
  status TEXT DEFAULT 'disponible',
  fecha_cosecha TIMESTAMPTZ,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: ordenes
CREATE TABLE IF NOT EXISTS ordenes (
  id TEXT PRIMARY KEY,
  fecha_creacion TIMESTAMPTZ DEFAULT now(),
  producto_id TEXT NOT NULL REFERENCES productos(id) ON DELETE SET NULL,
  titulo_producto TEXT,
  cantidad_comprada NUMERIC,
  precio_unitario NUMERIC,
  total_pago_producto NUMERIC,
  total_pago_flete NUMERIC,
  status TEXT DEFAULT 'pendiente_flete',
  distrito_origen TEXT,
  distrito_destino TEXT,
  agricultor_id TEXT,
  nombre_agricultor TEXT,
  telefono_agricultor TEXT,
  comprador_id TEXT,
  nombre_comprador TEXT,
  telefono_comprador TEXT,
  transportista_id TEXT,
  nombre_transportista TEXT,
  telefono_transportista TEXT,
  vehiculo_placa TEXT,
  vehiculo_descripcion TEXT,
  fecha_asignacion_flete TIMESTAMPTZ,
  fecha_inicio_transito TIMESTAMPTZ,
  fecha_solicitud_entrega TIMESTAMPTZ,
  fecha_cierre_efectivo TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: fletes
CREATE TABLE IF NOT EXISTS fletes (
  id TEXT PRIMARY KEY,
  orden_id TEXT REFERENCES ordenes(id) ON DELETE CASCADE,
  origen TEXT,
  destino TEXT,
  peso_carga NUMERIC,
  tarifa_propuesta NUMERIC,
  producto_descripcion TEXT,
  status TEXT DEFAULT 'disponible',
  transportista_id TEXT,
  nombre_transportista TEXT,
  telefono_transportista TEXT,
  vehiculo_placa TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_productos_rubro ON productos(rubro);
CREATE INDEX IF NOT EXISTS idx_productos_distrito ON productos(distrito_origen);
CREATE INDEX IF NOT EXISTS idx_ordenes_status ON ordenes(status);
CREATE INDEX IF NOT EXISTS idx_fletes_status ON fletes(status);

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  rol TEXT NOT NULL,
  email TEXT,
  nombre TEXT,
  telefono TEXT,
  ubicacion TEXT,
  is_midagri_verified BOOLEAN DEFAULT FALSE,
  vehiculo JSONB,
  ruc TEXT,
  razon_social TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_rol ON users(rol);

-- Optional seed data (three productos)
INSERT INTO productos (id, agricultor_id, nombre_agricultor, telefono_agricultor, reputacion_agricultor, is_midagri_verified, titulo, rubro, variedad, volumen_disponible, precio_per_kg, distrito_origen, imagen_url, status, fecha_cosecha, descripcion)
VALUES
('p-001', 'u-agr-tomas', 'Don Tomás Requena', '+51 964 123 456', 5.0, true, 'Papa Nativa Camotillo - Cosecha Fresca', 'Tubérculos', 'Camotillo', 2500, 1.5, 'Aco', '', 'disponible', '2026-05-10', 'Papa nativa variedad Camotillo, cultivada de forma tradicional.'),
('p-002', 'u-agr-eulogio', 'Don Eulogio Chanco', '+51 954 777 888', 4.8, true, 'Maíz Blanco Urubamba seleccionado', 'Cereales', 'Blanco Urubamba', 4000, 2.2, 'Mito', '', 'disponible', '2026-05-05', 'Maíz blanco gigante variedad Urubamba, cosechado a mano.'),
('p-003', 'u-agr-sincos', 'Asociación Agrícola Sincos', '+51 964 999 111', 5.0, false, 'Alcachofa Suprema sin espinas', 'Hortalizas', 'Suprema', 1800, 3.0, 'Sincos', '', 'disponible', '2026-05-15', 'Alcachofa Suprema sin espinas, producto fresco.');

-- Seed users (demo)
INSERT INTO users (id, rol, email, nombre, telefono, ubicacion, is_midagri_verified)
VALUES
('u-anon', 'anon', NULL, '', '', '', false),
('u-agr-tomas', 'agricultor', 'tomas@agroconecta.com', 'Don Tomás Requena', '+51 964 123 456', 'Aco, Concepción - Junín', true),
('u-com-valeria', 'comprador', 'valeria@agroconecta.com', 'Minimarket Valeria', '+51 984 555 121', 'Huancayo - Junín', false),
('u-tra-lucho', 'transportista', 'lucho@agroconecta.com', 'Lucho Chanco', '+51 974 887 990', 'Concepción - Junín', false),
('u-adm-agroconecta', 'admin', 'admin@agroconecta.com', 'Mesa de Control AgroConecta', '+51 900 111 222', 'Oficina Regional Huancayo', false),
('u-demo-anonimo', 'comprador', 'demo@agroconecta.com', 'Usuario Invitado de Pruebas', '+51 912 345 678', 'El Tambo, Huancayo - Junín', false)
ON CONFLICT (id) DO NOTHING;

-- End of schema
