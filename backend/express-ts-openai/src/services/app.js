import express from "express";
import bodyParser from "body-parser";
// Subimos un nivel para llegar a la carpeta 'routes' desde 'services'
import authRoutes from "../routes/auth.routes.js";
// Entramos en la carpeta 'routes' que está al mismo nivel que app.js
import { setAIRoutes } from "./routes/ai.routes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// IMPORTANTE: Aquí activamos las rutas de usuario
app.use("/api/auth", authRoutes);

// Aquí activamos las rutas de IA
setAIRoutes(app);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
