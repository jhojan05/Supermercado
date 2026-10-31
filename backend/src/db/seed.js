const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const envPath = path.resolve(__dirname, '../../.env');
require('dotenv').config({ path: envPath });
const bcrypt = require('bcryptjs');
let db = require('../config/db');

/**
 * Si la conexión directa db.<ref>.supabase.co falla en redes IPv4 (ENOTFOUND),
 * detecta automáticamente el Session Pooler IPv4 de Supabase (aws-0/aws-1.<region>.pooler.supabase.com)
 */
async function ensureReachableDatabase() {
  try {
    await db.query('SELECT 1');
    return;
  } catch (err) {
    const connUrl = process.env.DATABASE_URL || '';
    const directMatch = connUrl.match(/^postgresql:\/\/postgres:([^@]+)@db\.([a-z0-9]+)\.supabase\.co:5432\/postgres/i);
    if (!directMatch || err.code !== 'ENOTFOUND') {
      throw err;
    }

    const [, password, projectRef] = directMatch;
    console.log(`[SEED] Host directo db.${projectRef}.supabase.co es solo IPv6. Buscando Pooler IPv4 de Supabase...`);

    const regions = [
      'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
      'sa-east-1', 'ca-central-1',
      'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-north-1', 'eu-central-2',
      'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2', 'ap-south-1'
    ];
    const clusters = ['aws-0', 'aws-1'];

    for (const cluster of clusters) {
      for (const region of regions) {
        const poolerHost = `${cluster}-${region}.pooler.supabase.com`;
        const poolerUrl = `postgresql://postgres.${projectRef}:${password}@${poolerHost}:5432/postgres`;
        const testPool = new Pool({
          connectionString: poolerUrl,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 4000,
        });

        try {
          await testPool.query('SELECT 1');
          console.log(`[SEED] ¡Pooler IPv4 encontrado en ${poolerHost}!`);
          await db.pool.end().catch(() => {});
          db = {
            query: (text, params) => testPool.query(text, params),
            pool: testPool,
          };

          // Actualizar backend/.env con la URL del Session Pooler IPv4
          if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const updatedEnv = envContent.replace(connUrl, poolerUrl);
            fs.writeFileSync(envPath, updatedEnv, 'utf8');
          }
          return;
        } catch (probeErr) {
          await testPool.end().catch(() => {});
          if (probeErr.message && probeErr.message.includes('password authentication failed')) {
            throw new Error(` Región encontrada (${poolerHost}), pero la contraseña de base de datos fue rechazada por Supabase.`);
          }
        }
      }
    }

    throw err;
  }
}

