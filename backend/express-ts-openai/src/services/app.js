import express from "express";
import helmet from "helmet";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import path from 'path';
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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT} (Public Access)`);
    console.log("Allowed CORS origins:", allowedOrigins);
});
