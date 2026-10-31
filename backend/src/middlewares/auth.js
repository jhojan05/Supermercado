const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supermercado_casona_jwt_secure_secret_anori_antioquia_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Acceso no autorizado: Se requiere un token de sesión válido'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token de sesión expirado o inválido'
      });
    }
    req.user = user;
    next();
  });
}

function optionalToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err) {
      req.user = user;
    } else {
      req.user = null;
    }
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || (req.user.rol !== 'admin' && req.user.rol !== 'gestor')) {
    return res.status(403).json({
      success: false,
      message: 'Permiso denegado: Se requieren privilegios de administración para esta operación'
    });
  }
  next();
}

module.exports = {
  authenticateToken,
  optionalToken,
  requireAdmin,
  JWT_SECRET,
};
