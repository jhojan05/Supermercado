const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

// Todas las rutas de este router requieren autenticación y rol de administrador
router.use(authenticateToken, requireAdmin);

/**
 * GET /api/admin/metrics
 * Métricas clave (KPIs) para el Dashboard de la Consola Administrativa
 */
router.get('/metrics', async (req, res) => {
  try {
    // 1. Total ventas hoy
    const ventasHoyRes = await db.query(`
      SELECT COALESCE(SUM(total), 0)::float AS total_hoy, COUNT(id) AS pedidos_hoy
      FROM pedidos
      WHERE DATE(creado_en) = CURRENT_DATE AND estado != 'cancelado'
    `);

    // 2. Total ventas del mes
    const ventasMesRes = await db.query(`
      SELECT COALESCE(SUM(total), 0)::float AS total_mes, COUNT(id) AS pedidos_mes
      FROM pedidos
      WHERE DATE_TRUNC('month', creado_en) = DATE_TRUNC('month', CURRENT_DATE) AND estado != 'cancelado'
    `);

    // 3. Pedidos por estado
    const pedidosEstadoRes = await db.query(`
      SELECT estado, COUNT(id) AS cantidad
      FROM pedidos
      GROUP BY estado
    `);

    // 4. Conteo de clientes
    const clientesRes = await db.query(`
      SELECT COUNT(id) AS total_clientes
      FROM usuarios
      WHERE rol = 'cliente'
    `);

    // 5. Conteo de productos e inventario crítico
    const productosRes = await db.query(`
      SELECT 
        COUNT(id) AS total_productos,
        COUNT(CASE WHEN stock <= 15 THEN 1 END) AS bajo_stock,
        COUNT(CASE WHEN disponible = false THEN 1 END) AS agotados
      FROM productos
    `);

    // 6. Últimos 5 pedidos
    const ultimosPedidosRes = await db.query(`
      SELECT id, codigo_orden, cliente_nombre, total::float, estado, creado_en
      FROM pedidos
      ORDER BY creado_en DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      metrics: {
        ventasHoy: ventasHoyRes.rows[0].total_hoy,
        pedidosHoy: parseInt(ventasHoyRes.rows[0].pedidos_hoy, 10),
        ventasMes: ventasMesRes.rows[0].total_mes,
        pedidosMes: parseInt(ventasMesRes.rows[0].pedidos_mes, 10),
        pedidosPorEstado: pedidosEstadoRes.rows.reduce((acc, row) => {
          acc[row.estado] = parseInt(row.cantidad, 10);
          return acc;
        }, {}),
        totalClientes: parseInt(clientesRes.rows[0].total_clientes, 10),
        totalProductos: parseInt(productosRes.rows[0].total_productos, 10),
        bajoStock: parseInt(productosRes.rows[0].bajo_stock, 10),
        agotados: parseInt(productosRes.rows[0].agotados, 10),
        ultimosPedidos: ultimosPedidosRes.rows
      }
    });
  } catch (error) {
    console.error('[ADMIN METRICS] Error:', error);
    res.status(500).json({ success: false, message: 'Error al consultar métricas del dashboard' });
  }
});

/**
 * GET /api/admin/orders
 * Listado de pedidos completo para gestión operativa
 */
router.get('/orders', async (req, res) => {
  try {
    const { estado, search } = req.query;
    let queryText = `
      SELECT 
        p.id,
        p.codigo_orden,
        p.usuario_id,
        p.cliente_nombre,
        p.cliente_telefono,
        p.cliente_direccion,
        p.notas,
        p.metodo_pago,
        p.subtotal::float,
        p.descuento::float,
        p.total::float,
        p.estado,
        p.creado_en,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pi.id,
              'nombre', pi.nombre_producto,
              'cantidad', pi.cantidad,
              'precio', pi.precio_unitario::float,
              'total', pi.total_linea::float
            )
          ) FILTER (WHERE pi.id IS NOT NULL), '[]'
        ) AS items
      FROM pedidos p
      LEFT JOIN pedido_items pi ON p.id = pi.pedido_id
      WHERE 1=1
    `;
    const params = [];
    let pIdx = 1;

    if (estado && estado !== 'todos') {
      queryText += ` AND p.estado = $${pIdx}`;
      params.push(estado);
      pIdx++;
    }

    if (search && search.trim() !== '') {
      queryText += ` AND (
        p.codigo_orden ILIKE $${pIdx} 
        OR p.cliente_nombre ILIKE $${pIdx} 
        OR p.cliente_telefono ILIKE $${pIdx}
      )`;
      params.push(`%${search.trim()}%`);
      pIdx++;
    }

    queryText += ` GROUP BY p.id ORDER BY p.creado_en DESC`;

    const result = await db.query(queryText, params);
    res.json({ success: true, total: result.rows.length, orders: result.rows });
  } catch (error) {
    console.error('[ADMIN ORDERS] Error:', error);
    res.status(500).json({ success: false, message: 'Error al consultar pedidos' });
  }
});

/**
 * PATCH /api/admin/orders/:id/status
 * Cambiar estado de un pedido (pendiente, en_preparacion, en_camino, entregado, cancelado)
 */
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevoEstado } = req.body;

    const estadosValidos = ['pendiente', 'confirmado', 'en_preparacion', 'en_camino', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(nuevoEstado)) {
      return res.status(400).json({ success: false, message: 'Estado no válido' });
    }

    const result = await db.query(
      `UPDATE pedidos
       SET estado = $1, actualizado_en = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, codigo_orden, estado, cliente_nombre, cliente_telefono`,
      [nuevoEstado, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
    }

    // Auditoría
    await db.query(
      `INSERT INTO logs_auditoria (usuario_id, accion, modulo, detalle, ip_origen)
       VALUES ($1, 'CAMBIO_ESTADO_PEDIDO', 'PEDIDOS', $2, $3)`,
      [
        req.user.id,
        JSON.stringify({ pedidoId: id, codigo: result.rows[0].codigo_orden, estado: nuevoEstado }),
        req.ip
      ]
    );

    res.json({
      success: true,
      message: `Estado actualizado a "${nuevoEstado}" correctamente`,
      order: result.rows[0]
    });
  } catch (error) {
    console.error('[ADMIN ORDER STATUS] Error:', error);
    res.status(500).json({ success: false, message: 'Error al cambiar estado del pedido' });
  }
});

/**
 * GET /api/admin/products
 * Catálogo completo para gestión de inventario y edición
 */
router.get('/products', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        p.id, 
        p.categoria_id,
        p.nombre, 
        p.categoria_nombre AS "categoria", 
        p.presentacion, 
        p.precio::float, 
        p.precio_anterior::float AS "precioAnterior", 
        p.imagen, 
        p.disponible, 
        p.destacado, 
        p.badge, 
        p.origen, 
        p.stock,
        p.actualizado_en
      FROM productos p
      ORDER BY p.id ASC
    `);

    res.json({ success: true, products: result.rows });
  } catch (error) {
    console.error('[ADMIN PRODUCTS GET] Error:', error);
    res.status(500).json({ success: false, message: 'Error al consultar productos para administración' });
  }
});

