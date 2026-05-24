import rateLimit from 'express-rate-limit';

// Limita intentos de login a 10 por IP cada 15 minutos
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Demasiados intentos. Intenta en 15 minutos."
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Limita registros a 5 por IP cada 60 minutos
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Demasiados registros desde esta IP."
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Limita mensajes de chat a 30 por IP cada 1 minuto
export const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: "Demasiadas solicitudes al chat. Espera un momento."
  },
  standardHeaders: true,
  legacyHeaders: false
});