async function seed() {
  console.log('[SEED] Iniciando estandarización y sembrado PostgreSQL (Formato Supabase)...');

  try {
    await ensureReachableDatabase();
    // 1. Ejecutar esquema SQL estandarizado para Supabase (extensiones, roles, RLS, triggers, realtime)
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await db.query(schemaSql);
    console.log('[SEED] Esquema public.*, políticas RLS, triggers y publicación Realtime verificados.');

    // 2. Sembrar Categorías Oficiales (IDs 1..7)
    const categorias = [
      { id: 1, nombre: 'Frutas y verduras', slug: 'frutas-y-verduras', descripcion: 'Cosecha fresca del campo y huertas seleccionadas', icono: 'apple', orden: 1 },
      { id: 2, nombre: 'Carnes y huevos', slug: 'carnes-y-huevos', descripcion: 'Cortes seleccionados de res, pollo y huevos frescos', icono: 'beef', orden: 2 },
      { id: 3, nombre: 'Lácteos', slug: 'lacteos', descripcion: 'Leche, quesos y derivados de la cuenca lechera antioqueña', icono: 'milk', orden: 3 },
      { id: 4, nombre: 'Panadería', slug: 'panaderia', descripcion: 'Pan fresco horneado a diario y arepas tradicionales', icono: 'bread', orden: 4 },
      { id: 5, nombre: 'Despensa', slug: 'despensa', descripcion: 'Abarrotes, granos, aceites y café de montaña', icono: 'shopping-bag', orden: 5 },
      { id: 6, nombre: 'Bebidas', slug: 'bebidas', descripcion: 'Jugos naturales, aguas de manantial y refrescos', icono: 'cup', orden: 6 },
      { id: 7, nombre: 'Aseo del hogar', slug: 'aseo-del-hogar', descripcion: 'Productos de limpieza y cuidado para toda la familia', icono: 'home', orden: 7 }
    ];

    const catMap = new Map();
    for (const cat of categorias) {
      const res = await db.query(
        `INSERT INTO public.categorias (id, nombre, slug, descripcion, icono, orden, activa)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT (slug) DO UPDATE SET
           nombre = EXCLUDED.nombre,
           descripcion = EXCLUDED.descripcion,
           icono = EXCLUDED.icono,
           orden = EXCLUDED.orden,
           activa = true
         RETURNING id, nombre`,
        [cat.id, cat.nombre, cat.slug, cat.descripcion, cat.icono, cat.orden]
      );
      catMap.set(cat.nombre, res.rows[0].id);
    }

    await db.query(`
      SELECT setval(
        pg_get_serial_sequence('public.categorias', 'id'),
        COALESCE((SELECT MAX(id) FROM public.categorias), 1),
        true
      )
    `);
    console.log(`[SEED] ${catMap.size} categorías sembradas y secuencia sincronizada.`);

    // 3. Sembrar Usuarios (Admin y Demo Cliente)
    const adminPassHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'AdminCasona2026*', 10);
    const adminUser = await db.query(
      `INSERT INTO public.usuarios (nombre, email, password_hash, telefono, rol, activo)
       VALUES ($1, $2, $3, $4, 'admin', true)
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         rol = 'admin',
         activo = true
       RETURNING id, uuid, nombre, email, rol`,
      [
        process.env.ADMIN_NAME || 'Administrador La Casona',
        (process.env.ADMIN_EMAIL || 'admin@supermercadolacasona.com.co').toLowerCase(),
        adminPassHash,
        process.env.ADMIN_PHONE || '+573103810674'
      ]
    );
    console.log(`[SEED] Usuario Administrador preparado: ${adminUser.rows[0].email} (UUID: ${adminUser.rows[0].uuid})`);

    const demoPassHash = await bcrypt.hash('Cliente1234*', 10);
    const demoUser = await db.query(
      `INSERT INTO public.usuarios (nombre, email, password_hash, telefono, direccion, rol, activo)
       VALUES ($1, $2, $3, $4, $5, 'cliente', true)
       ON CONFLICT (email) DO UPDATE SET
         nombre = EXCLUDED.nombre,
         activo = true
       RETURNING id, uuid, nombre, email, rol`,
      [
        'Carlos Restrepo',
        'carlos.restrepo@correo.com',
        demoPassHash,
        '310 381 0674',
        'Parque Principal, Anorí, Antioquia'
      ]
    );
    console.log(`[SEED] Usuario Demo preparado: ${demoUser.rows[0].email} (UUID: ${demoUser.rows[0].uuid})`);

    await db.query(`
      SELECT setval(
        pg_get_serial_sequence('public.usuarios', 'id'),
        COALESCE((SELECT MAX(id) FROM public.usuarios), 1),
        true
      )
    `);

    // 4. Catálogo Oficial de 23 Productos (IDs 1..23 idénticos a frontend/js/products.js)
    const products = [
      {
        id: 1,
        nombre: "Manzana Roja Royal Gala",
        categoria: "Frutas y verduras",
        presentacion: "Bolsa x 1 kg (aprox. 5 unidades)",
        precio: 7200,
        precioAnterior: 9000,
        imagen: "assets/manzana.svg",
        disponible: true,
        destacado: true,
        badge: "20% OFF",
        origen: "Selección Frutas Frescas",
        stock: 50
      },
      {
        id: 2,
        nombre: "Plátano Maduro Seleccionado",
        categoria: "Frutas y verduras",
        presentacion: "Racimo x 1 kg",
        precio: 4500,
        precioAnterior: null,
        imagen: "assets/platano.svg",
        disponible: true,
        destacado: false,
        badge: null,
        origen: "Región Andina",
        stock: 80
      },
      {
        id: 3,
        nombre: "Aguacate Hass Extra",
        categoria: "Frutas y verduras",
        presentacion: "Malla x 3 unidades (aprox. 600g)",
        precio: 8900,
        precioAnterior: 11000,
        imagen: "assets/aguacate.svg",
        disponible: true,
        destacado: true,
        badge: "Oferta",
        origen: "Antioquia, Colombia",
        stock: 40
      },
      {
        id: 4,
        nombre: "Tomate Chonto Maduro",
        categoria: "Frutas y verduras",
        presentacion: "Bolsa x 1 kg",
        precio: 4800,
        precioAnterior: 5500,
        imagen: "assets/tomate.svg",
        disponible: true,
        destacado: false,
        badge: "Fresco",
        origen: "Huerta Seleccionada",
        stock: 65
      },
      {
        id: 5,
        nombre: "Zanahoria Fresca Lavada",
        categoria: "Frutas y verduras",
        presentacion: "Bolsa x 1 kg",
        precio: 3600,
        precioAnterior: null,
        imagen: "assets/zanahoria.svg",
        disponible: true,
        destacado: false,
        badge: null,
        origen: "Cosecha Seleccionada",
        stock: 75
      },
      {
        id: 6,
        nombre: "Pechuga de Pollo Fresca Fileteada",
        categoria: "Carnes y huevos",
        presentacion: "Bandeja x 800g (fileteada)",
        precio: 16500,
        precioAnterior: 19500,
        imagen: "assets/pollo.svg",
        disponible: true,
        destacado: true,
        badge: "15% OFF",
        origen: "Avícola Certificada",
        stock: 35
      },
      {
        id: 7,
        nombre: "Carne Molida Especial Res 90/10",
        categoria: "Carnes y huevos",
        presentacion: "Bandeja x 500g",
        precio: 15900,
        precioAnterior: null,
        imagen: "assets/carne.svg",
        disponible: true,
        destacado: false,
        badge: null,
        origen: "Carnes Seleccionadas",
        stock: 30
      },
      {
        id: 8,
        nombre: "Huevos Rojos Tipo AA",
        categoria: "Carnes y huevos",
        presentacion: "Cubeta x 30 unidades",
        precio: 18500,
        precioAnterior: 21000,
        imagen: "assets/huevos.svg",
        disponible: true,
        destacado: true,
        badge: "Ahorro",
        origen: "Granja Avícola",
        stock: 45
      },
      {
        id: 9,
        nombre: "Leche Entera Ultrapasteurizada",
        categoria: "Lácteos",
        presentacion: "Bolsa x 1100 ml",
        precio: 4600,
        precioAnterior: null,
        imagen: "assets/leche.svg",
        disponible: true,
        destacado: false,
        badge: null,
        origen: "Cuenca Lechera de Antioquia",
        stock: 120
      },
      {
        id: 10,
        nombre: "Queso Blanco Tradicional",
        categoria: "Lácteos",
        presentacion: "Bloque x 500g",
        precio: 11200,
        precioAnterior: 13500,
        imagen: "assets/queso.svg",
        disponible: true,
        destacado: true,
        badge: "Recomendado",
        origen: "Norte de Antioquia",
        stock: 40
      },
      {
        id: 11,
        nombre: "Yogur Griego Natural Sin Azúcar",
        categoria: "Lácteos",
        presentacion: "Vaso x 1000g",
        precio: 14800,
        precioAnterior: 17200,
        imagen: "assets/yogur.svg",
        disponible: true,
        destacado: false,
        badge: "Saludable",
        origen: "Lácteos Especiales",
        stock: 25
      },
      {
        id: 12,
        nombre: "Pan Tajado Integral con Semillas",
        categoria: "Panadería",
        presentacion: "Paquete x 550g",
        precio: 7800,
        precioAnterior: 9200,
        imagen: "assets/pan.svg",
        disponible: true,
        destacado: false,
        badge: "Fibra",
        origen: "Horneado diario",
        stock: 35
      },
      {
        id: 13,
        nombre: "Croissants Artesanales de Mantequilla",
        categoria: "Panadería",
        presentacion: "Paquete x 4 unidades",
        precio: 8500,
        precioAnterior: null,
        imagen: "assets/croissant.svg",
        disponible: true,
        destacado: true,
        badge: "Horneado Fresco",
        origen: "Panadería La Casona",
        stock: 20
      },
      {
        id: 14,
        nombre: "Arepas de Maíz Blanco con Chía",
        categoria: "Panadería",
        presentacion: "Paquete x 5 unidades (500g)",
        precio: 4900,
        precioAnterior: null,
        imagen: "assets/arepas.svg",
        disponible: true,
        destacado: false,
        badge: null,
        origen: "Tradición Paisa",
        stock: 60
      },
      {
        id: 15,
        nombre: "Arroz Blanco Grano Largo Extra",
        categoria: "Despensa",
        presentacion: "Bolsa x 1000g",
        precio: 4700,
        precioAnterior: 5200,
        imagen: "assets/arroz.svg",
        disponible: true,
        destacado: false,
        badge: "Básico",
        origen: "Molino Nacional",
        stock: 150
      },
      {
        id: 16,
        nombre: "Aceite Vegetal Puro 100% Girasol",
        categoria: "Despensa",
        presentacion: "Botella x 1000 ml",
        precio: 13900,
        precioAnterior: 16500,
        imagen: "assets/aceite.svg",
        disponible: true,
        destacado: true,
        badge: "15% OFF",
        origen: "Consumo Familiar",
        stock: 55
      },
      {
        id: 17,
        nombre: "Café Especial Colombiano Tostado y Molido",
        categoria: "Despensa",
        presentacion: "Bolsa x 500g con válvula",
        precio: 22500,
        precioAnterior: 26000,
        imagen: "assets/cafe.svg",
        disponible: true,
        destacado: true,
        badge: "Premium",
        origen: "Café de Montaña Colombiano",
        stock: 70
      },
      {
        id: 18,
        nombre: "Fríjol Bola Roja Seleccionado",
        categoria: "Despensa",
        presentacion: "Bolsa x 500g",
        precio: 6800,
        precioAnterior: null,
        imagen: "assets/frijol.svg",
        disponible: true,
        destacado: false,
        badge: null,
        origen: "Granos Seleccionados",
        stock: 80
      },
      {
        id: 19,
        nombre: "Jugo de Naranja 100% Prensado en Frío",
        categoria: "Bebidas",
        presentacion: "Botella x 1000 ml",
        precio: 8900,
        precioAnterior: 10500,
        imagen: "assets/jugo.svg",
        disponible: true,
        destacado: true,
        badge: "100% Natural",
        origen: "Cítricos Seleccionados",
        stock: 30
      },
      {
        id: 20,
        nombre: "Agua Mineral de Manantial con Gas",
        categoria: "Bebidas",
        presentacion: "Botella x 1500 ml",
        precio: 3800,
        precioAnterior: null,
        imagen: "assets/agua.svg",
        disponible: true,
        destacado: false,
        badge: null,
        origen: "Manantial Natural",
        stock: 90
      },
      {
        id: 21,
        nombre: "Detergente Líquido Ropa Concentrado",
        categoria: "Aseo del hogar",
        presentacion: "Galón x 2000 ml",
        precio: 24900,
        precioAnterior: 29900,
        imagen: "assets/detergente.svg",
        disponible: true,
        destacado: true,
        badge: "Mega Ahorro",
        origen: "Biodegradable",
        stock: 40
      },
      {
        id: 22,
        nombre: "Lavaloza en Crema con Extracto de Limón",
        categoria: "Aseo del hogar",
        presentacion: "Pote x 450g con esponja",
        precio: 5400,
        precioAnterior: 6200,
        imagen: "assets/lavaloza.svg",
        disponible: true,
        destacado: false,
        badge: "Eficaz",
        origen: "Fórmula antigrasa",
        stock: 60
      },
      {
        id: 23,
        nombre: "Papa Pastusa Seleccionada",
        categoria: "Frutas y verduras",
        presentacion: "Bolsa x 1 kg",
        precio: 6000,
        precioAnterior: 7000,
        imagen: "assets/papa.svg",
        disponible: true,
        destacado: true,
        badge: "Tradicional",
        origen: "Cundinamarca / Boyacá",
        stock: 85
      }
    ];

    // Limpiar posibles duplicados previos fuera del rango oficial 1..23 si la tabla tenía semillas repetidas sin pedidos asociados
    let upsertedCount = 0;
    for (const p of products) {
      const catId = catMap.get(p.categoria) || null;
      await db.query(
        `INSERT INTO public.productos (
           id, nombre, categoria_id, categoria_nombre, presentacion, precio,
           precio_anterior, imagen, disponible, destacado, badge, origen, stock
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO UPDATE SET
           nombre = EXCLUDED.nombre,
           categoria_id = EXCLUDED.categoria_id,
           categoria_nombre = EXCLUDED.categoria_nombre,
           presentacion = EXCLUDED.presentacion,
           precio = EXCLUDED.precio,
           precio_anterior = EXCLUDED.precio_anterior,
           imagen = EXCLUDED.imagen,
           disponible = EXCLUDED.disponible,
           destacado = EXCLUDED.destacado,
           badge = EXCLUDED.badge,
           origen = EXCLUDED.origen,
           stock = EXCLUDED.stock`,
        [
          p.id,
          p.nombre,
          catId,
          p.categoria,
          p.presentacion,
          p.precio,
          p.precioAnterior,
          p.imagen,
          p.disponible,
          p.destacado,
          p.badge,
          p.origen,
          p.stock
        ]
      );
      upsertedCount++;
    }

    await db.query(`
      SELECT setval(
        pg_get_serial_sequence('public.productos', 'id'),
        COALESCE((SELECT MAX(id) FROM public.productos), 1),
        true
      )
    `);
    console.log(`[SEED] ${upsertedCount} productos del catálogo oficial sincronizados (IDs 1..23).`);

    // 5. Sembrar Pedido de Demostración para pruebas en la Consola Administrativa
    const orderExists = await db.query(`SELECT id FROM public.pedidos WHERE codigo_orden = 'ORDEN #LC-2026-3819'`);
    if (orderExists.rows.length === 0) {
      const orderRes = await db.query(
        `INSERT INTO public.pedidos (
           codigo_orden, usuario_id, cliente_nombre, cliente_telefono, cliente_direccion,
           notas, metodo_pago, subtotal, descuento, total, estado
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [
          'ORDEN #LC-2026-3819',
          demoUser.rows[0].id,
          'Carlos Restrepo',
          '310 381 0674',
          'Calle 10 # 8-24, Barrio Centro, Anorí',
          'Favor empacar las manzanas separadas y llamar antes de salir.',
          'contraentrega-datafono',
          42100,
          0,
          42100,
          'confirmado'
        ]
      );

      const orderId = orderRes.rows[0].id;
      await db.query(
        `INSERT INTO public.pedido_items (pedido_id, producto_id, nombre_producto, cantidad, precio_unitario, total_linea)
         VALUES 
           ($1, 1, 'Manzana Roja Royal Gala', 2, 7200, 14400),
           ($1, 9, 'Leche Entera Ultrapasteurizada', 2, 4600, 9200),
           ($1, 8, 'Huevos Rojos Tipo AA', 1, 18500, 18500)`,
        [orderId]
      );
      console.log('[SEED] Pedido inicial de demostración creado con éxito para la consola administrativa.');
    }

    // 6. Registro inicial en logs de auditoría
    await db.query(
      `INSERT INTO public.logs_auditoria (usuario_id, accion, modulo, detalle)
       VALUES ($1, 'ESTANDARIZACION_SUPABASE', 'SISTEMA', $2)`,
      [
        adminUser.rows[0].id,
        JSON.stringify({
          mensaje: 'Base de datos PostgreSQL estandarizada al formato de Supabase (RLS, UUIDs, Triggers, Realtime)',
          version: '2.0.0-supabase'
        })
      ]
    );

    console.log('[SEED] ¡Estandarización y sembrado completados con éxito rotundo!');
  } catch (err) {
    console.error('[SEED] Error durante el proceso de inicialización:', err);
    process.exit(1);
  } finally {
    await db.pool.end();
  }
}

seed();
