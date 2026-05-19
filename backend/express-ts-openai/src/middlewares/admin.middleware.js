import jwt from 'jsonwebtoken';
import { prisma } from '../services/prisma.client.js';
import config from '../config/index.js';

export const requireAdmin = async (req, res, next) => {
  try {
    let token = req.cookies?.alex_token;
    if (!token) {
      const auth = req.headers.authorization;
      if (auth?.startsWith('Bearer ')) token = auth.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }

    const payload = jwt.verify(token, config.jwtSecret);

    // Verificar sesión vigente en BD
    const sesion = await prisma.sesion.findFirst({
      where: {
        token,
        id_usuario: payload.sub,
        fecha_expiracion: { gt: new Date() }
      }
    });

    if (!sesion) {
      return res.status(401).json({ success: false, message: 'Sesión expirada o inválida' });
    }

    // Verificar que el usuario tiene rol admin
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: payload.sub },
      include: { roles: true }
    });

    if (!usuario || usuario.estado !== 'activo') {
      return res.status(403).json({ success: false, message: 'Usuario inactivo o no encontrado' });
    }

    if (usuario.roles.nombre_rol !== 'admin') {
      return res.status(403).json({ success: false, message: 'Se requiere rol de administrador' });
    }

    req.adminUser = {
      id: usuario.id_usuario,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.roles.nombre_rol
    };
    req.token = token;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expirado' });
    }
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
};
