import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma.client.js";

class AuthController {
    constructor() {
        this.register = this.register.bind(this);
        this.login = this.login.bind(this);
    }

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
