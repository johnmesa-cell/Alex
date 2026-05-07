import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";
// Como 'routes' y 'controllers' están hermanas dentro de 'services':
// Subimos un nivel (..) para salir de 'routes' y entramos a 'controllers'
import * as aiController from "../controllers/ai.controller.js";
export const setAIRoutes = (app) => {
    const router = express.Router();

    router.post("/guidance", verifyToken, aiController.chatWithAI);

    app.use("/ai", router);
};
