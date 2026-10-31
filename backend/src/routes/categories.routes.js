const express = require('express');
const router = express.Router();
const db = require('../config/db');

/**
 * GET /api/categories
 * Listado de categorías activas
 */
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, nombre, slug, descripcion, icono, orden
       FROM categorias
       WHERE activa = true
       ORDER BY orden ASC, nombre ASC`
    );

    res.json({
      success: true,
      categories: result.rows
    });
  } catch (error) {
    console.error('[CATEGORIES GET] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al consultar categorías'
    });
  }
});

module.exports = router;
