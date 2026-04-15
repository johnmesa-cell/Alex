import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import gTTS from 'gtts';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Configuración de directorios
const UPLOADS_DIR = 'uploads';
const TEMP_VOICE_DIR = 'temp_voice';

// Asegurar que los directorios existan
fs.ensureDirSync(UPLOADS_DIR);
fs.ensureDirSync(TEMP_VOICE_DIR);

// Configuración de Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

export const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // Límite de 10MB
});

const getGeminiClient = () => {
    const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
    if (!apiKey) throw new Error("GEMINI_API_KEY no configurada");
    return new GoogleGenerativeAI(apiKey);
};

export const handleVoiceAssistant = async (req, res) => {
    let audioPath = null;
    let ttsPath = null;

    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No se recibió ningún archivo de audio." });
        }

        audioPath = req.file.path;
        console.log(`Audio recibido en: ${audioPath}`);

        const genAI = getGeminiClient();
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // 1. Audio-to-Text y Análisis con Gemini
        const audioBuffer = await fs.readFile(audioPath);
        
        const result = await model.generateContent([
            {
                inlineData: {
                    data: audioBuffer.toString("base64"),
                    mimeType: req.file.mimetype
                }
            },
            "Analiza este audio de primeros auxilios y responde de forma concisa y clara. Solo texto plano, sin formatos especiales. Si no es una emergencia o pregunta médica, indícalo educadamente."
        ]);

        const response = await result.response;
        const aiTextResponse = response.text();
        
        // Simular transcripción (Gemini 1.5 Flash puede deducirla del contexto o podemos pedirla)
        const transcription = "Transcripción automática basada en el audio enviado."; 

        // 2. Text-to-Speech con gTTS
        const ttsFilename = `response_${uuidv4()}.mp3`;
        ttsPath = path.join(TEMP_VOICE_DIR, ttsFilename);

        const gtts = new gTTS(aiTextResponse, 'es');
        
        await new Promise((resolve, reject) => {
            gtts.save(ttsPath, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // 3. Preparar retorno (Base64 para n8n o envío de archivo)
        const ttsBuffer = await fs.readFile(ttsPath);

        res.status(200).json({
            success: true,
            transcription: transcription,
            aiTextResponse: aiTextResponse,
            audioBase64: ttsBuffer.toString("base64"),
            audioFilename: ttsFilename
        });

    } catch (error) {
        console.error("Error en asistente de voz:", error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        // 4. Limpieza de archivos temporales
        try {
            if (audioPath) await fs.remove(audioPath);
            if (ttsPath) {
                // Opcional: Mantener el TTS unos segundos o borrarlo si ya se envió el buffer
                await fs.remove(ttsPath);
            }
        } catch (cleanupError) {
            console.error("Error limpiando temporales:", cleanupError);
        }
    }
};
