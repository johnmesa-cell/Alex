/**
 * @fileoverview Middlewares de autenticación y autorización basados en JWT.
 *
 * Exporta dos middlewares de Express:
 *  - {@link verifyToken}  → verifica la validez del token JWT enviado en el header.
 *  - {@link verifyRole}   → verifica que el usuario autenticado posea uno de los roles
 *                           permitidos para la ruta.
 *
 * Flujo típico de uso en una ruta protegida:
 * ```js
 * router.get('/admin', verifyToken, verifyRole(['admin']), handler);
 * ```
 *
 * Variable de entorno:
 *  - JWT_SECRET  Clave secreta para firmar/verificar tokens JWT.
 *               Si no se define se usa la clave por defecto (solo para desarrollo).
 */

import jwt from 'jsonwebtoken';

// Configuración
const JWT_SECRET = process.env.JWT_SECRET || 'alex_super_secret_key_2026';

/**
 * Middleware que verifica la autenticidad del JWT enviado en el header
 * `Authorization: Bearer <token>`.
 *
 * Si el token es válido, añade el payload decodificado a `req.usuario`
 * y el token raw a `req.token`, luego llama a `next()`.
 *
 * En caso de fallo retorna una respuesta JSON con el código HTTP correspondiente:
 *  - 401 si el token no se proporcionó, expiró o es inválido.
 *
 * @type {import('express').RequestHandler}
 *
 * @example
 * // Ruta protegida
 * router.get('/perfil', verifyToken, (req, res) => {
 *   res.json({ usuario: req.usuario });
 * });
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
 * Middleware factory que genera un middleware de autorización por rol.
 *
 * Debe usarse **después** de {@link verifyToken}, ya que depende de que
 * `req.usuario` esté poblado con el payload del JWT.
 *
 * @param {string[]} [rolesPermitidos=[]] Array de nombres de rol que pueden
 *   acceder al recurso (ej. `['admin', 'moderador']`).
 * @returns {import('express').RequestHandler} Middleware de Express que verifica
 *   si el rol del usuario está en la lista permitida.
 *
 * @example
 * // Solo administradores pueden acceder
 * router.delete('/usuario/:id', verifyToken, verifyRole(['admin']), handler);
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
