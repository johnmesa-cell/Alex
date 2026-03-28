import { extractTextFromFile } from "../document.service.js";
import { getGeminiGuidance } from "../gemini.service.js";

const MAX_CONTEXT_CHARS = 12000;

/**
 * POST /api/ai/document
 * Acepta un archivo multipart (campo "file") y una pregunta opcional (campo "prompt").
 * Extrae el texto del documento y lo envía a Gemini como contexto.
 */
export const analyzeDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res
                .status(400)
                .json({ success: false, message: "No se recibió ningún archivo." });
        }

        const { buffer, mimetype, originalname } = req.file;

        let documentText;
        try {
            documentText = await extractTextFromFile(buffer, mimetype, originalname);
        } catch (parseError) {
            return res
                .status(422)
                .json({ success: false, message: parseError.message });
        }

        if (!documentText) {
            return res.status(422).json({
                success: false,
                message: "El documento no contiene texto extraible.",
            });
        }

        // Truncar si el documento es muy largo para no exceder los límites del modelo
        const context =
            documentText.length > MAX_CONTEXT_CHARS
                ? documentText.slice(0, MAX_CONTEXT_CHARS) + "\n[Documento truncado por longitud]"
                : documentText;

        const userQuestion = (req.body?.prompt || "").trim();
        const fullPrompt = userQuestion
            ? `Documento adjunto:\n${context}\n\nPregunta del usuario: ${userQuestion}`
            : `Documento adjunto:\n${context}\n\nResume el contenido del documento de forma clara y concisa.`;

        const respuesta = await getGeminiGuidance(fullPrompt);

        return res.status(200).json({
            success: true,
            data: {
                respuesta,
                documentName: originalname,
                extractedChars: documentText.length,
            },
        });
    } catch (error) {
        console.error("Error en Document Controller:", error.message);
        return res
            .status(500)
            .json({ success: false, message: error.message });
    }
};
