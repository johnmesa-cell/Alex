import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import { setAIRoutes } from "./routes/ai.routes.js";
import { setAuthRoutes } from "./routes/auth.routes.js";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Habilitar CORS para permitir peticiones desde el Frontend (localhost:5173)
app.use(cors());
app.use(bodyParser.json());

// Verificar conexión a Base de Datos al iniciar
prisma.$connect()
    .then(() => console.log('✅ Conexión exitosa a la Base de Datos (PostgreSQL)'))
    .catch((error) => console.error('❌ Error conectando a la Base de Datos:', error));

app.get("/", (req, res) => {
    res.status(200).json({
        message: "ALEX API is running",
        status: "ok",
        version: "1.0.0",
        db_status: "connected" // Asumimos conectado si el servidor arranca, pero el log lo confirmará
    });
});

setAIRoutes(app);
setAuthRoutes(app);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
