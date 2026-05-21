import axios from 'axios';

// CORRECCIÓN: baseURL debe ser '/api' para que el proxy de Vite intercepte
// las peticiones y las redirija al backend correctamente.
// En producción, configurar VITE_API_URL con la URL completa del backend (incluyendo /api).
// Ejemplo: VITE_API_URL=https://api.megiddo20.me/api
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
  // SEGURIDAD: withCredentials envia cookies httpOnly al backend.
  // El token JWT debe vivir en una cookie httpOnly (no en localStorage).
  withCredentials: true,
});

let onTokenExpired = null;

export function setTokenExpiredCallback(callback) {
  onTokenExpired = callback;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // El token JWT se gestiona SÓLO mediante cookies httpOnly
      // configuradas en el backend con Set-Cookie (Secure, HttpOnly, SameSite).
      // localStorage es vulnerable a ataques XSS.
      if (onTokenExpired) onTokenExpired();
    }
    return Promise.reject(error);
  }
);

export function getApiError(error) {
  // Distinguir errores de red vs errores HTTP
  if (!error.response && error.request) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión o que el backend esté activo.';
  }
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Ocurrió un error inesperado.';
  return message;
}

export default api;
