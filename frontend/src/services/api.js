import axios from 'axios';

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    '/api',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('alex_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function getApiError(error) {
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Ocurrio un error inesperado';

  return message;
}

/**
 * Sube un archivo al backend para extraer su texto y obtener la respuesta de ALEX.
 * @param {File} file - Archivo a analizar (PDF, DOCX, TXT…)
 * @param {string} [prompt] - Pregunta opcional sobre el documento
 */
export async function uploadDocument(file, prompt = '') {
  const formData = new FormData();
  formData.append('file', file);
  if (prompt) formData.append('prompt', prompt);

  return api.post('/api/ai/document/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
}

export default api;
