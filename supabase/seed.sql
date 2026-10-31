-- ==========================================================================
-- SUPERMERCADO LA CASONA - SEED OFICIAL ESTANDARIZADO PARA SUPABASE
-- Localidad: Anorí, Antioquia, Colombia
-- Idempotente (ON CONFLICT DO UPDATE) y sincronizado con frontend/js/products.js
-- ==========================================================================

-- 1. Sembrar Categorías Oficiales
INSERT INTO public.categorias (id, nombre, slug, descripcion, icono, orden, activa)
VALUES
  (1, 'Frutas y verduras', 'frutas-y-verduras', 'Cosecha fresca del campo y huertas seleccionadas', 'apple', 1, true),
  (2, 'Carnes y huevos', 'carnes-y-huevos', 'Cortes seleccionados de res, pollo y huevos frescos', 'beef', 2, true),
  (3, 'Lácteos', 'lacteos', 'Leche, quesos y derivados de la cuenca lechera antioqueña', 'milk', 3, true),
  (4, 'Panadería', 'panaderia', 'Pan fresco horneado a diario y arepas tradicionales', 'bread', 4, true),
  (5, 'Despensa', 'despensa', 'Abarrotes, granos, aceites y café de montaña', 'shopping-bag', 5, true),
  (6, 'Bebidas', 'bebidas', 'Jugos naturales, aguas de manantial y refrescos', 'cup', 6, true),
  (7, 'Aseo del hogar', 'aseo-del-hogar', 'Productos de limpieza y cuidado para toda la familia', 'home', 7, true)
ON CONFLICT (slug) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  icono = EXCLUDED.icono,
  orden = EXCLUDED.orden,
  activa = EXCLUDED.activa;

SELECT setval(
  pg_get_serial_sequence('public.categorias', 'id'),
  COALESCE((SELECT MAX(id) FROM public.categorias), 1),
  true
);

-- 2. Sembrar Usuarios Iniciales (Administrador y Cliente Demo con pgcrypto bcrypt)
INSERT INTO public.usuarios (nombre, email, password_hash, telefono, direccion, rol, activo)
VALUES
  (
    'Administrador La Casona',
    'admin@supermercadolacasona.com.co',
    crypt('AdminCasona2026*', gen_salt('bf', 10)),
    '+573103810674',
    'Sede Principal Parque Anorí, Antioquia',
    'admin',
    true
  ),
  (
    'Carlos Restrepo',
    'carlos.restrepo@correo.com',
    crypt('Cliente1234*', gen_salt('bf', 10)),
    '310 381 0674',
    'Parque Principal, Anorí, Antioquia',
    'cliente',
    true
  )
ON CONFLICT (email) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo;

SELECT setval(
  pg_get_serial_sequence('public.usuarios', 'id'),
  COALESCE((SELECT MAX(id) FROM public.usuarios), 1),
  true
);

