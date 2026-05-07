import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true  // Enviar cookies automáticamente
});

// Callback para manejar logout cuando expira el token
let onTokenExpired = null;

export function setTokenExpiredCallback(callback) {
  onTokenExpired = callback;
}

// El token se envía automáticamente en cookies gracias a withCredentials: true
// No necesitamos agregar nada en los headers

// Interceptor de respuesta para manejar errores 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si es un error 401 (no autorizado/token expirado)
    if (error.response?.status === 401) {
      const message = error.response?.data?.message || '';
      
      // Limpiar la sesión local
      localStorage.removeItem('alex_token');
      localStorage.removeItem('alex_user');

      // Llamar al callback si está definido
      if (onTokenExpired) {
        onTokenExpired();
      }
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
