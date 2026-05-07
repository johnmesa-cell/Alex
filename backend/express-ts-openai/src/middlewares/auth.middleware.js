import jwt from 'jsonwebtoken';
import config from '../config/index.js';

/**
 * @middleware verifyToken
 * @description Verifica que el JWT sea válido y extrae la información del usuario
 * Busca el token en:
 * 1. Header: Authorization: Bearer <token>
 * 2. Cookie: alex_token (httpOnly)
 */
export const verifyToken = (req, res, next) => {
  try {
    let token = null;

    // Intentar obtener token del header Authorization
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // Si no hay en header, intentar obtener de cookies (para httpOnly)
    if (!token && req.cookies && req.cookies.alex_token) {
      token = req.cookies.alex_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado o formato inválido',
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Almacenar la información del usuario en la solicitud
    req.usuario = decoded;
    req.token = token;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'El token ha expirado',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Error al verificar el token',
      error: error.message,
    });
  }
};

/**
 * @middleware verifyRole
 * @description Verifica que el usuario tenga un rol específico
 * @param {Array<number>} rolesPermitidos - Array de IDs de roles permitidos (ej: [1, 2])
 */
export const verifyRole = (rolesPermitidos = []) => {
  return (req, res, next) => {
    try {
      // Asegurarse que exista información del usuario
      if (!req.usuario) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
      }

      // Verificar si el rol del usuario está en los permitidos
      if (!rolesPermitidos.includes(req.usuario.roleId)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para acceder a este recurso',
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al verificar permisos',
        error: error.message,
      });
    }
  };
};

export default {
  verifyToken,
  verifyRole,
};
