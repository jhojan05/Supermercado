const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function seed() {
  console.log('[SEED] Iniciando inicialización y sembrado de PostgreSQL...');

  try {
    // 1. Ejecutar esquema SQL
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await db.query(schemaSql);
    console.log('[SEED] Esquema de tablas creado/verificado correctamente.');

    // 2. Sembrar Categorías
    const categorias = [
      { nombre: 'Frutas y verduras', slug: 'frutas-y-verduras', icono: 'apple', orden: 1 },
      { nombre: 'Carnes y huevos', slug: 'carnes-y-huevos', icono: 'beef', orden: 2 },
      { nombre: 'Lácteos', slug: 'lacteos', icono: 'milk', orden: 3 },
      { nombre: 'Panadería', slug: 'panaderia', icono: 'bread', orden: 4 },
      { nombre: 'Despensa', slug: 'despensa', icono: 'shopping-bag', orden: 5 },
      { nombre: 'Bebidas', slug: 'bebidas', icono: 'cup', orden: 6 },
      { nombre: 'Aseo del hogar', slug: 'aseo-del-hogar', icono: 'home', orden: 7 }
    ];

    const catMap = new Map();
    for (const cat of categorias) {
      const res = await db.query(
        `INSERT INTO categorias (nombre, slug, orden, activa)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (slug) DO UPDATE SET nombre = EXCLUDED.nombre, orden = EXCLUDED.orden
         RETURNING id, nombre`,
        [cat.nombre, cat.slug, cat.orden]
      );
      catMap.set(cat.nombre, res.rows[0].id);
    }
    console.log(`[SEED] ${catMap.size} categorías sembradas.`);

    // 3. Sembrar Usuarios (Admin y Demo Cliente)
    const adminPassHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'AdminCasona2026*', 10);
    const adminUser = await db.query(
      `INSERT INTO usuarios (nombre, email, password_hash, telefono, rol, activo)
       VALUES ($1, $2, $3, $4, 'admin', true)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, rol = 'admin'
       RETURNING id, nombre, email, rol`,
      [
        process.env.ADMIN_NAME || 'Administrador La Casona',
        (process.env.ADMIN_EMAIL || 'admin@supermercadolacasona.com.co').toLowerCase(),
        adminPassHash,
        process.env.ADMIN_PHONE || '+573103810674'
      ]
    );
    console.log(`[SEED] Usuario Administrador preparado: ${adminUser.rows[0].email} (Rol: ${adminUser.rows[0].rol})`);

    const demoPassHash = await bcrypt.hash('Cliente1234*', 10);
    const demoUser = await db.query(
      `INSERT INTO usuarios (nombre, email, password_hash, telefono, direccion, rol, activo)
       VALUES ($1, $2, $3, $4, $5, 'cliente', true)
       ON CONFLICT (email) DO UPDATE SET nombre = EXCLUDED.nombre
       RETURNING id, nombre, email, rol`,
      [
        'Carlos Restrepo',
        'carlos.restrepo@correo.com',
        demoPassHash,
        '310 381 0674',
        'Parque Principal, Anorí, Antioquia'
      ]
    );
    console.log(`[SEED] Usuario Demo preparado: ${demoUser.rows[0].email}`);

    // 4. Catálogo Oficial de Productos (idéntico a js/products.js)
    const products = [
      {
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
      }
    ];

    let insertedCount = 0;
    for (const p of products) {
      const catId = catMap.get(p.categoria) || null;
      await db.query(
        `INSERT INTO productos (
           nombre, categoria_id, categoria_nombre, presentacion, precio,
           precio_anterior, imagen, disponible, destacado, badge, origen, stock
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
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
      insertedCount++;
    }
    console.log(`[SEED] ${insertedCount} productos del catálogo oficial sembrados exitosamente.`);

    // 5. Sembrar Pedido de Demostración para pruebas en la Consola Administrativa
    const orderExists = await db.query(`SELECT id FROM pedidos WHERE codigo_orden = 'ORDEN #LC-2026-3819'`);
    if (orderExists.rows.length === 0) {
      const orderRes = await db.query(
        `INSERT INTO pedidos (
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
          42800,
          0,
          42800,
          'confirmado'
        ]
      );

      const orderId = orderRes.rows[0].id;
      await db.query(
        `INSERT INTO pedido_items (pedido_id, nombre_producto, cantidad, precio_unitario, total_linea)
         VALUES 
           ($1, 'Manzana Roja Royal Gala', 2, 7200, 14400),
           ($1, 'Leche Entera Ultrapasteurizada', 2, 4600, 9200),
           ($1, 'Huevos Rojos Tipo AA', 1, 18500, 18500)`,
        [orderId]
      );
      console.log('[SEED] Pedido inicial de demostración creado con éxito para la consola administrativa.');
    }

    // 6. Registro inicial en logs de auditoría
    await db.query(
      `INSERT INTO logs_auditoria (usuario_id, accion, modulo, detalle)
       VALUES ($1, 'INICIALIZACION_SISTEMA', 'SISTEMA', $2)`,
      [adminUser.rows[0].id, JSON.stringify({ mensaje: 'Base de datos PostgreSQL inicializada con catálogo de Anorí' })]
    );

    console.log('[SEED] ¡Inicialización completada con éxito rotundo!');
  } catch (err) {
    console.error('[SEED] Error durante el proceso de inicialización:', err);
    process.exit(1);
  } finally {
    await db.pool.end();
  }
}

seed();
