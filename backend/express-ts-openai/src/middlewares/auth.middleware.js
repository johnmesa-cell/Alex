import jwt from 'jsonwebtoken';
import config from '../config/index.js';

export const verifyToken = (req, res, next) => {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token && req.cookies && req.cookies.alex_token) {
      token = req.cookies.alex_token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token no proporcionado o formato inválido' });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    req.usuario = decoded;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'El token ha expirado' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }
    return res.status(401).json({ success: false, message: 'Error al verificar el token', error: error.message });
  }
};

// CORRECCIÓN: Middleware opcional para rutas públicas que también admiten
// usuarios autenticados (ej: /api/agent/chat en modo invitado).
// Si hay token válido lo decodifica en req.usuario; si no, deja pasar igual.
export const optionalToken = (req, res, next) => {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token && req.cookies && req.cookies.alex_token) {
      token = req.cookies.alex_token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.usuario = decoded;
        req.token = token;
      } catch {
        // Token inválido o expirado: se ignora, la petición continúa como invitado
        req.usuario = null;
      }
    } else {
      req.usuario = null;
    }

    next();
  } catch (error) {
    next();
  }
};

export const verifyRole = (rolesPermitidos = []) => {
  return (req, res, next) => {
    try {
      if (!req.usuario) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      }
      if (!rolesPermitidos.includes(req.usuario.roleId)) {
        return res.status(403).json({ success: false, message: 'No tienes permisos para acceder a este recurso' });
      }
      next();
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error al verificar permisos', error: error.message });
    }
  };
};

export default { verifyToken, optionalToken, verifyRole };
