import { ChromaClient } from "chromadb";
import { pipeline } from '@xenova/transformers';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

// --- CONFIGURACIÓN ---
const PDFS_PATH = "./data/pdfs";
const CHROMA_COLLECTION_NAME = "first_aid_docs";
const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";
const BATCH_SIZE = 50; // Número de documentos a procesar y subir a la vez

// Silenciar logs de transformers.js
import { env } from '@xenova/transformers';

// Let's just use the defaults and ensure remote models are allowed.
// The library should handle caching automatically.
env.allowRemoteModels = true;
env.allowLocalModels = true;

console.log('Configuración de transformers.js:', env);

/**
 * Función para obtener la lista de archivos PDF en un directorio.
 */
function getPdfFiles(directory) {
  const files = fs.readdirSync(directory);
  return files.filter(file => path.extname(file).toLowerCase() === '.pdf')
              .map(file => path.join(directory, file));
}

/**
 * Función principal para generar y guardar el almacén de vectores.
 */
async function generateAndSaveVectorStore() {
  try {
    console.log("Iniciando la generación del almacén de vectores directamente con Transformers.js...");

    // 1. Cargar y dividir los documentos
    if (!fs.existsSync(PDFS_PATH)) {
        throw new Error(`El directorio de PDFs no existe: ${PDFS_PATH}.`);
    }
    const pdfFiles = getPdfFiles(PDFS_PATH);
    if (pdfFiles.length === 0) {
        console.log("No se encontraron archivos PDF para procesar.");
        return;
    }
    console.log(`Se encontraron ${pdfFiles.length} archivos PDF.`);

    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    let allDocs = [];
    for (const filePath of pdfFiles) {
        console.log(`Cargando y dividiendo: ${path.basename(filePath)}`);
        const loader = new PDFLoader(filePath);
        const rawDocs = await loader.load();
        const splitDocs = await textSplitter.splitDocuments(rawDocs);
        allDocs.push(...splitDocs);
    }
    const nonEmptyDocs = allDocs.filter(doc => doc.pageContent.trim() !== "");
    console.log(`Total de fragmentos a procesar: ${nonEmptyDocs.length}`);

    // 2. Inicializar el pipeline de embeddings
    console.log("Cargando modelo de embeddings local. Esto puede tardar unos minutos la primera vez...");
    const extractor = await pipeline('feature-extraction', EMBEDDING_MODEL);
    console.log("Modelo de embeddings cargado.");

    // 3. Conectar con ChromaDB, borrar la colección si existe y crearla de nuevo
    const client = new ChromaClient({ path: "http://localhost:8000" });

    try {
        console.log(`Intentando borrar la colección '${CHROMA_COLLECTION_NAME}' si ya existe...`);
        await client.deleteCollection({ name: CHROMA_COLLECTION_NAME });
        console.log(`Colección '${CHROMA_COLLECTION_NAME}' borrada con éxito.`);
    } catch (error) {
        // Es normal que falle si la colección no existe, así que lo ignoramos.
        console.log(`La colección '${CHROMA_COLLECTION_NAME}' no existía, se creará una nueva.`);
    }

    const collection = await client.getOrCreateCollection({ name: CHROMA_COLLECTION_NAME });
    console.log(`Colección '${CHROMA_COLLECTION_NAME}' creada en ChromaDB.`);

    // 4. Generar embeddings y añadir a Chroma en lotes
    console.log("Iniciando la generación de embeddings y carga en ChromaDB por lotes...");
    for (let i = 0; i < nonEmptyDocs.length; i += BATCH_SIZE) {
        const batchDocs = nonEmptyDocs.slice(i, i + BATCH_SIZE);
        const batchContent = batchDocs.map(doc => doc.pageContent);

        // ChromaDB requires metadata values to be strings, numbers, or booleans.
        // The 'loc' object from PDFLoader is a complex object, which causes the error.
        // We will create a new metadata object with only the simple values we need.
        const metadatas = batchDocs.map(doc => ({
            source: doc.metadata.source,
            page: doc.metadata.loc?.pageNumber ?? 0,
        }));

        const embeddings = await extractor(batchContent, { pooling: 'mean', normalize: true });

        // Preparar datos para Chroma
        const ids = batchDocs.map((_, index) => `doc_${i + index}`);

        // Añadir a la colección
        await collection.add({
            ids: ids,
            embeddings: embeddings.tolist(),
            metadatas: metadatas, // Use the sanitized metadatas
            documents: batchContent,
        });
    }

    console.log("\n¡ÉXITO! El almacén de vectores ha sido generado y guardado en ChromaDB.");

  } catch (error) {
    console.error("\nOcurrió un error crítico durante el proceso:", error);
    if (error.message && error.message.includes('ECONNREFUSED')) {
        console.error("Error de conexión: No se pudo conectar a ChromaDB. Asegúrate de que el contenedor Docker esté corriendo.");
    }
  }
}

// Ejecutar la función principal
generateAndSaveVectorStore();
