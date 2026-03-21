import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

/**
 * Extrae el texto de un archivo subido según su tipo MIME.
 * Soporta: PDF, DOCX, DOC y texto plano.
 *
 * @param {Buffer} buffer  - Contenido binario del archivo.
 * @param {string} mimetype - MIME type reportado por el cliente.
 * @param {string} originalname - Nombre original del archivo.
 * @returns {Promise<string>} Texto extraído.
 */
export const extractTextFromFile = async (buffer, mimetype, originalname) => {
    const ext = (originalname || "").toLowerCase().split(".").pop();

    // PDF
    if (mimetype === "application/pdf" || ext === "pdf") {
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        await parser.destroy();
        return result.text.trim();
    }

    // DOCX / DOC
    if (
        mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        mimetype === "application/msword" ||
        ext === "docx" ||
        ext === "doc"
    ) {
        const result = await mammoth.extractRawText({ buffer });
        return result.value.trim();
    }

    // Texto plano
    if (mimetype.startsWith("text/") || ext === "txt" || ext === "md") {
        return buffer.toString("utf-8").trim();
    }

    throw new Error(
        `Tipo de archivo no soportado: ${mimetype || ext}. Use PDF, DOCX, DOC o TXT.`
    );
};
