import express from 'express';
import { requireAdmin } from '../../../middlewares/admin.middleware.js';
import {
  getDashboard,
  getUsuarios,
  updateUsuario,
  getSesionesActivas,
  cerrarSesion,
  getAuditoria,
  getConsultas
} from '../controllers/admin.controller.js';

const router = express.Router();

router.use(requireAdmin);

router.get('/dashboard',         getDashboard);
router.get('/usuarios',          getUsuarios);
router.patch('/usuarios/:id',    updateUsuario);
router.get('/sesiones',          getSesionesActivas);
router.delete('/sesiones/:id',   cerrarSesion);
router.get('/auditoria',         getAuditoria);
router.get('/consultas',         getConsultas);

export function setAdminRoutes(app) {
  app.use('/api/admin', router);
}
