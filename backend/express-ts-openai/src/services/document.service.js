import pdfParse from 'pdf-parse/lib/pdf-parse.js';

const TEXT_MIME_TYPES = new Set([
    'text/plain',
    'text/csv',
    'text/html',
    'text/xml',
    'application/json',
]);

const IMAGE_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
]);

/**
 * Extracts content from an uploaded file buffer.
 * Returns { type: 'text', content: string } or { type: 'image', mimeType, base64 }.
 */
export async function extractFileContent(buffer, mimeType, originalName) {
    const lowerName = (originalName || '').toLowerCase();

    if (mimeType === 'application/pdf' || lowerName.endsWith('.pdf')) {
        const data = await pdfParse(buffer);
        return { type: 'text', content: data.text };
    }

    if (IMAGE_MIME_TYPES.has(mimeType)) {
        return { type: 'image', mimeType, base64: buffer.toString('base64') };
    }

    if (TEXT_MIME_TYPES.has(mimeType) || lowerName.endsWith('.txt') || lowerName.endsWith('.csv')) {
        return { type: 'text', content: buffer.toString('utf-8') };
    }

    throw new Error(`Tipo de archivo no soportado: ${mimeType || lowerName}`);
}
