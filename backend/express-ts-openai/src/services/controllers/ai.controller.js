/**
 * @fileoverview Controlador de IA médica.
 *
 * Gestiona las peticiones hacia el servicio de Google Gemini para
 * proporcionar orientación médica preliminar a los usuarios.
 * Actúa como capa delgada entre las rutas HTTP y el servicio de IA,
 * ocupándose únicamente de la validación de la petición y del formateo
 * de la respuesta.
 */

// Subimos un nivel para salir de controllers y entrar a services
import { getGeminiGuidance } from '../gemini.service.js';

/**
 * Maneja una consulta médica enviada al modelo de IA (Gemini).
 *
 * @route   POST /api/ai/guidance
 * @access  Público
 *
 * @param {import('express').Request}  req - Petición HTTP.
 *   @param {object} req.body
 *   @param {string} req.body.prompt  Mensaje o pregunta del usuario.
 * @param {import('express').Response} res - Respuesta HTTP.
 *
 * @returns {Promise<void>}
 *
 * Respuestas posibles:
 *  - 200 OK           → `{ success: true, data: { respuesta: string } }`
 *  - 400 Bad Request  → El campo `prompt` es obligatorio.
 *  - 500 Internal Server Error → Error al comunicarse con la API de Gemini.
 */
export const chatWithAI = async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ success: false, message: 'El mensaje es requerido' });
        }

        // Llamamos a la función de Gemini
        const respuesta = await getGeminiGuidance(prompt);

        return res.status(200).json({
            success: true,
            data: { respuesta },
        });
    } catch (error) {
        console.error("Error en AI Controller:", error.message);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};
