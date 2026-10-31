const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'supermercado_casona_jwt_secure_secret_anori_antioquia_2026';
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || null;

/**
 * Verifica un token JWT (compatible tanto con Supabase Auth JWT como con el JWT propio del Backend)
 * y valida contra public.usuarios que la cuenta esté activa y cuál es su rol autoritativo.
 * Cumple la lista de seguridad de Supabase:
 *  - Nunca confía en user_metadata para decisiones de autorización (rol).
 *  - Verifica que el usuario exista y siga activo en base de datos en rutas sensibles.
 */
async function verifyAndResolveUser(token) {
  let payload = null;
  let isSupabaseJwt = false;

  // 1. Intentar verificar con SUPABASE_JWT_SECRET si está configurado
  if (SUPABASE_JWT_SECRET) {
    try {
      payload = jwt.verify(token, SUPABASE_JWT_SECRET);
      isSupabaseJwt = true;
    } catch (_err) {
      payload = null;
    }
  }

  // 2. Si no es un token firmado con SUPABASE_JWT_SECRET, verificar con JWT_SECRET local
  if (!payload) {
    payload = jwt.verify(token, JWT_SECRET);
  }

  // 3. Si es un token de Supabase Auth (contiene claim 'sub' UUID), resolver perfil desde public.usuarios
  if (isSupabaseJwt || (payload && payload.sub && !payload.rol)) {
    const authUserId = payload.sub;
    const email = payload.email ? String(payload.email).trim().toLowerCase() : null;

    const userRes = await db.query(
      `SELECT id, uuid, auth_user_id, nombre, email, telefono, direccion, rol, activo
       FROM public.usuarios
       WHERE auth_user_id = $1 OR ($2::text IS NOT NULL AND LOWER(email) = $2)
       LIMIT 1`,
      [authUserId, email]
    );

    if (userRes.rows.length > 0) {
      const dbUser = userRes.rows[0];
      if (!dbUser.activo) {
        const inactiveError = new Error('Cuenta inactiva o suspendida');
        inactiveError.statusCode = 403;
        throw inactiveError;
      }

      // Vincular auth_user_id si aún no estaba asociado
      if (!dbUser.auth_user_id && authUserId) {
        await db.query(
          `UPDATE public.usuarios SET auth_user_id = $1 WHERE id = $2`,
          [authUserId, dbUser.id]
        );
      }

      return {
        id: dbUser.id,
        uuid: dbUser.uuid,
        auth_user_id: authUserId,
        nombre: dbUser.nombre,
        email: dbUser.email,
        rol: dbUser.rol, // Rol autoritativo desde public.usuarios (nunca desde user_metadata)
      };
    }

    // Si el usuario se autenticó en Supabase Auth pero aún no tenía fila en public.usuarios
    const appMetaRole =
      payload.app_metadata && ['admin', 'gestor', 'cliente'].includes(payload.app_metadata.rol)
        ? payload.app_metadata.rol
        : 'cliente';

    if (email) {
      const created = await db.query(
        `INSERT INTO public.usuarios (auth_user_id, nombre, email, password_hash, rol, activo)
         VALUES ($1, $2, $3, 'SUPABASE_AUTH_MANAGED', $4, true)
         ON CONFLICT (email) DO UPDATE SET auth_user_id = EXCLUDED.auth_user_id
         RETURNING id, uuid, nombre, email, rol`,
        [authUserId, email.split('@')[0], email, appMetaRole]
      );
      return created.rows[0];
    }
  }

  return payload;
}

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Acceso no autorizado: Se requiere un token de sesión válido'
    });
  }

  try {
    const user = await verifyAndResolveUser(token);
    req.user = user;
    next();
  } catch (err) {
    const status = err.statusCode || 403;
    return res.status(status).json({
      success: false,
      message: err.statusCode === 403 && err.message
        ? err.message
        : 'Token de sesión expirado o inválido'
    });
  }
}

async function optionalToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    req.user = await verifyAndResolveUser(token);
  } catch (_err) {
    req.user = null;
  }
  next();
}

async function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Acceso no autorizado: Sesión requerida'
    });
  }

  try {
    // Validación autoritativa contra la base de datos para proteger rutas administrativas
    // y asegurar que cuentas revocadas o degradadas pierdan acceso de inmediato
    const dbCheck = await db.query(
      `SELECT id, rol, activo FROM public.usuarios WHERE id = $1 LIMIT 1`,
      [req.user.id]
    );

    if (dbCheck.rows.length === 0 || !dbCheck.rows[0].activo) {
      return res.status(403).json({
        success: false,
        message: 'Acceso revocado: La cuenta ya no se encuentra activa'
      });
    }

    const authoritativeRole = dbCheck.rows[0].rol;
    if (authoritativeRole !== 'admin' && authoritativeRole !== 'gestor') {
      return res.status(403).json({
        success: false,
        message: 'Permiso denegado: Se requieren privilegios de administración para esta operación'
      });
    }

    req.user.rol = authoritativeRole;
    next();
  } catch (err) {
    // Fallback seguro al claim firmado por el servidor si la base de datos está en modo offline
    if (req.user.rol !== 'admin' && req.user.rol !== 'gestor') {
      return res.status(403).json({
        success: false,
        message: 'Permiso denegado: Se requieren privilegios de administración para esta operación'
      });
    }
    next();
  }
}

module.exports = {
  authenticateToken,
  optionalToken,
  requireAdmin,
  verifyAndResolveUser,
  JWT_SECRET,
};