/**
 * POST /api/admin/products
 * Crear un nuevo producto en el catálogo
 */
router.post('/products', async (req, res) => {
  try {
    const {
      nombre,
      categoria,
      presentacion,
      precio,
      precioAnterior,
      imagen,
      disponible,
      destacado,
      badge,
      origen,
      stock
    } = req.body;

    if (!nombre || !categoria || !presentacion || !precio) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, categoría, presentación y precio son campos requeridos'
      });
    }

    // Buscar categoría id
    const catRes = await db.query(`SELECT id FROM categorias WHERE nombre = $1`, [categoria]);
    const categoriaId = catRes.rows.length > 0 ? catRes.rows[0].id : null;

    const result = await db.query(
      `INSERT INTO productos (
         nombre, categoria_id, categoria_nombre, presentacion, precio,
         precio_anterior, imagen, disponible, destacado, badge, origen, stock
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        nombre.trim(),
        categoriaId,
        categoria.trim(),
        presentacion.trim(),
        parseFloat(precio),
        precioAnterior ? parseFloat(precioAnterior) : null,
        imagen ? imagen.trim() : 'assets/logo.svg',
        disponible !== undefined ? Boolean(disponible) : true,
        destacado !== undefined ? Boolean(destacado) : false,
        badge ? badge.trim() : null,
        origen ? origen.trim() : 'Supermercado La Casona',
        stock !== undefined ? parseInt(stock, 10) : 100
      ]
    );

    // Auditoría
    await db.query(
      `INSERT INTO logs_auditoria (usuario_id, accion, modulo, detalle, ip_origen)
       VALUES ($1, 'CREAR_PRODUCTO', 'CATALOGO', $2, $3)`,
      [req.user.id, JSON.stringify({ productoId: result.rows[0].id, nombre }), req.ip]
    );

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente en el catálogo',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('[ADMIN CREATE PRODUCT] Error:', error);
    res.status(500).json({ success: false, message: 'Error al crear producto' });
  }
});

/**
 * PUT /api/admin/products/:id
 * Editar producto existente
 */
router.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      categoria,
      presentacion,
      precio,
      precioAnterior,
      imagen,
      disponible,
      destacado,
      badge,
      origen,
      stock
    } = req.body;

    const catRes = await db.query(`SELECT id FROM categorias WHERE nombre = $1`, [categoria]);
    const categoriaId = catRes.rows.length > 0 ? catRes.rows[0].id : null;

    const result = await db.query(
      `UPDATE productos
       SET 
         nombre = COALESCE($1, nombre),
         categoria_id = COALESCE($2, categoria_id),
         categoria_nombre = COALESCE($3, categoria_nombre),
         presentacion = COALESCE($4, presentacion),
         precio = COALESCE($5, precio),
         precio_anterior = $6,
         imagen = COALESCE($7, imagen),
         disponible = COALESCE($8, disponible),
         destacado = COALESCE($9, destacado),
         badge = $10,
         origen = COALESCE($11, origen),
         stock = COALESCE($12, stock),
         actualizado_en = CURRENT_TIMESTAMP
       WHERE id = $13
       RETURNING *`,
      [
        nombre ? nombre.trim() : null,
        categoriaId,
        categoria ? categoria.trim() : null,
        presentacion ? presentacion.trim() : null,
        precio !== undefined ? parseFloat(precio) : null,
        precioAnterior !== undefined && precioAnterior !== '' ? parseFloat(precioAnterior) : null,
        imagen ? imagen.trim() : null,
        disponible !== undefined ? Boolean(disponible) : null,
        destacado !== undefined ? Boolean(destacado) : null,
        badge !== undefined && badge !== '' ? badge.trim() : null,
        origen ? origen.trim() : null,
        stock !== undefined ? parseInt(stock, 10) : null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    // Auditoría
    await db.query(
      `INSERT INTO logs_auditoria (usuario_id, accion, modulo, detalle, ip_origen)
       VALUES ($1, 'EDITAR_PRODUCTO', 'CATALOGO', $2, $3)`,
      [req.user.id, JSON.stringify({ productoId: id, cambios: req.body }), req.ip]
    );

    res.json({
      success: true,
      message: 'Producto actualizado con éxito',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('[ADMIN EDIT PRODUCT] Error:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar el producto' });
  }
});

/**
 * PATCH /api/admin/products/:id/toggle
 * Alternar rápido disponibilidad o estado destacado
 */
router.patch('/products/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { field } = req.body; // 'disponible' o 'destacado'

    if (field !== 'disponible' && field !== 'destacado') {
      return res.status(400).json({ success: false, message: 'Campo inválido para toggle' });
    }

    const result = await db.query(
      `UPDATE productos
       SET ${field} = NOT ${field}, actualizado_en = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, nombre, disponible, destacado`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    res.json({
      success: true,
      message: `Campo ${field} cambiado a ${result.rows[0][field]}`,
      product: result.rows[0]
    });
  } catch (error) {
    console.error('[ADMIN TOGGLE PRODUCT] Error:', error);
    res.status(500).json({ success: false, message: 'Error al modificar estado del producto' });
  }
});

/**
 * DELETE /api/admin/products/:id
 * Eliminar producto del catálogo
 */
router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`DELETE FROM productos WHERE id = $1 RETURNING id, nombre`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    await db.query(
      `INSERT INTO logs_auditoria (usuario_id, accion, modulo, detalle, ip_origen)
       VALUES ($1, 'ELIMINAR_PRODUCTO', 'CATALOGO', $2, $3)`,
      [req.user.id, JSON.stringify({ productoId: id, nombre: result.rows[0].nombre }), req.ip]
    );

    res.json({
      success: true,
      message: `Producto "${result.rows[0].nombre}" eliminado correctamente`
    });
  } catch (error) {
    console.error('[ADMIN DELETE PRODUCT] Error:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar producto' });
  }
});

/**
 * GET /api/admin/customers
 * Directorio de clientes registrados
 */
router.get('/customers', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        u.id, 
        u.nombre, 
        u.email, 
        u.telefono, 
        u.direccion, 
        u.creado_en,
        COUNT(p.id) AS total_pedidos,
        COALESCE(SUM(p.total), 0)::float AS total_comprado
      FROM usuarios u
      LEFT JOIN pedidos p ON u.id = p.usuario_id AND p.estado != 'cancelado'
      WHERE u.rol = 'cliente'
      GROUP BY u.id
      ORDER BY u.creado_en DESC
    `);

    res.json({ success: true, customers: result.rows });
  } catch (error) {
    console.error('[ADMIN CUSTOMERS] Error:', error);
    res.status(500).json({ success: false, message: 'Error al consultar clientes' });
  }
});

/**
 * GET /api/admin/logs
 * Registro de auditoría del sistema
 */
router.get('/logs', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT l.id, l.accion, l.modulo, l.detalle, l.ip_origen, l.creado_en, u.nombre AS admin_nombre, u.email AS admin_email
      FROM logs_auditoria l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      ORDER BY l.creado_en DESC
      LIMIT 100
    `);

    res.json({ success: true, logs: result.rows });
  } catch (error) {
    console.error('[ADMIN LOGS] Error:', error);
    res.status(500).json({ success: false, message: 'Error al consultar logs de auditoría' });
  }
});

module.exports = router;
