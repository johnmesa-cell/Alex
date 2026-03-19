import jwt from 'jsonwebtoken';

// Configuración
const JWT_SECRET = process.env.JWT_SECRET || 'alex_super_secret_key_2026';

/**
 * @middleware verifyToken
 * @description Verifica que el JWT sea válido y extrae la información del usuario
 * Espera un token en el header: Authorization: Bearer <token>
 */
export const verifyToken = (req, res, next) => {
  try {
    // Obtener el token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado o formato inválido',
      });
    }

    // Extraer el token
    const token = authHeader.split(' ')[1];

    // Verificar el token
    const decoded = jwt.verify(token, JWT_SECRET);

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
 * @param {Array<string>} rolesPermitidos - Array de roles permitidos (ej: ['admin', 'moderador'])
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
      if (!rolesPermitidos.includes(req.usuario.nombrerol)) {
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
