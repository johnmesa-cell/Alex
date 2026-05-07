// Subimos un nivel para salir de controllers y entrar a services
import { getGeminiGuidance } from '../gemini.service.js';

// Constantes de validación
const MIN_PROMPT_LENGTH = 1;
const MAX_PROMPT_LENGTH = 5000;

export const chatWithAI = async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({
                success: false,
                message: 'El campo "prompt" es requerido',
                data: null
            });
        }

        // Validar que sea string
        if (typeof prompt !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'El campo "prompt" debe ser un texto',
                data: null
            });
        }

        // Validar longitud mínima
        if (prompt.trim().length < MIN_PROMPT_LENGTH) {
            return res.status(400).json({
                success: false,
                message: `El prompt no puede estar vacío (mínimo ${MIN_PROMPT_LENGTH} carácter)`,
                data: null
            });
        }

        // Validar longitud máxima
        if (prompt.length > MAX_PROMPT_LENGTH) {
            return res.status(400).json({
                success: false,
                message: `El prompt no puede exceder ${MAX_PROMPT_LENGTH} caracteres (actual: ${prompt.length})`,
                data: null
            });
        }

        // Llamamos a la función de Gemini
        const respuesta = await getGeminiGuidance(prompt);

        return res.status(200).json({
            success: true,
            message: 'Consulta procesada correctamente',
            data: { respuesta }
        });
    } catch (error) {
        console.error("Error en AI Controller:", error.message);
        return res.status(500).json({
            success: false,
            message: 'Error al procesar la consulta',
            data: null,
            details: error.message
        });
    }
};
