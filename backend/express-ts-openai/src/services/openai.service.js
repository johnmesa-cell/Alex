/**
 * @fileoverview Servicio de IA médica usando OpenAI (GPT-4o).
 *
 * Proporciona una clase de servicio alternativa para obtener orientación
 * médica mediante la API de OpenAI. El servicio principal de producción
 * utiliza Google Gemini ({@link module:gemini.service}); este módulo puede
 * usarse como fallback o para pruebas comparativas.
 *
 * Variable de entorno requerida:
 *  - OPENAI_API_KEY  Clave secreta de la API de OpenAI.
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Servicio que encapsula la interacción con la API de OpenAI (GPT-4o).
 * La instancia del cliente se crea de forma perezosa (lazy initialization)
 * la primera vez que se llama a {@link OpenAIService#getMedicalGuidance}.
 */
export class OpenAIService {
    constructor() {
        /** @type {OpenAI|null} Cliente de OpenAI (inicializado de forma perezosa). */
        this.openai = null;
    }

    /**
     * Envía un mensaje al modelo GPT-4o y retorna la respuesta médica generada.
     *
     * @param {string} userMessage  - Pregunta o descripción de síntomas del usuario.
     * @param {string} [systemPrompt=''] - Prompt de sistema personalizado. Si se omite,
     *   se usa el prompt por defecto que define a ALEX como asistente médico colombiano.
     * @returns {Promise<string>} Texto de la respuesta generada por el modelo.
     * @throws {Error} Si OPENAI_API_KEY no está configurada o la API falla.
     *
     * @example
     * const service = new OpenAIService();
     * const respuesta = await service.getMedicalGuidance("¿Qué hacer si tengo fiebre alta?");
     * console.log(respuesta);
     */
    async getMedicalGuidance(userMessage, systemPrompt = '') {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY no está configurada.");
        }

        // Inicialización perezosa del cliente de OpenAI
        if (!this.openai) {
            this.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
        }

        const prompt = systemPrompt || 'Eres ALEX, un asistente médico experto en el sistema de salud de Colombia. Responde de forma ética y clara.';
        
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: prompt },
                    { role: 'user', content: userMessage }
                ],
            });

            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No content received from OpenAI');
            }
            return content;
        } catch (error) {
            console.error('Error calling OpenAI:', error);
            throw error;
        }
    }
}