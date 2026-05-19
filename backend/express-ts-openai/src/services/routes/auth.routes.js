import express from "express";
import authController from "../controllers/auth.controller.js";

export const setAuthRoutes = (app) => {
    const router = express.Router();
    router.post("/register", authController.register);
    router.post("/login", authController.login);
    router.post("/logout", authController.logout);

    // Expone el token actual para uso interno del frontend (ej: iframe del panel agente)
    router.get("/token", (req, res) => {
        const token = req.cookies?.alex_token;
        if (!token) {
            return res.status(401).json({ success: false, message: "No hay sesión activa" });
        }
        return res.json({ success: true, token });
    });

    app.use("/auth", router);
};
