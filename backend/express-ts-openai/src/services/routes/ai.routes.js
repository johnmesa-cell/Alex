import express from "express";
import aiController from "../controllers/ai.controller.js";

export const setAIRoutes = (app) => {
    const router = express.Router();

    router.post("/guidance", aiController.getMedicalGuidance);

    app.use("/api/ai", router);
};
