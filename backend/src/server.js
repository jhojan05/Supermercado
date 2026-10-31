const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const db = require('./config/db');

// Rutas de la API
const authRoutes = require('./routes/auth.routes');
const categoriesRoutes = require('./routes/categories.routes');
const productsRoutes = require('./routes/products.routes');
const ordersRoutes = require('./routes/orders.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.resolve(__dirname, '../../');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');

// Middlewares globales
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Rutas de API REST
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/admin', adminRoutes);

// Endpoint de verificación de salud
app.get('/api/health', async (req, res) => {
  try {
    const dbTest = await db.query('SELECT NOW() as now, version() as version');
    res.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'Supermercado La Casona - Backend API',
      database: {
        connected: true,
        time: dbTest.rows[0].now,
        version: dbTest.rows[0].version
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: err.message
      }
    });
  }
});

// Servicio de la Consola Administrativa (/consola o /consola/)
app.use('/consola', express.static(path.join(FRONTEND_DIR, 'consola'), { index: 'index.html' }));

// Servicio de archivos estáticos del Frontend principal (raíz)
app.use(express.static(FRONTEND_DIR));

// Fallback para SPA de la Consola Administrativa
app.get('/consola/*', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'consola', 'index.html'));
});

// Manejador global de errores 404 para la API
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta API no encontrada: ${req.method} ${req.originalUrl}`
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`==========================================================`);
  console.log(` SUPERMERCADO LA CASONA - SERVIDOR BACKEND ACTIVO`);
  console.log(` Localidad: Anorí, Antioquia`);
  console.log(` Puerto: http://localhost:${PORT}`);
  console.log(` Tienda Principal: http://localhost:${PORT}/`);
  console.log(` Consola Administrativa: http://localhost:${PORT}/consola/`);
  console.log(` API REST Health: http://localhost:${PORT}/api/health`);
  console.log(` Base de Datos: PostgreSQL (Docker Desktop)`);
  console.log(`==========================================================`);
});

module.exports = app;
