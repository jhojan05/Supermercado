const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { authenticateToken, requireAdmin, JWT_SECRET } = require('../middlewares/auth');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * GET /api/auth/config
 * Configuración pública segura de Supabase Auth para el cliente (NUNCA expone service_role)
 */
router.get('/config', (req, res) => {
  res.json({
    success: true,
    supabaseEnabled: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
    supabaseUrl: process.env.SUPABASE_URL || null,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || null
  });
});

/**
 * POST /api/auth/login
 * Iniciar sesión para clientes y administradores
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor ingresa tu correo y contraseña'
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const result = await db.query(
      `SELECT id, uuid, auth_user_id, nombre, email, password_hash, telefono, direccion, rol, activo
       FROM public.usuarios
       WHERE LOWER(email) = $1`,
      [cleanEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas. Revisa tu correo o contraseña.'
      });
    }

    const user = result.rows[0];

    if (!user.activo) {
      return res.status(403).json({
        success: false,
        message: 'Esta cuenta se encuentra inactiva. Contacta a soporte de La Casona.'
      });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas. Revisa tu correo o contraseña.'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        sub: user.auth_user_id || user.uuid,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        app_metadata: { rol: user.rol }
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Registro de auditoría si es administrador
    if (user.rol === 'admin' || user.rol === 'gestor') {
      await db.query(
        `INSERT INTO public.logs_auditoria (usuario_id, accion, modulo, detalle, ip_origen)
         VALUES ($1, 'LOGIN_ADMIN', 'SEGURIDAD', $2, $3)`,
        [user.id, JSON.stringify({ email: user.email }), req.ip]
      );
    }

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user.id,
        uuid: user.uuid,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono,
        direccion: user.direccion,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error('[AUTH LOGIN] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al procesar el inicio de sesión'
    });
  }
});

/**
 * POST /api/auth/register
 * Registro de nuevos clientes
 */
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, password, telefono, direccion } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, correo y contraseña son obligatorios'
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Validar existencia de correo
    const existing = await db.query(`SELECT id FROM public.usuarios WHERE LOWER(email) = $1`, [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'El correo electrónico ya se encuentra registrado. Por favor inicia sesión.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO public.usuarios (nombre, email, password_hash, telefono, direccion, rol, activo)
       VALUES ($1, $2, $3, $4, $5, 'cliente', true)
       RETURNING id, uuid, nombre, email, telefono, direccion, rol`,
      [nombre.trim(), cleanEmail, passwordHash, telefono ? telefono.trim() : null, direccion ? direccion.trim() : null]
    );

    const newUser = result.rows[0];
    const token = jwt.sign(
      {
        id: newUser.id,
        sub: newUser.uuid,
        nombre: newUser.nombre,
        email: newUser.email,
        rol: newUser.rol,
        app_metadata: { rol: newUser.rol }
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'Cuenta creada con éxito en Supermercado La Casona',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('[AUTH REGISTER] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario en la base de datos'
    });
  }
});

/**
 * GET /api/auth/me
 * Ruta protegida: Obtener perfil del usuario autenticado en sesión
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, uuid, auth_user_id, nombre, email, telefono, direccion, rol, creado_en
       FROM public.usuarios
       WHERE id = $1 AND activo = true`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado o dado de baja'
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('[AUTH ME] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al consultar la sesión'
    });
  }
});

/**
 * GET /api/auth/verify-admin
 * Ruta protegida administrativa: Verifica sesión activa y rol autoritativo en public.usuarios
 */
router.get('/verify-admin', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    success: true,
    authorized: true,
    user: {
      id: req.user.id,
      nombre: req.user.nombre,
      email: req.user.email,
      rol: req.user.rol
    }
  });
});

/**
 * POST /api/auth/logout
 * Ruta protegida: Cierre de sesión con trazabilidad de auditoría
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    if (req.user && (req.user.rol === 'admin' || req.user.rol === 'gestor')) {
      await db.query(
        `INSERT INTO public.logs_auditoria (usuario_id, accion, modulo, detalle, ip_origen)
         VALUES ($1, 'LOGOUT_ADMIN', 'SEGURIDAD', $2, $3)`,
        [req.user.id, JSON.stringify({ email: req.user.email }), req.ip]
      );
    }
    res.json({
      success: true,
      message: 'Sesión cerrada correctamente'
    });
  } catch (_err) {
    res.json({
      success: true,
      message: 'Sesión cerrada'
    });
  }
});

module.exports = router;
