import { Router } from 'express';
import multer from 'multer';
import FormData from 'form-data';
import { requireAdmin } from '../../middlewares/admin.middleware.js';
import { verifyToken, optionalToken } from '../../middlewares/auth.middleware.js';
import { prisma } from '../prisma.client.js';

const router = Router();
const AGENT_URL = process.env.AGENT_URL ?? 'http://alex_agent:3500';
const upload = multer({ storage: multer.memoryStorage() });

function buildAsunto(mensaje) {
  const t = mensaje.trim();
  return t.length <= 200 ? t : t.slice(0, 197) + '...';
}

// ── Panel admin: proxy completo hacia /admin/* del agente ──────────────
router.all('/admin*', requireAdmin, async (req, res) => {
  try {
    const agentPath = req.path;
    const token = req.cookies?.alex_token ?? '';
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
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

// ── Chat: proxy + persistencia en BD si el usuario está autenticado ─────
// CORRECCIÓN: verifyToken reemplazado por optionalToken para permitir
// consultas en modo invitado (sin cuenta). Si hay sesión activa, se guarda
// la consulta en BD; si no, se responde igualmente sin persistir.
router.post('/chat', optionalToken, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message || !sessionId) {
      return res.status(400).json({ success: false, message: 'message y sessionId son requeridos' });
    }

    const agentRes = await fetch(`${AGENT_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        userName: req.usuario?.nombre ?? 'invitado',
        message
      })
    });

    if (!agentRes.ok) {
      const errData = await agentRes.json().catch(() => ({}));
      return res.status(agentRes.status).json(errData);
    }

    const data = await agentRes.json();
    const reply = data?.reply ?? '';

    // Guardar en BD solo si hay usuario autenticado
    if (req.usuario?.id_usuario) {
      try {
        await prisma.consulta.create({
          data: {
            id_usuario: req.usuario.id_usuario,
            asunto: buildAsunto(message),
            mensaje: message,
            respuesta_ia: reply,
            estado: 'cerrada',
            fechacreacion: new Date()
          }
        });
      } catch (dbErr) {
        console.error('Error al guardar consulta en BD:', dbErr);
      }
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Error proxy chat→agente:', err.message);
    return res.status(502).json({ success: false, message: 'Agente ALEX no disponible' });
  }
});

// ── Upload: documentos del usuario hacia el agente ─────────────────────
router.post('/upload', verifyToken, upload.single('archivo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se recibió archivo (campo: archivo)' });
    }

    const form = new FormData();
    form.append('archivo', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const response = await fetch(`${AGENT_URL}/upload`, {
      method: 'POST',
      headers: form.getHeaders(),
      body: form
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
