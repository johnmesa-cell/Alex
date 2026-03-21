/**
 * @fileoverview Módulo de configuración central de la aplicación.
 * Carga las variables de entorno desde el archivo .env y exporta
 * los valores de configuración que el resto de la aplicación usa.
 *
 * Variables de entorno esperadas:
 *  - PORT            Puerto en el que escuchará el servidor (por defecto 3000).
 *  - OPENAI_API_KEY  Clave de API para el servicio de OpenAI.
 */

require('dotenv').config();

/**
 * Objeto de configuración global de la aplicación.
 *
 * @type {{ port: number, openaiApiKey: string|undefined }}
 * @property {number}           port          Puerto del servidor HTTP.
 * @property {string|undefined} openaiApiKey  Clave secreta de la API de OpenAI.
 */
const config = {
    port: process.env.PORT || 3000,
    openaiApiKey: process.env.OPENAI_API_KEY,
};

module.exports = config;