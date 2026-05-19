import { ChromaClient } from "chromadb";
import { pipeline } from '@xenova/transformers';
import { getGeminiResponseWithContext } from "../gemini.service.js";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- CONFIGURACIÓN ---
const CHROMA_COLLECTION_NAME = "first_aid_docs";
const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";

// --- INICIALIZACIÓN (SINGLETON) ---
let extractor;
async function getExtractor() {
    if (!extractor) {
        console.log("Cargando modelo de embeddings para el controlador...");
        extractor = await pipeline('feature-extraction', EMBEDDING_MODEL);
        console.log("Modelo de embeddings cargado.");
    }
    return extractor;
}
getExtractor();

const chromaClient = new ChromaClient({ path: "http://localhost:8000" });

// --- DICCIONARIO DE SEGURIDAD ---
const FORBIDDEN_KEYWORDS = [
    'suicidio', 'suicidarme', 'matarme', 'autolesión', 'cortarme', 'hacerme daño',
    'asesinar', 'matar a alguien', 'herir a alguien', 'violencia', 'abuso', 'maltrato',
    'bomba', 'explosivo', 'terrorismo',
    'drogas ilegales', 'sobredosis', 'veneno',
    'pornografía', 'abuso sexual',
];

function isQuestionInappropriate(question) {
    const normalizedQuestion = question.toLowerCase().trim();
    return FORBIDDEN_KEYWORDS.some(keyword => normalizedQuestion.includes(keyword));
}

// Genera un asunto corto a partir de la pregunta (máx 200 chars)
function buildAsunto(pregunta) {
    const trimmed = pregunta.trim();
    return trimmed.length <= 200 ? trimmed : trimmed.slice(0, 197) + '...';
}

// --- LÓGICA DEL CONTROLADOR ---
export const askFirstAidQuestion = async (req, res) => {
    const { pregunta } = req.query;

    if (!pregunta || typeof pregunta !== 'string') {
        return res.status(400).json({ message: "El parámetro 'pregunta' es requerido y debe ser texto." });
    }

    if (isQuestionInappropriate(pregunta)) {
        console.warn(`Pregunta bloqueada por filtro de seguridad: "${pregunta}"`);
        return res.status(403).json({
            message: "Tu pregunta no puede ser procesada por motivos de seguridad. Si estás en una situación de emergencia o necesitas ayuda, por favor, contacta a las autoridades locales o a una línea de ayuda especializada."
        });
    }

    try {
        console.log(`Recibida pregunta: "${pregunta}"`);

        // 1. Obtener el extractor de embeddings
        const model = await getExtractor();

        // 2. Crear embedding para la pregunta del usuario
        console.log("Generando embedding para la pregunta...");
        const questionEmbedding = await model(pregunta, { pooling: 'mean', normalize: true });

        // 3. Consultar ChromaDB para obtener contexto relevante
        console.log("Buscando contexto en ChromaDB...");
        const collection = await chromaClient.getCollection({ 
            name: CHROMA_COLLECTION_NAME,
        });
        const results = await collection.query({
            queryEmbeddings: questionEmbedding.tolist(),
            nResults: 5
        });

        // 4. Construir el contexto para Gemini
        const context = results.documents[0].join("\n\n---\n\n");
        console.log("Contexto encontrado:", context.substring(0, 200) + "...");

        // 5. Llamar a Gemini con el contexto y la pregunta
        console.log("Enviando pregunta y contexto a Gemini...");
        const answer = await getGeminiResponseWithContext(pregunta, context);

        // 6. Persistir en PostgreSQL si el usuario está autenticado
        //    req.usuario viene del middleware verifyToken (ruta protegida)
        if (req.usuario?.id_usuario) {
            try {
                await prisma.consulta.create({
                    data: {
                        id_usuario:   req.usuario.id_usuario,
                        asunto:       buildAsunto(pregunta),
                        mensaje:      pregunta,
                        respuesta_ia: answer,
                        estado:       'cerrada',
                    }
                });
                console.log(`Consulta guardada en BD para usuario ${req.usuario.id_usuario}`);
            } catch (dbErr) {
                // No bloqueamos la respuesta al usuario si falla el guardado
                console.error('Error al persistir consulta en BD:', dbErr);
            }
        }

        // 7. Devolver la respuesta
        res.status(200).json({
            pregunta: pregunta,
            respuesta_ia: answer
        });

    } catch (error) {
        console.error("Error en el controlador de primeros auxilios:", error);
        res.status(500).json({ message: "Error interno del servidor al procesar la pregunta." });
    }
};
