/**
 * @fileoverview Servicio de IA médica usando Google Gemini.
 *
 * Integra la API de Google Generative AI para proporcionar orientación
 * médica preliminar a través del asistente ALEX.
 *
 * Características del servicio:
 *  - Usa el modelo `gemini-2.5-flash` para respuestas rápidas.
 *  - Aplica una instrucción de sistema estricta que define el comportamiento
 *    y el formato de las respuestas (texto plano, sin markdown).
 *  - Detecta emergencias vitales y dirige al número de emergencias 123.
 *  - Agrega automáticamente un aviso de limitación médica al final de
 *    cada respuesta.
 *
 * Variables de entorno requeridas:
 *  - GEMINI_API_KEY  o  GOOGLE_API_KEY  Clave de API de Google Generative AI.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Crea y devuelve un cliente de Google Generative AI.
 * Lee la clave de API de las variables de entorno GEMINI_API_KEY o GOOGLE_API_KEY.
 *
 * @returns {GoogleGenerativeAI} Cliente configurado.
 * @throws {Error} Si ninguna de las variables de entorno con la clave está definida.
 */
function getGeminiClient() {
    // Soporta ambos nombres comunes de variable para evitar errores de entorno.
    const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY no esta configurada en el entorno del backend.");
    }

    return new GoogleGenerativeAI(apiKey);
}

/**
 * Instrucción de sistema que define la identidad, el tono y el formato
 * de las respuestas del asistente ALEX.
 *
 * Reglas principales:
 *  1. Sin markdown (sin **, #, negritas).
 *  2. En emergencias vitales, iniciar con la instrucción de llamar al 123.
 *  3. Usar listas numeradas y párrafos separados.
 *  4. Terminar siempre con la nota de limitación médica.
 *
 * @type {string}
 */
const SYSTEM_INSTRUCTION = `Eres ALEX (Asistente Logístico de Emergencias y Auxilio), una IA médica de la UTP, Pereira. 
Instrucciones estrictas:
1. No uses asteriscos (**), hashtags (#) ni negritas. Solo texto plano.
2. Si hay una emergencia vital, inicia con: "Por favor, llama inmediatamente a la línea 123".
3. Usa números (1. 2. 3.) para listas y deja espacios entre párrafos.
4. Termina siempre con: "Nota: Esta es una orientación preliminar de IA y no sustituye la valoración de un profesional médico."`;

/**
 * Obtiene orientación médica del modelo Gemini a partir del mensaje del usuario.
 *
 * @param {string} userMessage - Pregunta o descripción de síntomas del usuario.
 * @returns {Promise<string>} Texto con la respuesta médica generada por ALEX.
 * @throws {Error} Si la API de Gemini falla o la clave no está configurada.
 *
 * @example
 * const respuesta = await getGeminiGuidance("Me duele la cabeza y tengo fiebre");
 * console.log(respuesta); // "1. Descansa en un lugar fresco... Nota: Esta es..."
 */
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