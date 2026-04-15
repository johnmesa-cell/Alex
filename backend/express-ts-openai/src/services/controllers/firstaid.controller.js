import { ChromaClient } from "chromadb";
import { pipeline } from '@xenova/transformers';
import { getGeminiResponseWithContext } from "../gemini.service.js";

// --- CONFIGURACIÓN ---
const CHROMA_COLLECTION_NAME = "first_aid_docs";
const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";

// --- INICIALIZACIÓN (SINGLETON) ---
// Usamos un patrón Singleton para cargar el modelo de embeddings una sola vez.
let extractor;
async function getExtractor() {
    if (!extractor) {
        console.log("Cargando modelo de embeddings para el controlador...");
        // Usamos un pipeline de 'feature-extraction' que es el adecuado para obtener embeddings.
        extractor = await pipeline('feature-extraction', EMBEDDING_MODEL);
        console.log("Modelo de embeddings cargado.");
    }
    return extractor;
}
// Iniciar la carga del modelo en cuanto arranca el servidor.
getExtractor();

const chromaClient = new ChromaClient({ path: "http://localhost:8000" });

// --- DICCIONARIO DE SEGURIDAD ---
// Lista de palabras clave que activarán el filtro de seguridad.
const FORBIDDEN_KEYWORDS = [
    'suicidio', 'suicidarme', 'matarme', 'autolesión', 'cortarme', 'hacerme daño',
    'asesinar', 'matar a alguien', 'herir a alguien', 'violencia', 'abuso', 'maltrato',
    'bomba', 'explosivo', 'terrorismo',
    'drogas ilegales', 'sobredosis', 'veneno',
    'pornografía', 'abuso sexual',
    // Añadir más palabras o frases según sea necesario
];

/**
 * Función para verificar si una pregunta contiene palabras prohibidas.
 * @param {string} question La pregunta del usuario.
 * @returns {boolean} True si la pregunta es inapropiada, false en caso contrario.
 */
function isQuestionInappropriate(question) {
    const normalizedQuestion = question.toLowerCase().trim();
    return FORBIDDEN_KEYWORDS.some(keyword => normalizedQuestion.includes(keyword));
}


// --- LÓGICA DEL CONTROLADOR ---
export const askFirstAidQuestion = async (req, res) => {
    const { pregunta } = req.query;

    if (!pregunta || typeof pregunta !== 'string') {
        return res.status(400).json({ message: "El parámetro 'pregunta' es requerido y debe ser texto." });
    }

    // <<< INICIO: FILTRO DE SEGURIDAD >>>
    if (isQuestionInappropriate(pregunta)) {
        console.warn(`Pregunta bloqueada por filtro de seguridad: "${pregunta}"`);
        return res.status(403).json({
            message: "Tu pregunta no puede ser procesada por motivos de seguridad. Si estás en una situación de emergencia o necesitas ayuda, por favor, contacta a las autoridades locales o a una línea de ayuda especializada."
        });
    }
    // <<< FIN: FILTRO DE SEGURIDAD >>>

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
            nResults: 5 // Pedimos los 5 fragmentos más relevantes
        });

        // 4. Construir el contexto para Gemini
        // Unimos los documentos encontrados en un solo bloque de texto.
        const context = results.documents[0].join("\n\n---\n\n");
        console.log("Contexto encontrado:", context.substring(0, 200) + "..."); // Log para depuración

        // 5. Llamar a Gemini con el contexto y la pregunta
        console.log("Enviando pregunta y contexto a Gemini...");
        const answer = await getGeminiResponseWithContext(pregunta, context);

        // 6. Devolver la respuesta
        res.status(200).json({
            pregunta: pregunta,
            respuesta_ia: answer
        });

    } catch (error) {
        console.error("Error en el controlador de primeros auxilios:", error);
        res.status(500).json({ message: "Error interno del servidor al procesar la pregunta." });
    }
};
