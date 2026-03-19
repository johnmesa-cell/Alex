import express from 'express';
import { register, login, logout } from '../services/controllers/auth.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @description Registra un nuevo usuario
 * @body {string} nombre - Nombre del usuario
 * @body {string} correo - Correo único del usuario
 * @body {string} password - Contraseña (mín 6 caracteres)
 * @body {number} [idrol] - ID del rol (opcional, por defecto 2)
 * @returns {object} Usuario registrado con idusuario, nombre, correo, etc.
 */
router.post('/register', register);

/**
 * @route POST /api/auth/login
 * @description Autentica un usuario y retorna JWT
 * @body {string} correo - Correo del usuario
 * @body {string} password - Contraseña del usuario
 * @returns {object} Token JWT y datos del usuario
 */
router.post('/login', login);

/**
 * @route POST /api/auth/logout
 * @description Cierra la sesión del usuario
 * @access Private - Requiere token JWT válido
 * @header {string} Authorization - Bearer <token>
 * @returns {object} Mensaje de logout exitoso
 */
router.post('/logout', authMiddleware.verifyToken, logout);

export default router;
