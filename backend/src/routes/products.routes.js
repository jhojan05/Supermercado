const express = require('express');
const router = express.Router();
const db = require('../config/db');

/**
 * GET /api/products
 * Catálogo público de productos disponibles con filtros y ordenamiento
 */
router.get('/', async (req, res) => {
  try {
    const { category, search, offers, sortBy } = req.query;

    let queryText = `
      SELECT 
        p.id, 
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
        p.stock
      FROM productos p
      WHERE p.disponible = true
    `;
    const params = [];
    let paramIndex = 1;

    // Filtro por categoría
    if (category && category !== 'all' && category !== 'Todas las categorías') {
      queryText += ` AND (LOWER(p.categoria_nombre) = LOWER($${paramIndex}))`;
      params.push(category);
      paramIndex++;
    }

    // Filtro por búsqueda textual
    if (search && search.trim() !== '') {
      queryText += ` AND (
        p.nombre ILIKE $${paramIndex} 
        OR p.categoria_nombre ILIKE $${paramIndex} 
        OR p.presentacion ILIKE $${paramIndex}
      )`;
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    // Filtro por solo promociones / ofertas
    if (offers === 'true' || offers === true) {
      queryText += ` AND (p.precio_anterior IS NOT NULL AND p.precio_anterior > p.precio)`;
    }

    // Ordenamiento
    switch (sortBy) {
      case 'price-asc':
        queryText += ` ORDER BY p.precio ASC`;
        break;
      case 'price-desc':
        queryText += ` ORDER BY p.precio DESC`;
        break;
      case 'name-asc':
        queryText += ` ORDER BY p.nombre ASC`;
        break;
      case 'featured':
      default:
        queryText += ` ORDER BY p.destacado DESC, p.id ASC`;
        break;
    }

    const result = await db.query(queryText, params);

    res.json({
      success: true,
      total: result.rows.length,
      products: result.rows
    });
  } catch (error) {
    console.error('[PRODUCTS GET] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al consultar productos'
    });
  }
});

/**
 * GET /api/products/:id
 * Detalle individual de un producto
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT 
        p.id, 
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
        p.stock
       FROM productos p
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      product: result.rows[0]
    });
  } catch (error) {
    console.error('[PRODUCT DETAIL GET] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al consultar detalle del producto'
    });
  }
});

module.exports = router;
