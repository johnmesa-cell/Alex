import { Router } from 'express';
import { getMetricsSummary } from '../controllers/metrics.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';

const router = Router();

// ALEX-53: Obtener resumen estadístico
router.get('/resumen', verifyToken, getMetricsSummary);

export function setMetricsRoutes(app) {
    app.use('/api/metricas', router);
}
