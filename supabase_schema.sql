-- =============================================================================
-- AgroConecta — Esquema Completo de Base de Datos para Supabase
-- Archivo oficial: supabase_schema.sql
-- Descripción: Script de reconstrucción destructiva controlada + seed data.
-- Instrucciones: Pegar completo en el editor SQL de Supabase y ejecutar.
-- ADVERTENCIA: Las sentencias DROP eliminan todos los datos existentes.
-- =============================================================================


-- =============================================================================
-- SECCIÓN 1: LIMPIEZA DESTRUCTIVA CONTROLADA
-- Orden de eliminación respetando dependencias de claves foráneas.
-- =============================================================================

DROP TABLE IF EXISTS fletes   CASCADE;
DROP TABLE IF EXISTS ordenes  CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS users    CASCADE;


-- =============================================================================
-- SECCIÓN 2: DEFINICIÓN DE TABLAS
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Tabla: users
-- Almacena perfiles de todos los usuarios de la plataforma:
-- agricultores, compradores, transportistas, administradores y demo.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                   TEXT        PRIMARY KEY,
  rol                  TEXT        NOT NULL CHECK (rol IN ('agricultor','comprador','transportista','admin','anon','demo_user')),
  email                TEXT        UNIQUE,
  nombre               TEXT        NOT NULL DEFAULT '',
  telefono             TEXT        NOT NULL DEFAULT '',
  ubicacion            TEXT        NOT NULL DEFAULT '',
  is_midagri_verified  BOOLEAN     NOT NULL DEFAULT FALSE,
  vehiculo             JSONB,
  ruc                  TEXT,
  razon_social         TEXT,
  documento_url        TEXT,
  verificacion_estado  TEXT        NOT NULL DEFAULT 'pendiente'
                                   CHECK (verificacion_estado IN ('pendiente','aprobado','rechazado')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_rol               ON users(rol);
CREATE INDEX IF NOT EXISTS idx_users_verificacion      ON users(verificacion_estado);
CREATE INDEX IF NOT EXISTS idx_users_email             ON users(email);


-- ----------------------------------------------------------------------------
-- Tabla: productos
-- Catálogo principal de cosechas publicadas por los agricultores.
-- El campo 'rubro' acepta exactamente las categorías aprobadas por la plataforma.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS productos (
  id                     TEXT          PRIMARY KEY,
  agricultor_id          TEXT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nombre_agricultor      TEXT          NOT NULL DEFAULT '',
  telefono_agricultor    TEXT                   DEFAULT '',
  reputacion_agricultor  NUMERIC(2,1)  NOT NULL DEFAULT 5.0 CHECK (reputacion_agricultor BETWEEN 1.0 AND 5.0),
  is_midagri_verified    BOOLEAN       NOT NULL DEFAULT FALSE,
  titulo                 TEXT          NOT NULL,
  rubro                  TEXT          NOT NULL DEFAULT 'Otro'
                                       CHECK (rubro IN (
                                         'Tubérculos',
                                         'Cereales',
                                         'Hortalizas',
                                         'Frutas',
                                         'Legumbres',
                                         'Agroindustria',
                                         'Granos Andinos',
                                         'Otro'
                                       )),
  variedad               TEXT                   DEFAULT '',
  volumen_disponible     NUMERIC       NOT NULL DEFAULT 0 CHECK (volumen_disponible >= 0),
  precio_per_kg          NUMERIC       NOT NULL DEFAULT 0 CHECK (precio_per_kg >= 0),
  distrito_origen        TEXT          NOT NULL DEFAULT '',
  imagen_url             TEXT                   DEFAULT '',
  status                 TEXT          NOT NULL DEFAULT 'disponible'
                                       CHECK (status IN ('disponible','reservado','vendido')),
  fecha_cosecha          TIMESTAMPTZ,
  descripcion            TEXT                   DEFAULT '',
  created_at             TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_productos_rubro          ON productos(rubro);
CREATE INDEX IF NOT EXISTS idx_productos_distrito       ON productos(distrito_origen);
CREATE INDEX IF NOT EXISTS idx_productos_status         ON productos(status);
CREATE INDEX IF NOT EXISTS idx_productos_agricultor     ON productos(agricultor_id);
CREATE INDEX IF NOT EXISTS idx_productos_precio         ON productos(precio_per_kg);


-- ----------------------------------------------------------------------------
-- Tabla: ordenes
-- Registro de transacciones comerciales entre compradores y agricultores.
-- Incluye trazabilidad completa de la cadena logística.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ordenes (
  id                      TEXT          PRIMARY KEY,
  fecha_creacion          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  producto_id             TEXT          NOT NULL REFERENCES productos(id) ON DELETE SET NULL,
  titulo_producto         TEXT                   DEFAULT '',
  cantidad_comprada       NUMERIC       NOT NULL DEFAULT 0 CHECK (cantidad_comprada > 0),
  precio_unitario         NUMERIC       NOT NULL DEFAULT 0,
  total_pago_producto     NUMERIC       NOT NULL DEFAULT 0,
  total_pago_flete        NUMERIC       NOT NULL DEFAULT 0,
  status                  TEXT          NOT NULL DEFAULT 'pendiente_flete'
                                        CHECK (status IN (
                                          'pendiente_flete',
                                          'flete_asignado',
                                          'cargando_origen',
                                          'en_transito',
                                          'por_confirmar',
                                          'entregado'
                                        )),
  distrito_origen         TEXT                   DEFAULT '',
  distrito_destino        TEXT                   DEFAULT '',
  agricultor_id           TEXT          REFERENCES users(id) ON DELETE SET NULL,
  nombre_agricultor       TEXT                   DEFAULT '',
  telefono_agricultor     TEXT                   DEFAULT '',
  comprador_id            TEXT          REFERENCES users(id) ON DELETE SET NULL,
  nombre_comprador        TEXT                   DEFAULT '',
  telefono_comprador      TEXT                   DEFAULT '',
  transportista_id        TEXT          REFERENCES users(id) ON DELETE SET NULL,
  nombre_transportista    TEXT,
  telefono_transportista  TEXT,
  vehiculo_placa          TEXT,
  vehiculo_descripcion    TEXT,
  fecha_asignacion_flete  TIMESTAMPTZ,
  fecha_inicio_transito   TIMESTAMPTZ,
  fecha_solicitud_entrega TIMESTAMPTZ,
  fecha_cierre_efectivo   TIMESTAMPTZ,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ordenes_status           ON ordenes(status);
CREATE INDEX IF NOT EXISTS idx_ordenes_agricultor       ON ordenes(agricultor_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_comprador        ON ordenes(comprador_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_transportista    ON ordenes(transportista_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_fecha_creacion   ON ordenes(fecha_creacion DESC);


-- ----------------------------------------------------------------------------
-- Tabla: fletes
-- Gestión de la bolsa de carga y asignación de transportistas.
-- Cada flete está asociado a una orden de compra activa.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fletes (
  id                     TEXT          PRIMARY KEY,
  orden_id               TEXT          REFERENCES ordenes(id) ON DELETE CASCADE,
  origen                 TEXT                   DEFAULT '',
  destino                TEXT                   DEFAULT '',
  peso_carga             NUMERIC       NOT NULL DEFAULT 0 CHECK (peso_carga >= 0),
  tarifa_propuesta       NUMERIC       NOT NULL DEFAULT 0 CHECK (tarifa_propuesta >= 0),
  producto_descripcion   TEXT                   DEFAULT '',
  status                 TEXT          NOT NULL DEFAULT 'disponible'
                                       CHECK (status IN (
                                         'disponible',
                                         'aceptado',
                                         'en_ruta',
                                         'descargado',
                                         'completado'
                                       )),
  transportista_id       TEXT          REFERENCES users(id) ON DELETE SET NULL,
  nombre_transportista   TEXT,
  telefono_transportista TEXT,
  vehiculo_placa         TEXT,
  created_at             TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fletes_status            ON fletes(status);
CREATE INDEX IF NOT EXISTS idx_fletes_orden             ON fletes(orden_id);
CREATE INDEX IF NOT EXISTS idx_fletes_transportista     ON fletes(transportista_id);


-- =============================================================================
-- SECCIÓN 3: DATOS SEMILLA — USUARIOS DEMO
-- Perfiles de demostración para pruebas funcionales de la plataforma.
-- =============================================================================

INSERT INTO users (
  id, rol, email, nombre, telefono, ubicacion, is_midagri_verified,
  vehiculo, ruc, razon_social, documento_url, verificacion_estado
)
VALUES
  -- Usuario anónimo base (referencia interna del sistema)
  (
    'u-anon', 'anon', NULL, 'Visitante Anónimo', '', '', FALSE,
    NULL, NULL, NULL, NULL, 'pendiente'
  ),
  -- Agricultor 1: Productor verificado MIDAGRI en Aco
  (
    'u-agr-tomas', 'agricultor', 'tomas@agroconecta.com',
    'Don Tomás Requena Huanca', '+51 964 123 456',
    'Aco, Concepción — Junín', TRUE,
    NULL, NULL, NULL,
    'dni-tomas-requena.pdf', 'aprobado'
  ),
  -- Agricultor 2: Productor en Mito
  (
    'u-agr-eulogio', 'agricultor', 'eulogio@agroconecta.com',
    'Don Eulogio Chanco Palomino', '+51 954 777 888',
    'Mito, Concepción — Junín', TRUE,
    NULL, NULL, NULL,
    'dni-eulogio-chanco.pdf', 'aprobado'
  ),
  -- Agricultor 3: Asociación de productores en Sincos
  (
    'u-agr-sincos', 'agricultor', 'asociacion@sincos.pe',
    'Asociación Agrícola Sincos', '+51 964 999 111',
    'Sincos, Junín', FALSE,
    NULL, NULL, 'Asociación de Productores Agropecuarios de Sincos',
    NULL, 'pendiente'
  ),
  -- Agricultor 4: Productor en Chanchamayo
  (
    'u-agr-chanchamayo', 'agricultor', 'chanchamayo@agroconecta.com',
    'Hacienda Cítrica del Perene', '+51 944 333 555',
    'Chanchamayo — Junín', TRUE,
    NULL, NULL, NULL,
    'dni-hacienda-perene.pdf', 'aprobado'
  ),
  -- Comprador 1: Minimarket en Huancayo
  (
    'u-com-valeria', 'comprador', 'valeria@agroconecta.com',
    'Minimarket Valeria SAC', '+51 984 555 121',
    'Huancayo — Junín', FALSE,
    NULL, '20481234567', 'Minimarket Valeria SAC',
    'ruc-minimarket-valeria.pdf', 'aprobado'
  ),
  -- Comprador 2: Restaurante en Lima
  (
    'u-com-restaurante', 'comprador', 'restaurante@agroconecta.com',
    'Restaurante El Mantaro EIRL', '+51 999 123 456',
    'Lima — Lima', FALSE,
    NULL, '20599876543', 'Restaurante El Mantaro EIRL',
    NULL, 'pendiente'
  ),
  -- Transportista 1: Fleetero certificado en Concepción
  (
    'u-tra-lucho', 'transportista', 'lucho@agroconecta.com',
    'Lucho Chanco Quispe', '+51 974 887 990',
    'Concepción — Junín', FALSE,
    '{"marca":"International","modelo":"ProStar","tipoCarroceria":"Baranda","capacidadToneladas":8,"placa":"JUN-845"}'::jsonb,
    NULL, NULL, 'dni-lucho-chanco.pdf', 'aprobado'
  ),
  -- Transportista 2: Fleetero en Huancayo
  (
    'u-tra-roberto', 'transportista', 'roberto@agroconecta.com',
    'Roberto Ticllacuri Meza', '+51 974 112 334',
    'Huancayo — Junín', FALSE,
    '{"marca":"Volvo","modelo":"FH16","tipoCarroceria":"Furgón","capacidadToneladas":12,"placa":"JUN-312"}'::jsonb,
    NULL, NULL, NULL, 'pendiente'
  ),
  -- Administrador de plataforma
  (
    'u-adm-agroconecta', 'admin', 'admin@agroconecta.com',
    'Mesa de Control AgroConecta', '+51 900 111 222',
    'Oficina Regional Huancayo', FALSE,
    NULL, NULL, NULL, NULL, 'aprobado'
  ),
  -- Usuario demo/invitado para pruebas
  (
    'u-demo-anonimo', 'comprador', 'demo@agroconecta.com',
    'Usuario Invitado de Pruebas', '+51 912 345 678',
    'El Tambo, Huancayo — Junín', FALSE,
    NULL, NULL, NULL, NULL, 'pendiente'
  )
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- SECCIÓN 4: DATOS SEMILLA — PRODUCTOS AGRÍCOLAS
-- Catálogo inicial con un registro por cada rubro oficial de la plataforma.
-- Lenguaje comercial y formal. Sin términos coloquiales.
-- =============================================================================

INSERT INTO productos (
  id, agricultor_id, nombre_agricultor, telefono_agricultor,
  reputacion_agricultor, is_midagri_verified,
  titulo, rubro, variedad,
  volumen_disponible, precio_per_kg,
  distrito_origen, imagen_url, status, fecha_cosecha, descripcion
)
VALUES

  -- ── 1. TUBÉRCULOS: Papa Camotillo en Aco ──────────────────────────────────
  (
    'p-001',
    'u-agr-tomas',
    'Don Tomás Requena Huanca',
    '+51 964 123 456',
    5.0, TRUE,
    'Papa Nativa Camotillo — Primer Precio de Cosecha',
    'Tubérculos',
    'Camotillo',
    3500, 1.45,
    'Aco',
    'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&q=80',
    'disponible',
    '2026-06-10',
    'Lote seleccionado de Papa Nativa variedad Camotillo, procedente de la unidad de producción ubicada en las laderas altas del distrito de Aco, a 3 250 m.s.n.m. Cultivada bajo técnicas de rotación de terrenos sin uso de herbicidas sistémicos. El tubérculo presenta calibre uniforme entre 50 y 80 mm, pulpa amarilla intensa y piel firme. Cosecha manual en sacos de 50 kg. Cumple los estándares sanitarios del SENASA para comercialización en mercados mayoristas regionales. Volumen disponible para despacho inmediato desde el punto de acopio en Aco. Contacto directo con el productor al número registrado en la plataforma.'
  ),

  -- ── 2. TUBÉRCULOS: Papa Huayro en Aco ─────────────────────────────────────
  (
    'p-002',
    'u-agr-tomas',
    'Don Tomás Requena Huanca',
    '+51 964 123 456',
    5.0, TRUE,
    'Papa Huayro Negra — Variedad Premium de Exportación',
    'Tubérculos',
    'Huayro Negra',
    1200, 2.80,
    'Aco',
    'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&q=80',
    'disponible',
    '2026-06-12',
    'Papa Nativa variedad Huayro Negra, cultivada en la zona alta del distrito de Aco sobre suelos volcánicos de alta fertilidad orgánica. Producto con certificación de origen y trazabilidad documental. Presenta alto contenido de antocianinas y es ampliamente demandada por restaurantes de cocina andina y mercados especializados. Disponible en sacos de 50 kg, embalaje reforzado para transporte en frío o a temperatura ambiente. El lote cuenta con guía de remisión del productor y registro fitosanitario vigente.'
  ),

  -- ── 3. FRUTAS: Naranja Valencia en Chanchamayo ────────────────────────────
  (
    'p-003',
    'u-agr-chanchamayo',
    'Hacienda Cítrica del Perene',
    '+51 944 333 555',
    4.9, TRUE,
    'Naranja Valencia — Jugo Extra Selva Central',
    'Frutas',
    'Valencia',
    8000, 0.95,
    'Chanchamayo',
    'https://images.unsplash.com/photo-1547514701-42782101795e?w=800&q=80',
    'disponible',
    '2026-06-08',
    'Naranja fresca de primera categoría, variedad Valencia, procedente de la unidad de producción de la Hacienda Cítrica del Perene en el distrito de Chanchamayo, a 750 m.s.n.m. Fruta con alto índice de jugosidad (mínimo 45 ml por unidad), cáscara fina y color uniforme naranja intenso. Calibres disponibles: 6, 7 y 8. Cosecha reciente con menos de 72 horas de exposición al campo post-corte. Ideal para consumo directo, procesamiento industrial de jugo y exportación. Transporte recomendado en camión furgón refrigerado a 8°C. Volumen disponible para despacho semanal según programación con el comprador.'
  ),

  -- ── 4. FRUTAS: Mandarina en Chanchamayo ───────────────────────────────────
  (
    'p-004',
    'u-agr-chanchamayo',
    'Hacienda Cítrica del Perene',
    '+51 944 333 555',
    4.9, TRUE,
    'Mandarina Clementina — Selva Central Junín',
    'Frutas',
    'Clementina',
    4500, 1.20,
    'Chanchamayo',
    'https://images.unsplash.com/photo-1547514701-42782101795e?w=800&q=80',
    'disponible',
    '2026-06-09',
    'Mandarina Clementina sin semilla, cultivada en la zona selvática de Chanchamayo bajo sistema de riego por goteo tecnificado. Producto con alta demanda en mercados de Lima Metropolitana y cadenas de supermercados. Brix mínimo garantizado de 11°. Presentación en malla de 5 kg o sacos de 20 kg para mercado mayorista. Guía de remisión y certificado fitosanitario disponibles al momento del despacho.'
  ),

  -- ── 5. CEREALES: Maíz Blanco Urubamba en Mito ────────────────────────────
  (
    'p-005',
    'u-agr-eulogio',
    'Don Eulogio Chanco Palomino',
    '+51 954 777 888',
    4.8, TRUE,
    'Maíz Blanco Gigante Urubamba — Seleccionado a Mano',
    'Cereales',
    'Blanco Urubamba',
    5500, 2.20,
    'Mito',
    'https://images.unsplash.com/photo-1574325131876-a799961e2e5a?w=800&q=80',
    'disponible',
    '2026-06-05',
    'Maíz Blanco Gigante variedad Urubamba, procedente de la unidad de producción agrícola del distrito de Mito, en el Valle del Mantaro. El grano presenta diámetro promedio de 18 mm, color blanco uniforme y humedad de cosecha de 14%. Seleccionado manualmente y ensacado en sacos de 50 kg nuevos. Producto con alta demanda para exportación, industria de chicha de jora artesanal, harina de maíz y restaurantes de comida típica. El lote incluye registro de parcela y declaración de origen del productor. Transporte disponible desde el distrito de Mito con flete coordinado a través de AgroConecta.'
  ),

  -- ── 6. CEREALES: Cebada en Aco ────────────────────────────────────────────
  (
    'p-006',
    'u-agr-tomas',
    'Don Tomás Requena Huanca',
    '+51 964 123 456',
    5.0, TRUE,
    'Cebada Grano Seco — Laderas Altas de Aco',
    'Cereales',
    'Cebada en Grano',
    2800, 1.10,
    'Aco',
    'https://images.unsplash.com/photo-1574325131876-a799961e2e5a?w=800&q=80',
    'disponible',
    '2026-06-14',
    'Cebada en grano cosechada y secada al sol en las laderas altas del distrito de Aco, a 3 600 m.s.n.m. Producto con humedad controlada al 12%, libre de impurezas y hongos. El lote proviene de terrenos de secano con rotación bienal y preparación orgánica del suelo. Empaque en sacos de 50 kg cosidos a máquina. Demandada por industria cervecera artesanal, procesadoras de harina de cebada tostada (máchica) y mercados de salud natural. Disponible para despacho desde el punto de acopio del productor en Aco con coordinación de flete inmediata.'
  ),

  -- ── 7. AGROINDUSTRIA: Café Especial Arábica ───────────────────────────────
  (
    'p-007',
    'u-agr-chanchamayo',
    'Hacienda Cítrica del Perene',
    '+51 944 333 555',
    4.9, TRUE,
    'Café Especial Arábica — Proceso Natural Junín',
    'Agroindustria',
    'Arábica Proceso Natural',
    800, 18.50,
    'Chanchamayo',
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80',
    'disponible',
    '2026-05-28',
    'Café Especial de altura, variedad Arábica, procesado por método natural (honey process) en la unidad de producción de Chanchamayo, entre 1 400 y 1 800 m.s.n.m. Puntaje Q-Grader: 84.5. Notas de cata: chocolate amargo, maracuyá, caramelo y nuez. Humedad del grano verde: 10.5%. Densidad: 680 g/L. Presentación disponible en sacos de 69 kg (quintal) o fraccionado en bolsas de 30 kg con válvula desgasificante. El lote cuenta con certificación de origen, análisis de laboratorio y trazabilidad hasta la parcela del productor. Ideal para tostadores especiales, cadenas de cafeterías premium y exportación a mercados de Europa y Norteamérica.'
  ),

  -- ── 8. FRUTAS: Plátano Seda en Chanchamayo ────────────────────────────────
  (
    'p-008',
    'u-agr-chanchamayo',
    'Hacienda Cítrica del Perene',
    '+51 944 333 555',
    4.9, TRUE,
    'Plátano Seda Orgánico — Valle del Perene',
    'Frutas',
    'Seda',
    6000, 0.75,
    'Chanchamayo',
    'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=800&q=80',
    'disponible',
    '2026-06-11',
    'Plátano variedad Seda, cultivado bajo sistema agroforestal orgánico en el valle del río Perene, Chanchamayo. Racimos con calibre mínimo 24 cm y peso por unidad entre 120 y 160 g. Sin aplicación de maduradoras ni conservantes artificiales. La fruta se cosecha en estado pintón (maduración del 70%) para soportar el transporte logístico de larga distancia. Presentación en jabas plásticas de 20 kg o caja de cartón de exportación. Volumen disponible semanalmente según programación de cosecha. Producto con alta rotación en mercados mayoristas de Lima y Huancayo.'
  ),

  -- ── 9. HORTALIZAS: Alcachofa Suprema en Sincos ───────────────────────────
  (
    'p-009',
    'u-agr-sincos',
    'Asociación Agrícola Sincos',
    '+51 964 999 111',
    5.0, FALSE,
    'Alcachofa Suprema Sin Espinas — Sincos Export Grade',
    'Hortalizas',
    'Suprema Sin Espinas',
    2200, 3.40,
    'Sincos',
    'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=800&q=80',
    'disponible',
    '2026-06-15',
    'Alcachofa variedad Suprema Sin Espinas, producida en las parcelas de la Asociación Agrícola Sincos bajo parámetros técnicos de la Norma Técnica Peruana para hortalizas frescas de exportación. Cabezas uniformes con diámetro entre 8 y 12 cm, color verde intenso, sin manchas por frío ni daño mecánico. El cultivo proviene de las zonas con clima templado del distrito de Sincos, en el Valle del Mantaro, a 3 200 m.s.n.m. Empaque disponible en jabas de 10 kg o caja de exportación de 5 kg. Certificación GlobalGAP en trámite. Alta demanda de procesadoras de conservas y supermercados de Lima y exportación a Europa.'
  ),

  -- ── 10. HORTALIZAS: Zanahoria en Concepción ──────────────────────────────
  (
    'p-010',
    'u-agr-eulogio',
    'Don Eulogio Chanco Palomino',
    '+51 954 777 888',
    4.8, TRUE,
    'Zanahoria Chantenay Extra — Calibre Mercado',
    'Hortalizas',
    'Chantenay',
    3000, 0.80,
    'Concepción',
    'https://images.unsplash.com/photo-1445282768818-728615cc910a?w=800&q=80',
    'disponible',
    '2026-06-07',
    'Zanahoria fresca variedad Chantenay, procedente de la unidad de producción en el distrito de Concepción. Raíces con longitud promedio de 16 cm, diámetro de 4 cm, color naranja intenso y sin bifurcaciones. Cosecha realizada con herramienta manual para preservar la integridad de la piel. Lavada y clasificada en campo por personal técnico. Embolsada en malla de 5 kg o ensacada en sacos de 50 kg para mercado mayorista. Producto listo para despacho inmediato. Alta rotación en mercados de Lima, Huancayo y centros de distribución de cadenas de restaurantes.'
  ),

  -- ── 11. GRANOS ANDINOS: Quinua Blanca de Junín ───────────────────────────
  (
    'p-011',
    'u-agr-sincos',
    'Asociación Agrícola Sincos',
    '+51 964 999 111',
    5.0, FALSE,
    'Quinua Blanca de Junín — Grano Premium Lavado',
    'Granos Andinos',
    'Blanca de Junín',
    1500, 6.80,
    'Sincos',
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80',
    'disponible',
    '2026-06-01',
    'Quinua variedad Blanca de Junín, cultivada en altitudes entre 3 400 y 3 800 m.s.n.m. en las parcelas de altura del distrito de Sincos. Grano perlado con tamaño uniforme de 1.8 mm, humedad del 10%, saponina residual < 0.06% tras proceso de lavado en frío. Empaque disponible en sacos de 50 kg nuevos, bolsas de 1 kg para retail y presentaciones de exportación a granel. El producto cuenta con registro sanitario, análisis de laboratorio y certificado de calidad de la asociación. Demandada por industria alimentaria, exportadores a Europa y Norteamérica, y cadenas de tiendas de alimentos saludables.'
  ),

  -- ── 12. FRUTAS: Piña Golden en Chanchamayo ───────────────────────────────
  (
    'p-012',
    'u-agr-chanchamayo',
    'Hacienda Cítrica del Perene',
    '+51 944 333 555',
    4.9, TRUE,
    'Piña Golden Extra Dulce — Selva Central',
    'Frutas',
    'Golden MD2',
    4000, 1.35,
    'Chanchamayo',
    'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?w=800&q=80',
    'disponible',
    '2026-06-13',
    'Piña variedad Golden MD2, cosechada en la unidad de producción de Chanchamayo. Fruta con peso promedio de 1.8 kg por unidad, Brix mínimo de 14°, acidez controlada y corona verde fresca. La piña Golden es reconocida internacionalmente por su dulzura excepcional, baja acidez y pulpa amarilla uniforme. Ideal para consumo fresco, industria de conservas, jugos concentrados y exportación. Calibres disponibles: 5, 6 y 7 según normas de exportación. Transporte preferentemente en camión furgón refrigerado. Despacho disponible los lunes y jueves desde el punto de acopio en el distrito de Chanchamayo.'
  ),

  -- ── 13. OTRO: Olluco del Valle del Mantaro ───────────────────────────────
  (
    'p-013',
    'u-agr-eulogio',
    'Don Eulogio Chanco Palomino',
    '+51 954 777 888',
    4.8, TRUE,
    'Olluco Nativo Amarillo — Valle del Mantaro',
    'Otro',
    'Olluco Amarillo',
    900, 2.10,
    'Mito',
    'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&q=80',
    'disponible',
    '2026-06-06',
    'Olluco nativo variedad Amarillo, procedente de la unidad de producción del distrito de Mito. Tubérculo andino con textura firme, piel lisa y color amarillo intenso. Producto de consumo interno y uso gastronómico en la cocina andina peruana. Presenta alto valor nutricional con elevado contenido de carbohidratos complejos, mucílagos y minerales. Cosechado a mano y clasificado por tamaño en tres calibres: pequeño, mediano y grande. Embolsado en sacos de 25 kg o mallas de 5 kg para retail. Alta demanda en restaurantes de comida típica de Huancayo, Lima y exportación a comunidades peruanas en el exterior.'
  );


-- =============================================================================
-- SECCIÓN 5: VERIFICACIÓN DEL ESQUEMA
-- Consultas de validación para confirmar la inserción correcta.
-- =============================================================================

-- SELECT COUNT(*) AS total_users    FROM users;
-- SELECT COUNT(*) AS total_productos FROM productos;
-- SELECT rubro, COUNT(*) AS total FROM productos GROUP BY rubro ORDER BY rubro;
-- SELECT distrito_origen, COUNT(*) AS total FROM productos GROUP BY distrito_origen ORDER BY total DESC;


-- =============================================================================
-- FIN DEL SCRIPT
-- Después de ejecutar, actualiza la aplicación web y verifica los datos
-- en el panel de Supabase > Table Editor > productos y users.
-- =============================================================================
