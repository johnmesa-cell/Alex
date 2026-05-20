import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma.client.js";
import config from "../../config/index.js";

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string') return { isValid: false, error: 'El email debe ser un texto válido' };
    const trimmedEmail = email.trim();
    if (trimmedEmail.length < 5) return { isValid: false, error: 'El email es demasiado corto' };
    if (trimmedEmail.length > 254) return { isValid: false, error: 'El email es demasiado largo' };
    if (!emailRegex.test(trimmedEmail)) return { isValid: false, error: 'El formato del email no es válido' };
    return { isValid: true, error: null };
}

function validateNombre(nombre) {
    if (!nombre || typeof nombre !== 'string') return { isValid: false, error: 'El nombre debe ser un texto válido' };
    const trimmedNombre = nombre.trim();
    if (trimmedNombre.length < 2) return { isValid: false, error: 'El nombre debe tener al menos 2 caracteres' };
    if (trimmedNombre.length > 100) return { isValid: false, error: 'El nombre no puede exceder 100 caracteres' };
    const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/;
    if (!nombreRegex.test(trimmedNombre)) return { isValid: false, error: 'El nombre contiene caracteres no permitidos' };
    return { isValid: true, error: null };
}

function validatePassword(password) {
    if (!password || typeof password !== 'string') return { isValid: false, error: 'La contraseña debe ser una cadena de texto' };
    if (password.length < 8) return { isValid: false, error: 'La contraseña debe tener al menos 8 caracteres' };
    if (password.length > 128) return { isValid: false, error: 'La contraseña no puede exceder 128 caracteres' };
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
        return { isValid: false, error: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número' };
    }
    return { isValid: true, error: null };
}

// CORRECCIÓN: normalizeUserResponse ahora incluye id_usuario explícito y idRol
// para que AuthContext.jsx lo resuelva sin depender del fallback por payload.id,
// y para que admin.middleware.js encuentre idRol directamente en la respuesta.
function normalizeUserResponse(user) {
    return {
        id:            user.id_usuario,
        id_usuario:    user.id_usuario,
        nombre:        user.nombre,
        correo:        user.correo,
        idRol:         user.id_rol,
        rolNombre:     user.roles?.nombre_rol || null,
        fechaRegistro: user.fecha_registro
    };
}

class AuthController {
    async register(req, res) {
        try {
            const { nombre, email, correo, password } = req.body ?? {};
            const emailField = email || correo;

            const nombreValidation = validateNombre(nombre);
            if (!nombreValidation.isValid) {
                return res.status(400).json({ success: false, message: nombreValidation.error, data: null });
            }

            const emailValidation = validateEmail(emailField);
            if (!emailValidation.isValid) {
                return res.status(400).json({ success: false, message: emailValidation.error, data: null });
            }

            const passwordValidation = validatePassword(password);
            if (!passwordValidation.isValid) {
                return res.status(400).json({ success: false, message: passwordValidation.error, data: null });
            }

            const normalizedEmail = String(emailField).trim().toLowerCase();

            const existingUser = await prisma.usuario.findUnique({
                where: { correo: normalizedEmail },
            });

            if (existingUser) {
                return res.status(409).json({ success: false, message: "El correo ya se encuentra registrado.", data: null });
            }

            const defaultRole = await prisma.rol.findFirst({
                where: { nombre_rol: "usuario" }
            });

            if (!defaultRole) {
                return res.status(500).json({ success: false, message: "El rol 'usuario' no existe en la base de datos.", data: null });
            }

            const passwordhash = await bcrypt.hash(String(password), 10);

            const user = await prisma.usuario.create({
                data: {
                    id_rol: defaultRole.id_rol,
                    nombre: String(nombre).trim(),
                    correo: normalizedEmail,
                    password_hash: passwordhash
                },
                include: { roles: true }
            });

            return res.status(201).json({
                success: true,
                message: "Usuario registrado correctamente.",
                data: { user: normalizeUserResponse(user) }
            });
        } catch (error) {
            console.error("Error en register:", error);
            return res.status(500).json({
                success: false,
                message: "Ocurrió un error al registrar el usuario.",
                data: null,
                details: error.message || error
            });
        }
    }

    async login(req, res) {
        try {
            const { email, correo, password } = req.body ?? {};
            const emailField = email || correo;

            if (!emailField || !password) {
                return res.status(400).json({ success: false, message: 'Los campos "email" y "password" son requeridos.', data: null });
            }

            const emailValidation = validateEmail(emailField);
            if (!emailValidation.isValid) {
                return res.status(400).json({ success: false, message: emailValidation.error, data: null });
            }

            const normalizedEmail = String(emailField).trim().toLowerCase();

            const user = await prisma.usuario.findUnique({
                where: { correo: normalizedEmail },
                include: { roles: true }
            });

            if (!user) {
                return res.status(401).json({ success: false, message: "Credenciales inválidas.", data: null });
            }

            const isPasswordValid = await bcrypt.compare(String(password), user.password_hash);

            if (!isPasswordValid) {
                return res.status(401).json({ success: false, message: "Credenciales inválidas.", data: null });
            }

            await prisma.sesion.deleteMany({
                where: { id_usuario: user.id_usuario }
            });

            const expiresIn = "24h";

            // CORRECCIÓN: payload incluye idRol además de roleId para que
            // admin.middleware.js (que lee req.usuario.idRol) no reciba undefined.
            // Se mantiene roleId por compatibilidad con verifyRole.
            const token = jwt.sign(
                {
                    sub:        user.id_usuario,
                    id_usuario: user.id_usuario,
                    nombre:     user.nombre,
                    email:      user.correo,
                    roleId:     user.id_rol,
                    idRol:      user.id_rol
                },
                config.jwtSecret,
                { expiresIn }
            );

            const now = new Date();
            const fechaexpiracion = new Date(now.getTime() + 24 * 60 * 60 * 1000);

            await prisma.sesion.create({
                data: {
                    id_usuario:       user.id_usuario,
                    token,
                    fecha_inicio:     now,
                    ultima_actividad: now,
                    fecha_expiracion: fechaexpiracion,
                    ip:               req.ip,
                    user_agent:       req.get("user-agent")
                }
            });

            await prisma.usuario.update({
                where: { id_usuario: user.id_usuario },
                data: { ultimo_login: now }
            });

            res.cookie('alex_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000
            });

            return res.status(200).json({
                success: true,
                message: "Inicio de sesión exitoso.",
                data: { user: normalizeUserResponse(user) }
            });
        } catch (error) {
            console.error("Error en login:", error);
            return res.status(500).json({
                success: false,
                message: "Ocurrió un error al iniciar sesión.",
                data: null,
                details: error.message || error
            });
        }
    }

    async logout(req, res) {
        try {
            const token = req.cookies?.alex_token;
            if (!token) {
                return res.status(401).json({ success: false, message: "No hay sesión activa", data: null });
            }

            await prisma.sesion.deleteMany({
                where: { token }
            });

            res.clearCookie('alex_token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });

            return res.status(200).json({
                success: true,
                message: "Sesión cerrada correctamente.",
                data: null
            });
        } catch (error) {
            console.error("Error en logout:", error);
            return res.status(500).json({
                success: false,
                message: "Error al cerrar sesión.",
                data: null,
                details: error.message
            });
        }
    }
}

export default new AuthController();
