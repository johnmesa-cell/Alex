import express from "express";
import multer from "multer";
import { analyzeDocument } from "../controllers/document.controller.js";

// Almacenamiento en memoria (no se escribe en disco)
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB máximo
    },
    fileFilter: (_req, file, cb) => {
        const allowed = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
            "text/plain",
            "text/markdown",
        ];
        const ext = (file.originalname || "").toLowerCase().split(".").pop();
        const allowedExt = ["pdf", "docx", "doc", "txt", "md"];

        if (allowed.includes(file.mimetype) || allowedExt.includes(ext)) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    "Formato no soportado. Sube un archivo PDF, DOCX, DOC, TXT o MD."
                )
            );
        }
    },
});

export const setDocumentRoutes = (app) => {
    const router = express.Router();

    router.post(
        "/analyze",
        (req, res, next) => {
            upload.single("file")(req, res, (err) => {
                if (err) {
                    return res
                        .status(400)
                        .json({ success: false, message: err.message });
                }
                next();
            });
        },
        analyzeDocument
    );

    app.use("/api/ai/document", router);
};
