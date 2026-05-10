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
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const result = await model.generateContent(`${SYSTEM_INSTRUCTION}\n\nPregunta del usuario: ${userMessage}`);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("--- ERROR EN GEMINI ---");
        console.error("Mensaje:", error.message);
        throw new Error(`Google dice: ${error.message}`);
    }
};

export const getGeminiResponseWithContext = async (question, context) => {
    try {
        const genAI = getGeminiClient();
        const GEMINI_MODEL_NAME = "gemini-2.0-flash";
const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME }); // Usamos un modelo más potente para RAG

        const prompt = `
${SYSTEM_INSTRUCTION}

--- INICIO DEL CONTEXTO DE REFERENCIA ---
${context}
--- FIN DEL CONTEXTO DE REFERENCIA ---

Basándote ESTRICTA Y ÚNICAMENTE en el contexto de referencia anterior, responde la siguiente pregunta. Si la respuesta no se encuentra en el contexto, indica que no tienes información al respecto en tus documentos.

Pregunta del usuario: ${question}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("--- ERROR EN GEMINI CON CONTEXTO ---");
        console.error("Mensaje:", error.message);
        throw new Error(`Google dice: ${error.message}`);
    }
};