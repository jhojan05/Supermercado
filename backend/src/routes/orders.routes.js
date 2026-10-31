const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { optionalToken, authenticateToken } = require('../middlewares/auth');

/**
 * Genera código único de orden en formato ORDEN #LC-YYYY-XXXX
 */
function generateOrderCode() {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `ORDEN #LC-${year}-${randomNum}`;
}

/**
 * POST /api/orders
 * Crear un nuevo pedido desde el carrito de compras (Cliente o Invitado)
 */
router.post('/', optionalToken, async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { nombre, telefono, direccion, notas, metodoPago, items } = req.body;

    if (!nombre || !telefono || !direccion || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos obligatorios para procesar la orden (nombre, teléfono, dirección e ítems)'
      });
    }

    await client.query('BEGIN');

    // 1. Validar productos y calcular totales en servidor (protección anti-manipulación)
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const prodRes = await client.query(
        `SELECT id, nombre, precio::float, disponible, stock FROM productos WHERE id = $1`,
        [item.id]
      );

      if (prodRes.rows.length === 0) {
        throw new Error(`El producto con ID ${item.id} no existe en el catálogo.`);
      }

      const prod = prodRes.rows[0];
      if (!prod.disponible) {
        throw new Error(`El producto "${prod.nombre}" no está disponible actualmente.`);
      }

      const cantidad = parseInt(item.cantidad, 10);
      if (isNaN(cantidad) || cantidad <= 0) {
        throw new Error(`Cantidad inválida para el producto "${prod.nombre}".`);
      }

      const totalLinea = prod.precio * cantidad;
      subtotal += totalLinea;

      validatedItems.push({
        producto_id: prod.id,
        nombre_producto: prod.nombre,
        cantidad,
        precio_unitario: prod.precio,
        total_linea: totalLinea
      });
    }

    const descuento = 0; // Se pueden aplicar cupones en el futuro
    const total = subtotal - descuento;
    const codigoOrden = generateOrderCode();
    const usuarioId = req.user ? req.user.id : null;

    // 2. Insertar pedido principal
    const orderInsert = await client.query(
      `INSERT INTO pedidos (
         codigo_orden, usuario_id, cliente_nombre, cliente_telefono, cliente_direccion,
         notas, metodo_pago, subtotal, descuento, total, estado
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pendiente')
       RETURNING id, codigo_orden, estado, creado_en`,
      [
        codigoOrden,
        usuarioId,
        nombre.trim(),
        telefono.trim(),
        direccion.trim(),
        notas ? notas.trim() : null,
        metodoPago || 'efectivo',
        subtotal,
        descuento,
        total
      ]
    );

    const pedidoId = orderInsert.rows[0].id;

    // 3. Insertar ítems del pedido
    for (const vItem of validatedItems) {
      await client.query(
        `INSERT INTO pedido_items (pedido_id, producto_id, nombre_producto, cantidad, precio_unitario, total_linea)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          pedidoId,
          vItem.producto_id,
          vItem.nombre_producto,
          vItem.cantidad,
          vItem.precio_unitario,
          vItem.total_linea
        ]
      );

      // Descontar inventario si aplica
      await client.query(
        `UPDATE productos 
         SET stock = GREATEST(0, stock - $1),
             actualizado_en = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [vItem.cantidad, vItem.producto_id]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: '¡Pedido registrado con éxito en Supermercado La Casona!',
      order: {
        id: pedidoId,
        codigo: codigoOrden,
        cliente: nombre,
        telefono,
        direccion,
        total,
        estado: 'pendiente',
        itemsCount: validatedItems.length,
        creado_en: orderInsert.rows[0].creado_en
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[ORDERS CREATE] Error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al registrar el pedido'
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/orders/my-orders
 * Consultar órdenes del usuario autenticado
 */
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const ordersRes = await db.query(
      `SELECT 
         p.id,
         p.codigo_orden AS "codigo",
         p.total::float,
         p.estado,
         p.metodo_pago AS "metodoPago",
         p.creado_en AS "fecha",
         p.cliente_direccion AS "direccion",
         COALESCE(
           json_agg(
             json_build_object(
               'nombre', pi.nombre_producto,
               'cantidad', pi.cantidad,
               'precio', pi.precio_unitario::float,
               'total', pi.total_linea::float
             )
           ) FILTER (WHERE pi.id IS NOT NULL), '[]'
         ) AS "items"
       FROM pedidos p
       LEFT JOIN pedido_items pi ON p.id = pi.pedido_id
       WHERE p.usuario_id = $1
       GROUP BY p.id
       ORDER BY p.creado_en DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      orders: ordersRes.rows
    });
  } catch (error) {
    console.error('[ORDERS MY-ORDERS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al consultar pedidos del usuario'
    });
  }
});

module.exports = router;
