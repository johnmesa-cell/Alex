import express from "express";
import multer from "multer";
// Como 'routes' y 'controllers' están hermanas dentro de 'services':
// Subimos un nivel (..) para salir de 'routes' y entramos a 'controllers'
import * as aiController from "../controllers/ai.controller.js";

const ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Se aceptan: PDF, TXT, CSV, JPEG, PNG, GIF, WEBP`));
        }
    },
});

export const setAIRoutes = (app) => {
    const router = express.Router();

    router.post("/guidance", aiController.chatWithAI);
    router.post("/document", upload.single("file"), aiController.analyzeDocument);

    app.use("/api/ai", router);
};
