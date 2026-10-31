-- ==========================================================================
-- SUPERMERCADO LA CASONA - ESQUEMA DE BASE DE DATOS POSTGRESQL
-- Anorí, Antioquia, Colombia
-- ==========================================================================

-- 1. Tabla de Usuarios (Clientes y Administradores)
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  telefono VARCHAR(30),
  direccion TEXT,
  rol VARCHAR(20) DEFAULT 'cliente' CHECK (rol IN ('cliente', 'admin', 'gestor')),
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Categorías
CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(80) UNIQUE NOT NULL,
  slug VARCHAR(80) UNIQUE NOT NULL,
  descripcion TEXT,
  icono VARCHAR(60),
  orden INT DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Productos
CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  categoria_id INT REFERENCES categorias(id) ON DELETE SET NULL,
  nombre VARCHAR(200) NOT NULL,
  categoria_nombre VARCHAR(80) NOT NULL,
  presentacion VARCHAR(120) NOT NULL,
  precio NUMERIC(12, 2) NOT NULL,
  precio_anterior NUMERIC(12, 2),
  imagen VARCHAR(255) NOT NULL,
  disponible BOOLEAN DEFAULT true,
  destacado BOOLEAN DEFAULT false,
  badge VARCHAR(50),
  origen VARCHAR(120),
  stock INT DEFAULT 100,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  codigo_orden VARCHAR(40) UNIQUE NOT NULL,
  usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
  cliente_nombre VARCHAR(120) NOT NULL,
  cliente_telefono VARCHAR(40) NOT NULL,
  cliente_direccion TEXT NOT NULL,
  notas TEXT,
  metodo_pago VARCHAR(60) NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL,
  descuento NUMERIC(12, 2) DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL,
  estado VARCHAR(30) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmado', 'en_preparacion', 'en_camino', 'entregado', 'cancelado')),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de Ítems del Pedido
CREATE TABLE IF NOT EXISTS pedido_items (
  id SERIAL PRIMARY KEY,
  pedido_id INT REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id INT REFERENCES productos(id) ON DELETE SET NULL,
  nombre_producto VARCHAR(200) NOT NULL,
  cantidad INT NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(12, 2) NOT NULL,
  total_linea NUMERIC(12, 2) NOT NULL
);

-- 6. Tabla de Favoritos
CREATE TABLE IF NOT EXISTS favoritos (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
  producto_id INT REFERENCES productos(id) ON DELETE CASCADE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(usuario_id, producto_id)
);

-- 7. Tabla de Logs de Auditoría para la Consola Administrativa
CREATE TABLE IF NOT EXISTS logs_auditoria (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
  accion VARCHAR(100) NOT NULL,
  modulo VARCHAR(50) NOT NULL,
  detalle JSONB,
  ip_origen VARCHAR(45),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización de consultas
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_disponible ON productos(disponible);
CREATE INDEX IF NOT EXISTS idx_productos_destacado ON productos(destacado);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos(creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
