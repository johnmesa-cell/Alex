import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import { setAIRoutes } from "./routes/ai.routes.js";
import { setAuthRoutes } from "./routes/auth.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const defaultOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost",
    "http://127.0.0.1"
];

const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
    : defaultOrigins;

app.use(
    cors({
        origin: function (origin, callback) {
            // Permitir peticiones sin origen (como Postman) o si está en la lista
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

app.get("/", (req, res) => {
    res.status(200).json({
        message: "ALEX API is running",
        status: "ok",
    });
});

setAIRoutes(app);
setAuthRoutes(app);

// CAMBIO CRÍTICO: Escuchar en '0.0.0.0' para aceptar conexiones externas
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT} (Public Access)`);
    console.log("Allowed CORS origins:", allowedOrigins);
});
