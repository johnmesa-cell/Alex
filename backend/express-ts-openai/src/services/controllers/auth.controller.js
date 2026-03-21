/**
 * @fileoverview Controlador de autenticación de usuarios.
 *
 * Contiene la lógica de negocio para registrar e iniciar sesión de usuarios.
 * Utiliza Prisma ORM para las consultas a la base de datos PostgreSQL,
 * bcryptjs para el hashing de contraseñas y jsonwebtoken para la
 * generación de tokens JWT.
 *
 * Flujo de registro:
 *  1. Validar campos obligatorios (nombre, email, password).
 *  2. Normalizar y verificar que el correo no esté en uso.
 *  3. Crear (o recuperar) el rol por defecto "usuario".
 *  4. Hashear la contraseña con bcrypt (10 rondas de sal).
 *  5. Persistir el nuevo usuario en la base de datos.
 *  6. Retornar los datos del usuario creado (sin el hash de contraseña).
 *
 * Flujo de login:
 *  1. Validar campos obligatorios (email, password).
 *  2. Buscar el usuario por correo normalizado.
 *  3. Comparar la contraseña enviada con el hash almacenado.
 *  4. Generar un JWT con expiración de 24 horas.
 *  5. Registrar la sesión y actualizar ultimo_login.
 *  6. Retornar el token y los datos básicos del usuario.
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma.client.js";

/**
 * Controlador de autenticación.
 * Se exporta como instancia única (singleton) para que los bindings
 * de `this` en los métodos funcionen correctamente al pasarlos como callbacks.
 */
class AuthController {
    constructor() {
        this.register = this.register.bind(this);
        this.login = this.login.bind(this);
    }

    /**
     * Registra un nuevo usuario en el sistema.
     *
     * @route   POST /auth/register
     * @access  Público
     *
     * @param {import('express').Request}  req  - Petición HTTP.
     *   @param {object} req.body
     *   @param {string} req.body.nombre    Nombre completo del usuario.
     *   @param {string} req.body.email     Correo electrónico único.
     *   @param {string} req.body.password  Contraseña en texto plano (mín. 6 caracteres).
     * @param {import('express').Response} res  - Respuesta HTTP.
     *
     * @returns {Promise<void>}
     *
     * Respuestas posibles:
     *  - 201 Created  → Usuario registrado correctamente.
     *  - 400 Bad Request → Faltan campos obligatorios.
     *  - 409 Conflict    → El correo ya está registrado.
     *  - 500 Internal Server Error → Error inesperado.
     */
    async register(req, res) {
        try {
            const { nombre, email, password } = req.body ?? {};

            if (!nombre || !email || !password) {
                return res.status(400).json({
                    error: 'Los campos "nombre", "email" y "password" son requeridos.'
                });
            }

            const normalizedEmail = String(email).trim().toLowerCase();

            const existingUser = await prisma.usuario.findUnique({
                where: { correo: normalizedEmail }
            });

            if (existingUser) {
                return res.status(409).json({
                    error: "El correo ya se encuentra registrado."
                });
            }

            // Obtener o crear el rol por defecto "usuario"
            const defaultRole = await prisma.rol.upsert({
                where: { nombre_rol: "usuario" },
                update: {},
                create: {
                    nombre_rol: "usuario",
                    descripcion: "Rol por defecto para nuevos registros"
                }
            });

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
                message: "Usuario registrado correctamente.",
                user
            });
        } catch (error) {
            console.error("Error en register:", error);
            return res.status(500).json({
                error: "Ocurrió un error al registrar el usuario.",
                details: error.message || error
            });
        }
    }

    /**
     * Autentica a un usuario existente y devuelve un token JWT.
     *
     * @route   POST /auth/login
     * @access  Público
     *
     * @param {import('express').Request}  req  - Petición HTTP.
     *   @param {object} req.body
     *   @param {string} req.body.email     Correo electrónico del usuario.
     *   @param {string} req.body.password  Contraseña en texto plano.
     * @param {import('express').Response} res  - Respuesta HTTP.
     *
     * @returns {Promise<void>}
     *
     * Respuestas posibles:
     *  - 200 OK           → Inicio de sesión exitoso, retorna token y datos del usuario.
     *  - 400 Bad Request  → Faltan campos obligatorios.
     *  - 401 Unauthorized → Credenciales inválidas.
     *  - 500 Internal Server Error → JWT_SECRET no configurado u otro error.
     *
     * El token JWT incluye: `sub` (id_usuario), `email`, `roleId`.
     * Expiración: 24 horas.
     */
    async login(req, res) {
        try {
            const { email, password } = req.body ?? {};

            if (!email || !password) {
                return res.status(400).json({
                    error: 'Los campos "email" y "password" son requeridos.'
                });
            }

            const normalizedEmail = String(email).trim().toLowerCase();

            const user = await prisma.usuario.findUnique({
                where: { correo: normalizedEmail }
            });

            if (!user) {
                return res.status(401).json({
                    error: "Credenciales inválidas."
                });
            }
            
            const isPasswordValid = await bcrypt.compare(String(password), user.password_hash);

            if (!isPasswordValid) {
                return res.status(401).json({
                    error: "Credenciales inválidas."
                });
            }

            const jwtSecret = process.env.JWT_SECRET;

            if (!jwtSecret) {
                return res.status(500).json({
                    error: "JWT_SECRET no está configurado en variables de entorno."
                });
            }

            const expiresIn = "24h";
            const token = jwt.sign(
                {
                    sub: user.id_usuario,
                    email: user.correo,
                    roleId: user.id_rol
                },
                jwtSecret,
                { expiresIn }
            );

            const now = new Date();
            const fechaexpiracion = new Date(now.getTime() + 24 * 60 * 60 * 1000);

            // Registrar la nueva sesión
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

            // Actualizar la fecha del último login
            await prisma.usuario.update({
                where: { id_usuario: user.id_usuario },
                data: { ultimo_login: now }
            });

            return res.status(200).json({
                message: "Inicio de sesión exitoso.",
                token,
                user: {
                    idusuario: user.id_usuario,
                    nombre: user.nombre,
                    correo: user.correo,
                    idrol: user.id_rol
                }
            });
        } catch (error) {
            console.error("Error en login:", error);
            return res.status(500).json({
                error: "Ocurrió un error al iniciar sesión.",
                details: error.message || error
            });
        }
    }
}

export default new AuthController();
