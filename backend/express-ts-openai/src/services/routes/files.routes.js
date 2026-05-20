import { Router } from 'express';
import { uploadConfig, handleFileUpload } from '../controllers/files.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';

const router = Router();

// CORRECCIÓN: El campo del formulario cambió de 'file' a 'archivo' para
// coincidir con lo que envía el frontend en Chat.jsx:
//   formData.append('archivo', selectedFile)
// Con 'file', Multer recibía req.file === undefined y el upload fallaba.
router.post('/upload', verifyToken, uploadConfig.single('archivo'), handleFileUpload);

export function setFileRoutes(app) {
  app.use('/api/files', router);
}
