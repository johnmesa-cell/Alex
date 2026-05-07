import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import { setAIRoutes } from "./routes/ai.routes.js";
import { setAuthRoutes } from "./routes/auth.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
    process.env.FRONTEND_ORIGIN,
    "http://localhost:5173",
    "http://127.0.0.1:5173"
].filter(Boolean);

app.use(
    cors({
        origin(origin, callback) {
            // Permite llamadas sin origin (ej. Postman/PowerShell) y navegador desde orígenes permitidos.
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error(`CORS bloqueado para origin: ${origin}`));
        },
        credentials: true  // Permitir envío de cookies
    })
);

app.use(bodyParser.json());
app.use(cookieParser());

app.get("/", (req, res) => {
    res.status(200).json({
        message: "ALEX API is running",
        status: "ok",
        version: "1.0.0",
    });
});

setAIRoutes(app);
setAuthRoutes(app);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
