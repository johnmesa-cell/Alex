import { Router } from 'express';
import { askFirstAidQuestion } from '../controllers/firstaid.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';

const router = Router();

// GET /api/primeros-auxilios?pregunta=...
router.get('/primeros-auxilios', verifyToken, askFirstAidQuestion);

export function setFirstAidRoutes(app) {
    app.use('/api', router);
}
