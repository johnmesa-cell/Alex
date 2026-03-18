import express from "express";
// Como 'routes' y 'controllers' están hermanas dentro de 'services':
// Subimos un nivel (..) para salir de 'routes' y entramos a 'controllers'
import * as aiController from "../controllers/ai.controller.js";
export const setAIRoutes = (app) => {
    const router = express.Router();

    router.post("/guidance", aiController.chatWithAI);

    app.use("/api/ai", router);
};
