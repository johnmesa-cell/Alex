import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

export class OpenAIService {
    constructor() {
        this.openai = null;
    }

    async getMedicalGuidance(userMessage, systemPrompt = '') {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY no está configurada.");
        }

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