import express from "express";
import authController from "../controllers/auth.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

export const setAuthRoutes = (app) => {
  const router = express.Router();

  router.post("/register", authController.register);
  router.post("/login",    authController.login);
  router.post("/logout",   authController.logout);

  // GET /api/auth/token — devuelve el JWT de la cookie httpOnly para que
  // AdminPanel pueda inyectarlo como query-param en el iframe del agente.
  // Solo accesible si ya hay una sesión válida (verifyToken lo garantiza).
  // El token no se almacena en JS: se usa directamente como URL y expira en 24h.
  router.get("/token", verifyToken, (req, res) => {
    const token = req.cookies?.alex_token ?? null;
    if (!token) {
      return res.status(401).json({ success: false, message: 'No hay sesión activa.' });
    }
    return res.status(200).json({ success: true, token });
  });

  app.use("/api/auth", router);
};
