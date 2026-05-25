import express from "express";
import helmet from "helmet";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import path from 'path';
import http from 'http';
import { WebSocketServer } from 'ws';
import WebSocket from 'ws';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { setAuthRoutes }     from "./routes/auth.routes.js";
import { setFirstAidRoutes } from "./routes/firstaid.routes.js";
import { setVoiceRoutes }    from "./routes/voice.routes.js";
import { setFileRoutes }     from "./routes/files.routes.js";
import { setConsultasRoutes } from "./routes/consultas.routes.js";
import { setMetricsRoutes }  from "./routes/metrics.routes.js";
import { setAgentRoutes }    from "./routes/agent.routes.js";
import { setAdminRoutes }    from "./routes/admin.routes.js";
import { setUsersRoutes }    from "./routes/users.routes.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.set('etag', false);
const PORT = process.env.PORT || 3000;

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: { maxAge: 31536000, includeSubDomains: true },
    frameguard: { action: "deny" }
}));

app.use('/uploads',    express.static(path.join(__dirname, '../../../uploads')));
app.use('/temp_voice', express.static(path.join(__dirname, '../../../temp_voice')));

const allowedOrigins = [
    process.env.FRONTEND_ORIGIN,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost",
    "http://127.0.0.1"
].filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                console.log("Bloqueado por CORS:", origin);
                callback(new Error("No permitido por CORS"));
            }
        },
        credentials: true
    })
);

app.use(bodyParser.json());
app.use(cookieParser());

app.get("/", (req, res) => {
    res.status(200).json({
        message: "ALEX API is running",
        status: "ok",
        version: "1.0.0"
    });
});

setAuthRoutes(app);
setFirstAidRoutes(app);
setVoiceRoutes(app);
setFileRoutes(app);
setConsultasRoutes(app);
setMetricsRoutes(app);
setAgentRoutes(app);
setAdminRoutes(app);
setUsersRoutes(app);

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
    const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;

    if (pathname === '/admin/live') {
      // Leer JWT desde cookie alex_token
      const cookieHeader = req.headers.cookie || '';
      const tokenMatch = cookieHeader.match(/alex_token=([^;]+)/);
      const token = tokenMatch ? tokenMatch[1] : null;

      if (!token) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      let decoded;
      try {
        decoded = jwt.verify(token, config.jwtSecret);
      } catch {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      // CORRECCIÓN: el JWT incluye idRol y roleId como número (2 = admin),
      // no un campo "role" con string. Se alinea con auth.controller.js y admin.middleware.js.
      const rolId = Number(decoded.idRol ?? decoded.roleId ?? decoded.id_rol ?? 0);
      if (!decoded || rolId !== 2) {
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (browserWs) => {
    console.log('🔁 Proxy WebSocket /admin/live → agente abierto');

    const agentWsUrl = (process.env.AGENT_URL_WS || 'ws://alex_agent:3500') + '/admin/live';

    const agentWs = new WebSocket(agentWsUrl, {
      headers: {
        'x-from-backend': 'true'
      }
    });

    browserWs.on('message', (data) => {
      if (agentWs.readyState === WebSocket.OPEN) {
        agentWs.send(data);
      }
    });

    agentWs.on('message', (data) => {
      if (browserWs.readyState === WebSocket.OPEN) {
        browserWs.send(data);
      }
    });

    agentWs.on('error', (err) => {
      console.error('❌ Error WebSocket agente:', err.message);
      if (browserWs.readyState === WebSocket.OPEN) {
        browserWs.close(1011, 'Error conectando con agente');
      }
    });

    agentWs.on('open', () => {
      console.log('✅ Proxy conectado al agente WebSocket');
    });

    browserWs.on('close', () => {
      agentWs.close();
      console.log('🔇 Browser cerró la sesión de voz');
    });

    agentWs.on('close', () => {
      if (browserWs.readyState === WebSocket.OPEN) {
        browserWs.close();
      }
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT} (Public Access)`);
    console.log('🎙️ WebSocket proxy /admin/live activo');
    console.log("Allowed CORS origins:", allowedOrigins);
  });
