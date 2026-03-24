import { GoogleGenerativeAI } from "@google/generative-ai";

function getGeminiClient() {
    // Soporta ambos nombres comunes de variable para evitar errores de entorno.
    const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY no esta configurada en el entorno del backend.");
    }

    return new GoogleGenerativeAI(apiKey);
}

const SYSTEM_INSTRUCTION = `Eres ALEX (Asistente Logístico de Emergencias y Auxilio), una IA médica de la UTP, Pereira. 
Instrucciones estrictas:
1. No uses asteriscos (**), hashtags (#) ni negritas. Solo texto plano.
2. Si hay una emergencia vital, inicia con: "Por favor, llama inmediatamente a la línea 123".
3. Usa números (1. 2. 3.) para listas y deja espacios entre párrafos.
4. Termina siempre con: "Nota: Esta es una orientación preliminar de IA y no sustituye la valoración de un profesional médico."`;

export const getGeminiGuidance = async (userMessage) => {
    try {
        const genAI = getGeminiClient();
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent(`${SYSTEM_INSTRUCTION}\n\nPregunta del usuario: ${userMessage}`);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("--- ERROR EN GEMINI ---");
        console.error("Mensaje:", error.message);
        throw new Error(`Google dice: ${error.message}`);
    }
};

/**
 * Analyzes a document (text or image) with an optional user question.
 * @param {Object} fileContent - { type: 'text', content: string } | { type: 'image', mimeType, base64 }
 * @param {string} userQuestion - Optional question about the document.
 */
export const getGeminiDocumentAnalysis = async (fileContent, userQuestion) => {
    try {
        const genAI = getGeminiClient();
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const question = userQuestion?.trim() || "Analiza este documento y proporciona un resumen de su contenido.";

        let parts;

        if (fileContent.type === 'image') {
            parts = [
                { text: `${SYSTEM_INSTRUCTION}\n\nPregunta del usuario sobre el documento: ${question}` },
                { inlineData: { mimeType: fileContent.mimeType, data: fileContent.base64 } },
            ];
        } else {
            const docContext = `Contenido del documento:\n---\n${fileContent.content}\n---\n\nPregunta del usuario: ${question}`;
            parts = [{ text: `${SYSTEM_INSTRUCTION}\n\n${docContext}` }];
        }

        const result = await model.generateContent({ contents: [{ role: "user", parts }] });
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("--- ERROR EN GEMINI (documento) ---");
        console.error("Mensaje:", error.message);
        throw new Error(`Google dice: ${error.message}`);
    }
};