-- 3. Sembrar Catálogo Oficial de 23 Productos (IDs 1..23 idénticos al Frontend)
INSERT INTO public.productos (
  id, categoria_id, nombre, categoria_nombre, presentacion,
  precio, precio_anterior, imagen, disponible, destacado, badge, origen, stock
)
VALUES
  (1,  1, 'Manzana Roja Royal Gala', 'Frutas y verduras', 'Bolsa x 1 kg (aprox. 5 unidades)', 7200, 9000, 'assets/manzana.svg', true, true, '20% OFF', 'Selección Frutas Frescas', 50),
  (2,  1, 'Plátano Maduro Seleccionado', 'Frutas y verduras', 'Racimo x 1 kg', 4500, NULL, 'assets/platano.svg', true, false, NULL, 'Región Andina', 80),
  (3,  1, 'Aguacate Hass Extra', 'Frutas y verduras', 'Malla x 3 unidades (aprox. 600g)', 8900, 11000, 'assets/aguacate.svg', true, true, 'Oferta', 'Antioquia, Colombia', 40),
  (4,  1, 'Tomate Chonto Maduro', 'Frutas y verduras', 'Bolsa x 1 kg', 4800, 5500, 'assets/tomate.svg', true, false, 'Fresco', 'Huerta Seleccionada', 65),
  (5,  1, 'Zanahoria Fresca Lavada', 'Frutas y verduras', 'Bolsa x 1 kg', 3600, NULL, 'assets/zanahoria.svg', true, false, NULL, 'Cosecha Seleccionada', 75),
  (6,  2, 'Pechuga de Pollo Fresca Fileteada', 'Carnes y huevos', 'Bandeja x 800g (fileteada)', 16500, 19500, 'assets/pollo.svg', true, true, '15% OFF', 'Avícola Certificada', 35),
  (7,  2, 'Carne Molida Especial Res 90/10', 'Carnes y huevos', 'Bandeja x 500g', 15900, NULL, 'assets/carne.svg', true, false, NULL, 'Carnes Seleccionadas', 30),
  (8,  2, 'Huevos Rojos Tipo AA', 'Carnes y huevos', 'Cubeta x 30 unidades', 18500, 21000, 'assets/huevos.svg', true, true, 'Ahorro', 'Granja Avícola', 45),
  (9,  3, 'Leche Entera Ultrapasteurizada', 'Lácteos', 'Bolsa x 1100 ml', 4600, NULL, 'assets/leche.svg', true, false, NULL, 'Cuenca Lechera de Antioquia', 120),
  (10, 3, 'Queso Blanco Tradicional', 'Lácteos', 'Bloque x 500g', 11200, 13500, 'assets/queso.svg', true, true, 'Recomendado', 'Norte de Antioquia', 40),
  (11, 3, 'Yogur Griego Natural Sin Azúcar', 'Lácteos', 'Vaso x 1000g', 14800, 17200, 'assets/yogur.svg', true, false, 'Saludable', 'Lácteos Especiales', 25),
  (12, 4, 'Pan Tajado Integral con Semillas', 'Panadería', 'Paquete x 550g', 7800, 9200, 'assets/pan.svg', true, false, 'Fibra', 'Horneado diario', 35),
  (13, 4, 'Croissants Artesanales de Mantequilla', 'Panadería', 'Paquete x 4 unidades', 8500, NULL, 'assets/croissant.svg', true, true, 'Horneado Fresco', 'Panadería La Casona', 20),
  (14, 4, 'Arepas de Maíz Blanco con Chía', 'Panadería', 'Paquete x 5 unidades (500g)', 4900, NULL, 'assets/arepas.svg', true, false, NULL, 'Tradición Paisa', 60),
  (15, 5, 'Arroz Blanco Grano Largo Extra', 'Despensa', 'Bolsa x 1000g', 4700, 5200, 'assets/arroz.svg', true, false, 'Básico', 'Molino Nacional', 150),
  (16, 5, 'Aceite Vegetal Puro 100% Girasol', 'Despensa', 'Botella x 1000 ml', 13900, 16500, 'assets/aceite.svg', true, true, '15% OFF', 'Consumo Familiar', 55),
  (17, 5, 'Café Especial Colombiano Tostado y Molido', 'Despensa', 'Bolsa x 500g con válvula', 22500, 26000, 'assets/cafe.svg', true, true, 'Premium', 'Café de Montaña Colombiano', 70),
  (18, 5, 'Fríjol Bola Roja Seleccionado', 'Despensa', 'Bolsa x 500g', 6800, NULL, 'assets/frijol.svg', true, false, NULL, 'Granos Seleccionados', 80),
  (19, 6, 'Jugo de Naranja 100% Prensado en Frío', 'Bebidas', 'Botella x 1000 ml', 8900, 10500, 'assets/jugo.svg', true, true, '100% Natural', 'Cítricos Seleccionados', 30),
  (20, 6, 'Agua Mineral de Manantial con Gas', 'Bebidas', 'Botella x 1500 ml', 3800, NULL, 'assets/agua.svg', true, false, NULL, 'Manantial Natural', 90),
  (21, 7, 'Detergente Líquido Ropa Concentrado', 'Aseo del hogar', 'Galón x 2000 ml', 24900, 29900, 'assets/detergente.svg', true, true, 'Mega Ahorro', 'Biodegradable', 40),
  (22, 7, 'Lavaloza en Crema con Extracto de Limón', 'Aseo del hogar', 'Pote x 450g con esponja', 5400, 6200, 'assets/lavaloza.svg', true, false, 'Eficaz', 'Fórmula antigrasa', 60),
  (23, 1, 'Papa Pastusa Seleccionada', 'Frutas y verduras', 'Bolsa x 1 kg', 6000, 7000, 'assets/papa.svg', true, true, 'Tradicional', 'Cundinamarca / Boyacá', 85)
ON CONFLICT (id) DO UPDATE SET
  categoria_id = EXCLUDED.categoria_id,
  nombre = EXCLUDED.nombre,
  categoria_nombre = EXCLUDED.categoria_nombre,
  presentacion = EXCLUDED.presentacion,
  precio = EXCLUDED.precio,
  precio_anterior = EXCLUDED.precio_anterior,
  imagen = EXCLUDED.imagen,
  disponible = EXCLUDED.disponible,
  destacado = EXCLUDED.destacado,
  badge = EXCLUDED.badge,
  origen = EXCLUDED.origen,
  stock = EXCLUDED.stock;

SELECT setval(
  pg_get_serial_sequence('public.productos', 'id'),
  COALESCE((SELECT MAX(id) FROM public.productos), 1),
  true
);

-- 4. Sembrar Pedido de Demostración para la Consola Administrativa
DO $$
DECLARE
  v_demo_user_id BIGINT;
  v_order_id BIGINT;
BEGIN
  SELECT id INTO v_demo_user_id FROM public.usuarios WHERE email = 'carlos.restrepo@correo.com' LIMIT 1;

  IF NOT EXISTS (SELECT 1 FROM public.pedidos WHERE codigo_orden = 'ORDEN #LC-2026-3819') THEN
    INSERT INTO public.pedidos (
      codigo_orden, usuario_id, cliente_nombre, cliente_telefono, cliente_direccion,
      notas, metodo_pago, subtotal, descuento, total, estado
    )
    VALUES (
      'ORDEN #LC-2026-3819',
      v_demo_user_id,
      'Carlos Restrepo',
      '310 381 0674',
      'Calle 10 # 8-24, Barrio Centro, Anorí',
      'Favor empacar las manzanas separadas y llamar antes de salir.',
      'contraentrega-datafono',
      42100,
      0,
      42100,
      'confirmado'
    )
    RETURNING id INTO v_order_id;

    INSERT INTO public.pedido_items (pedido_id, producto_id, nombre_producto, cantidad, precio_unitario, total_linea)
    VALUES
      (v_order_id, 1, 'Manzana Roja Royal Gala', 2, 7200, 14400),
      (v_order_id, 9, 'Leche Entera Ultrapasteurizada', 2, 4600, 9200),
      (v_order_id, 8, 'Huevos Rojos Tipo AA', 1, 18500, 18500);
  END IF;
END
$$;

