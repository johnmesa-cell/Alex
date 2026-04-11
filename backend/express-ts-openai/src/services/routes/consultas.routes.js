import { Router } from 'express';
import { verifyToken } from '../../middlewares/auth.middleware.js';
import { 
    createConsulta, 
    getAllConsultas, 
    getConsultaById, 
    deleteConsulta 
} from '../controllers/consultas.controller.js';

const router = Router();

// ALEX-46: Crear consulta
router.post('/', verifyToken, createConsulta);

// ALEX-47: Listar consultas del usuario logueado
router.get('/', verifyToken, getAllConsultas);

// ALEX-48: Obtener una consulta por ID
router.get('/:id', verifyToken, getConsultaById);

// ALEX-49: Eliminar consulta
router.delete('/:id', verifyToken, deleteConsulta);

export function setConsultasRoutes(app) {
    app.use('/api/consultas', router);
}
