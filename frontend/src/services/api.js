import axios from 'axios';

const api = axios.create({
  // baseURL es '/' para que las rutas como '/api/consultas' funcionen sin duplicar /api
  baseURL: import.meta.env.VITE_API_URL || '/',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});

let onTokenExpired = null;

export function setTokenExpiredCallback(callback) {
  onTokenExpired = callback;
}

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
