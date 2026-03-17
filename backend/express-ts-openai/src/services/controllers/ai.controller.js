import { OpenAIService } from "../openai.service.js";
class AIController {
    constructor() {
        this.openAIService = new OpenAIService();
        this.getMedicalGuidance = this.getMedicalGuidance.bind(this);
    }

    async getMedicalGuidance(req, res) {
        try {
            const userMessage = req.body?.message;

            if (!userMessage || typeof userMessage !== 'string') {
                return res.status(400).json({ error: 'El campo "message" es requerido y debe ser texto.' });
            }

            const systemPrompt = 'Eres ALEX, un asistente médico experto en el sistema de salud de Colombia. Responde de forma ética y clara.';
            const guidance = await this.openAIService.getMedicalGuidance(userMessage, systemPrompt);
            res.status(200).json({ guidance });
        } catch (error) {
            console.error('Error en el controlador:', error);
            res.status(500).json({ error: 'Ocurrió un error al obtener la orientación médica.', details: error?.message || 'Error desconocido' });
        }
    }
}

export default new AIController();