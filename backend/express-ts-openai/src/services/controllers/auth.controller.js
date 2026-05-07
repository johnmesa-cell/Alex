import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma.client.js";
import config from "../../config/index.js";

/**
 * Valida que un email tenga un formato válido
 * @param {string} email - Email a validar
 * @returns {object} - { isValid: boolean, error: string|null }
 */
function validateEmail(email) {
    // Expresión regular para validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email || typeof email !== 'string') {
        return { isValid: false, error: 'El email debe ser un texto válido' };
    }

    const trimmedEmail = email.trim();
    
    if (trimmedEmail.length < 5) {
        return { isValid: false, error: 'El email es demasiado corto' };
    }

    if (trimmedEmail.length > 254) {
        return { isValid: false, error: 'El email es demasiado largo' };
    }

    if (!emailRegex.test(trimmedEmail)) {
        return { isValid: false, error: 'El formato del email no es válido' };
    }

    return { isValid: true, error: null };
}

/**
 * Valida que un nombre sea válido
 * @param {string} nombre - Nombre a validar
 * @returns {object} - { isValid: boolean, error: string|null }
 */
function validateNombre(nombre) {
    if (!nombre || typeof nombre !== 'string') {
        return { isValid: false, error: 'El nombre debe ser un texto válido' };
    }

    const trimmedNombre = nombre.trim();

    if (trimmedNombre.length < 2) {
        return { isValid: false, error: 'El nombre debe tener al menos 2 caracteres' };
    }

    if (trimmedNombre.length > 100) {
        return { isValid: false, error: 'El nombre no puede exceder 100 caracteres' };
    }

    // Validar que solo contenga letras, espacios y caracteres especiales comunes
    const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/;
    if (!nombreRegex.test(trimmedNombre)) {
        return { isValid: false, error: 'El nombre contiene caracteres no permitidos' };
    }

    return { isValid: true, error: null };
}

/**
 * Valida que una contraseña cumpla con los requisitos de seguridad
 * @param {string} password - Contraseña a validar
 * @returns {object} - { isValid: boolean, error: string|null }
 */
function validatePassword(password) {
    if (!password || typeof password !== 'string') {
        return { isValid: false, error: 'La contraseña debe ser una cadena de texto' };
    }

    if (password.length < 8) {
        return { isValid: false, error: 'La contraseña debe tener al menos 8 caracteres' };
    }

    if (password.length > 128) {
        return { isValid: false, error: 'La contraseña no puede exceder 128 caracteres' };
    }

    // Validar que contenga al menos una mayúscula, una minúscula y un número
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
        return { 
            isValid: false, 
            error: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número' 
        };
    }

    return { isValid: true, error: null };
}

/**
 * Normaliza los datos del usuario para una respuesta consistente
 * @param {object} user - Objeto usuario de Prisma
 * @returns {object} - Usuario con nombres de campos normalizados
 */
function normalizeUserResponse(user) {
    return {
        id: user.id_usuario,
        nombre: user.nombre,
        correo: user.correo,
        idRol: user.id_rol,
        fechaRegistro: user.fecha_registro
    };
}

class AuthController {
    async register(req, res) {
        try {
            // Aceptar tanto 'email' como 'correo' para mayor flexibilidad
            const { nombre, email, correo, password } = req.body ?? {};
            const emailField = email || correo;

            if (!nombre || !emailField || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Los campos "nombre", "email" y "password" son requeridos.',
                    data: null
                });
            }

            // Validar nombre
            const nombreValidation = validateNombre(nombre);
            if (!nombreValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: nombreValidation.error,
                    data: null
                });
            }

            // Validar email
            const emailValidation = validateEmail(emailField);
            if (!emailValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: emailValidation.error,
                    data: null
                });
            }

            // Validar contraseña
            const passwordValidation = validatePassword(password);
            if (!passwordValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: passwordValidation.error,
                    data: null
                });
            }

            const normalizedEmail = String(emailField).trim().toLowerCase();

            const existingUser = await prisma.usuario.findUnique({
                where: { correo: normalizedEmail }
            });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "El correo ya se encuentra registrado.",
                    data: null
                });
            }

            const defaultRole = await prisma.rol.findFirst({
                where: { nombre_rol: "usuario" }
            });

            if (!defaultRole) {
                return res.status(500).json({
                    success: false,
                    message: "No existe un rol por defecto ('usuario'). Configura la tabla de roles.",
                    data: null
                });
            }

            const passwordhash = await bcrypt.hash(String(password), 10);

            const user = await prisma.usuario.create({
                data: {
                    id_rol: defaultRole.id_rol,
                    nombre: String(nombre).trim(),
                    correo: normalizedEmail,
                    password_hash: passwordhash
                },
                select: {
                    id_usuario: true,
                    nombre: true,
                    correo: true,
                    id_rol: true,
                    fecha_registro: true
                }
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
            // Aceptar tanto 'email' como 'correo' para mayor flexibilidad
            const { email, correo, password } = req.body ?? {};
            const emailField = email || correo;

            if (!emailField || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Los campos "email" y "password" son requeridos.',
                    data: null
                });
            }

            // Validar email
            const emailValidation = validateEmail(emailField);
            if (!emailValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: emailValidation.error,
                    data: null
                });
            }

            const normalizedEmail = String(emailField).trim().toLowerCase();

            const user = await prisma.usuario.findUnique({
                where: { correo: normalizedEmail }
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Credenciales inválidas.",
                    data: null
                });
            }
            
            const isPasswordValid = await bcrypt.compare(String(password), user.password_hash);

            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: "Credenciales inválidas.",
                    data: null
                });
            }

            const expiresIn = "24h";
            const token = jwt.sign(
                {
                    sub: user.id_usuario,
                    email: user.correo,
                    roleId: user.id_rol
                },
                config.jwtSecret,
                { expiresIn }
            );

            const now = new Date();
            const fechaexpiracion = new Date(now.getTime() + 24 * 60 * 60 * 1000);

            // Limpiar sesiones antiguas del usuario antes de crear una nueva
            await prisma.sesion.deleteMany({
                where: { id_usuario: user.id_usuario }
            });

            await prisma.sesion.create({
                data: {
                    id_usuario: user.id_usuario,
                    token,
                    fecha_inicio: now,
                    ultima_actividad: now,
                    fecha_expiracion: fechaexpiracion,
                    ip: req.ip,
                    user_agent: req.get("user-agent")
                }
            });

            await prisma.usuario.update({
                where: { id_usuario: user.id_usuario },
                data: { ultimo_login: now }
            });

            // Retornar token en httpOnly cookie (no accesible desde JavaScript)
            res.cookie('alex_token', token, {
                httpOnly: true,        // No accesible desde JavaScript
                secure: process.env.NODE_ENV === 'production',  // Solo HTTPS en producción
                sameSite: 'strict',    // Protección CSRF
                maxAge: 24 * 60 * 60 * 1000  // 24 horas
            });

            // Retornar información del usuario (sin token)
            return res.status(200).json({
                success: true,
                message: "Inicio de sesión exitoso.",
                data: {
                    user: normalizeUserResponse(user)
                }
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
            // Buscar token en cookie (igual que como lo envía el login)
            const token = req.cookies?.alex_token;

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: "No hay sesión activa",
                    data: null
                });
            }

            // Eliminar la sesión de la base de datos
            await prisma.sesion.deleteMany({
                where: { token }
            });

            // Limpiar la cookie httpOnly
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
                message: "Ocurrió un error al cerrar sesión.",
                data: null,
                details: error.message || error
            });
        }
    }
}

export default new AuthController();
