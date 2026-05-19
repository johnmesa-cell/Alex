import { Router } from 'express';
import { requireAdmin } from '../../middlewares/admin.middleware.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';

const router = Router();
const AGENT_URL = process.env.AGENT_URL ?? 'http://alex_agent:3500';

// ── Panel admin: proxy completo hacia /admin/* del agente ──────────────
router.all('/admin*', requireAdmin, async (req, res) => {
  try {
    const agentPath = req.path;
    const fetchOptions = {
      method: req.method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(`${AGENT_URL}${agentPath}`, fetchOptions);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('Error proxy admin→agente:', err.message);
    return res.status(502).json({ success: false, message: 'Agente ALEX no disponible' });
  }
});

// ── Chat: disponible para cualquier usuario autenticado ────────────────
router.post('/chat', verifyToken, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message || !sessionId) {
      return res.status(400).json({ success: false, message: 'message y sessionId son requeridos' });
    }

    const response = await fetch(`${AGENT_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        userName: req.usuario?.nombre ?? 'usuario',
        message
      })
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('Error proxy chat→agente:', err.message);
    return res.status(502).json({ success: false, message: 'Agente ALEX no disponible' });
  }
});

// ── Upload: documentos del usuario hacia el agente ─────────────────────
router.post('/upload', verifyToken, async (req, res) => {
  try {
    const response = await fetch(`${AGENT_URL}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('Error proxy upload→agente:', err.message);
    return res.status(502).json({ success: false, message: 'Agente ALEX no disponible' });
  }
});

export const setAgentRoutes = (app) => {
  app.use('/api/agent', router);
};
