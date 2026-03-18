import { GoogleGenerativeAI } from "@google/generative-ai";

// Limpiamos la llave por si acaso
const apiKey = (process.env.GEMINI_API_KEY || "").trim();
const genAI = new GoogleGenerativeAI(apiKey);

export const getGeminiGuidance = async (userMessage) => {
    try {
        // CAMBIO CLAVE: Usamos el modelo que tu comando curl confirmó
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