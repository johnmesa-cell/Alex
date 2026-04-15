import express from "express";
import { register, login } from '../controllers/auth.handler.js';

export const setAuthRoutes = (app) => {
    const router = express.Router();

    router.post("/register", register);
    router.post("/login", login);

    app.use("/auth", router);
};
