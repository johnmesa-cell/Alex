// RUTA CORREGIDA: Apuntando al cliente generado manualmente
import { PrismaClient } from '../../prisma/generated/client/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Configuración
const JWT_SECRET = process.env.JWT_SECRET || 'alex_super_secret_key_2026';
const JWT_EXPIRY = '24h';
const SALT_ROUNDS = 10;

/**
 * @route POST /api/auth/register
 * @description Registra un nuevo usuario en el sistema
 */
export const register = async (req, res) => {
  try {
    const { nombre, correo, password, idrol } = req.body;

    if (!nombre || !correo || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, correo y contraseña son requeridos',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({
        success: false,
        message: 'El formato del correo es inválido',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres',
      });
    }

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { correo },
    });

    if (usuarioExistente) {
      return res.status(409).json({
        success: false,
        message: 'El correo ya está registrado',
      });
    }

    const passwordhash = await bcrypt.hash(password, SALT_ROUNDS);

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre,
        correo,
        passwordhash,
        idrol: idrol || 2,
        estado: 'activo',
      },
      select: {
        idusuario: true,
        nombre: true,
        correo: true,
        idrol: true,
        fecharegistro: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: nuevoUsuario,
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
    });
  }
};

/**
 * @route POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({
        success: false,
        message: 'Correo y contraseña son requeridos',
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { correo },
      include: {
        rol: true,
      },
    });

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Correo o contraseña incorrectos',
      });
    }

    if (usuario.estado !== 'activo') {
      return res.status(403).json({
        success: false,
        message: 'Usuario inactivo o bloqueado',
      });
    }

    const contraseniaValida = await bcrypt.compare(password, usuario.passwordhash);

    if (!contraseniaValida) {
      return res.status(401).json({
        success: false,
        message: 'Correo o contraseña incorrectos',
      });
    }

    const token = jwt.sign(
      {
        idusuario: usuario.idusuario,
        correo: usuario.correo,
        nombre: usuario.nombre,
        idrol: usuario.idrol,
        nombrerol: usuario.rol.nombrerol,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    await prisma.sesion.create({
      data: {
        idusuario: usuario.idusuario,
        token,
        fechainicio: new Date(),
        ultimaactividad: new Date(),
        fechaexpiracion: new Date(Date.now() + 24 * 60 * 60 * 1000),
        ip: req.ip || 'desconocida',
        useragent: req.get('user-agent') || 'desconocida',
      },
    });

    await prisma.usuario.update({
      where: { idusuario: usuario.idusuario },
      data: { ultimologin: new Date() },
    });

    return res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: {
        idusuario: usuario.idusuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
        nombrerol: usuario.rol.nombrerol,
        token,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
    });
  }
};

/**
 * @route POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    const idusuario = req.usuario.idusuario;
    const token = req.token;

    await prisma.sesion.updateMany({
      where: {
        idusuario,
        token,
      },
      data: {
        fechaexpiracion: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Logout exitoso',
    });
  } catch (error) {
    console.error('Error en logout:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
    });
  }
};

