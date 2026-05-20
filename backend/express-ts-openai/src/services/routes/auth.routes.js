import express from "express";
import authController from "../controllers/auth.controller.js";

export const setAuthRoutes = (app) => {
  const router = express.Router();

  router.post("/register", authController.register);
  router.post("/login", authController.login);
  router.post("/logout", authController.logout);

  // CORRECCIÓN: Se eliminó GET /token que exponía el JWT en el body de la
  // respuesta (texto plano accesible por JS), anulando la protección de
  // la cookie httpOnly. Si se necesita comunicación iframe ↔ backend,
  // usar un endpoint server-to-server con validación de origen.

  // CORRECCIÓN: prefijo cambiado de "/auth" a "/api/auth" para que el
  // frontend pueda alcanzarlo a través del proxy de Vite (/api → backend).
  app.use("/api/auth", router);
};
