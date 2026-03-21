// Subimos un nivel para salir de controllers y entrar a services
import { getGeminiGuidance, getGeminiDocumentAnalysis } from '../gemini.service.js';
import { extractFileContent } from '../document.service.js';

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

export const analyzeDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No se recibió ningún archivo' });
        }

        const { prompt } = req.body;
        const { buffer, mimetype, originalname } = req.file;

        const fileContent = await extractFileContent(buffer, mimetype, originalname);
        const respuesta = await getGeminiDocumentAnalysis(fileContent, prompt);

        return res.status(200).json({
            success: true,
            data: { respuesta },
        });
    } catch (error) {
        console.error("Error en Document Controller:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
