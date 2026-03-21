/**
 * @fileoverview Definición de rutas de IA médica.
 *
 * Registra los endpoints del asistente ALEX bajo el prefijo `/api/ai`
 * en la instancia principal de Express.
 *
 * Rutas disponibles:
 *  - POST /api/ai/guidance  → Enviar una pregunta médica y obtener orientación de la IA.
 */

import express from "express";
// Como 'routes' y 'controllers' están hermanas dentro de 'services':
// Subimos un nivel (..) para salir de 'routes' y entramos a 'controllers'
import * as aiController from "../controllers/ai.controller.js";

/**
 * Registra las rutas de IA en la aplicación Express.
 *
 * @param {import('express').Application} app - Instancia de la aplicación Express.
 * @returns {void}
 */
export const setAIRoutes = (app) => {
    const router = express.Router();

    /**
     * @route   POST /api/ai/guidance
     * @desc    Recibe un mensaje del usuario y retorna orientación médica generada por IA.
     * @access  Público
     */
    router.post("/guidance", aiController.chatWithAI);

    app.use("/api/ai", router);
};
