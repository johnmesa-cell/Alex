import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs-extra';

const UPLOADS_DIR = 'uploads';
fs.ensureDirSync(UPLOADS_DIR);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    // Seguridad: Tipos MIME permitidos
    const allowedMimeTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'text/csv'
    ];

    // Seguridad: Extensiones permitidas
    const allowedExtensions = /pdf|jpg|jpeg|png|csv/;
    const extensionHint = path.extname(file.originalname).toLowerCase().replace('.', '');
    
    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.test(extensionHint)) {
        cb(null, true);
    } else {
        cb(new Error('Formato no permitido. Solo se aceptan PDF, JPG, PNG y CSV.'), false);
    }
};

export const uploadConfig = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Límite 10MB
    fileFilter
});

export const handleFileUpload = (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No se ha subido ningún archivo.' });
        }

        // Generar URL para el frontend (usando variable de entorno o localhost por defecto)
        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

        res.status(201).json({
            success: true,
            message: 'Archivo subido correctamente',
            data: {
                originalName: req.file.originalname,
                filename: req.file.filename,
                mimetype: req.file.mimetype,
                size: req.file.size,
                url: fileUrl
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
