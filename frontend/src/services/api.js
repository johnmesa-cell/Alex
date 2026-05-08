import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true  // Enviar cookies automáticamente en cada request
});

let onTokenExpired = null;

export function setTokenExpiredCallback(callback) {
  onTokenExpired = callback;
}

// Interceptor de respuesta para manejar errores 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('alex_token');
      localStorage.removeItem('alex_user');
      if (onTokenExpired) onTokenExpired();
    }
    return Promise.reject(error);
  }
);

export function getApiError(error) {
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Ocurrio un error inesperado';
  return message;
}

export default api;
