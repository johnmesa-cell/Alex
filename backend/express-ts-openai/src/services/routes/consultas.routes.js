import { Router } from 'express';
import { verifyToken } from '../../middlewares/auth.middleware.js';
import { 
    createConsulta, 
    getAllConsultas,
    getResumenConsultas,
    getConsultaById, 
    deleteConsulta 
} from '../controllers/consultas.controller.js';

const router = Router();

// POST /api/consultas
router.post('/', verifyToken, createConsulta);

// GET /api/consultas/resumen  ← DEBE ir ANTES de /:id
router.get('/resumen', verifyToken, getResumenConsultas);

// GET /api/consultas
router.get('/', verifyToken, getAllConsultas);

// GET /api/consultas/:id
router.get('/:id', verifyToken, getConsultaById);

// DELETE /api/consultas/:id
router.delete('/:id', verifyToken, deleteConsulta);

export function setConsultasRoutes(app) {
    app.use('/api/consultas', router);
}
