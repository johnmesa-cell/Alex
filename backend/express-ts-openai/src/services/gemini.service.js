import { GoogleGenerativeAI } from "@google/generative-ai";

function getGeminiClient() {
    // Soporta ambos nombres comunes de variable para evitar errores de entorno.
    const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY no esta configurada en el entorno del backend.");
    }

    return new GoogleGenerativeAI(apiKey);
}

export const getGeminiGuidance = async (userMessage) => {
    try {
        const genAI = getGeminiClient();
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent(userMessage);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("--- ERROR EN GEMINI ---");
        console.error("Mensaje:", error.message);
        throw new Error(`Google dice: ${error.message}`);
    }
};