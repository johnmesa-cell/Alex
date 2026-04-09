import { Router } from 'express';
import { upload, handleVoiceAssistant } from '../controllers/voice.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';

const router = Router();

// Endpoint para el asistente de voz: Recibe un archivo de audio (clave 'audio')
router.post('/asistente-voz', verifyToken, upload.single('audio'), handleVoiceAssistant);

export function setVoiceRoutes(app) {
    app.use('/api', router);
}
