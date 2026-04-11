import { Router } from 'express';
import { uploadConfig, handleFileUpload } from '../controllers/files.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';

const router = Router();

// Endpoint para subir archivos genéricos
// El token es opcional, si ya lo tienes implementado es mejor dejarlo protegido
router.post('/upload', verifyToken, uploadConfig.single('file'), handleFileUpload);

export function setFileRoutes(app) {
    app.use('/api/files', router);
}
