/**
 * @fileoverview Definición de rutas de autenticación.
 *
 * Registra los endpoints de autenticación bajo el prefijo `/auth`
 * en la instancia principal de Express. Todos los endpoints de este
 * módulo son de acceso público (no requieren JWT).
 *
 * Rutas disponibles:
 *  - POST /auth/register  → Registro de nuevo usuario.
 *  - POST /auth/login     → Inicio de sesión y obtención de token JWT.
 */

import express from "express";
import authController from "../controllers/auth.controller.js";

/**
 * Registra las rutas de autenticación en la aplicación Express.
 *
 * @param {import('express').Application} app - Instancia de la aplicación Express.
 * @returns {void}
 */
export const setAuthRoutes = (app) => {
    const router = express.Router();

    /**
     * @route   POST /auth/register
     * @desc    Registra un nuevo usuario en el sistema.
     * @access  Público
     */
    router.post("/register", authController.register);

    /**
     * @route   POST /auth/login
     * @desc    Autentica al usuario y devuelve un JWT válido por 24 horas.
     * @access  Público
     */
    router.post("/login", authController.login);

    app.use("/auth", router);
};
