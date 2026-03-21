/**
 * @fileoverview Punto de entrada principal del servidor Express.
 *
 * Responsabilidades:
 *  - Inicializar la aplicación Express.
 *  - Configurar los middlewares globales (CORS, body-parser).
 *  - Registrar las rutas de autenticación y de IA.
 *  - Exponer un endpoint de salud (GET /).
 *  - Iniciar el servidor HTTP en todas las interfaces de red (0.0.0.0).
 *
 * Variables de entorno:
 *  - PORT          Puerto de escucha (por defecto 3000).
 *  - CORS_ORIGINS  Lista de orígenes permitidos separados por coma.
 *                  Si no se define, se usan los orígenes por defecto de localhost.
 */

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import { setAIRoutes } from "./routes/ai.routes.js";
import { setAuthRoutes } from "./routes/auth.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Orígenes CORS permitidos cuando la variable CORS_ORIGINS no está definida.
 * Incluye las URLs habituales del entorno de desarrollo local.
 *
 * @type {string[]}
 */
const defaultOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost",
    "http://127.0.0.1"
];

/**
 * Lista efectiva de orígenes CORS.
 * Se lee de CORS_ORIGINS (CSV) o se usa defaultOrigins como fallback.
 *
 * @type {string[]}
 */
const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
    : defaultOrigins;

// ─── Middlewares globales ──────────────────────────────────────────────────────

/**
 * Middleware CORS: permite peticiones desde los orígenes definidos en
 * allowedOrigins, así como peticiones sin origen (Postman, cURL, etc.).
 * Las peticiones de orígenes desconocidos son rechazadas con un error CORS.
 */
app.use(
    cors({
        origin: function (origin, callback) {
            // Permitir peticiones sin origen (como Postman) o si está en la lista
            if (!origin || allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                console.log("Bloqueado por CORS:", origin);
                callback(new Error("No permitido por CORS"));
            }
        },
        credentials: true
    })
);

/** Middleware para parsear el body de las peticiones como JSON. */
app.use(bodyParser.json());

// ─── Rutas ────────────────────────────────────────────────────────────────────

/**
 * @route   GET /
 * @desc    Endpoint de salud. Confirma que la API está en línea.
 * @access  Público
 * @returns {object} 200 - { message: "ALEX API is running", status: "ok" }
 */
app.get("/", (req, res) => {
    res.status(200).json({
        message: "ALEX API is running",
        status: "ok",
    });
});

// Registrar rutas de IA  → /api/ai/*
setAIRoutes(app);

// Registrar rutas de autenticación → /auth/*
setAuthRoutes(app);

// ─── Inicio del servidor ──────────────────────────────────────────────────────

// CAMBIO CRÍTICO: Escuchar en '0.0.0.0' para aceptar conexiones externas
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT} (Public Access)`);
    console.log("Allowed CORS origins:", allowedOrigins);
});
