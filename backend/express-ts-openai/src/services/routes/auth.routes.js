import express from "express";
import authController from "../controllers/auth.controller.js";

export const setAuthRoutes = (app) => {
    const router = express.Router();

    router.post("/register", authController.register);
    router.post("/login", authController.login);

    app.use("/auth", router);
};
