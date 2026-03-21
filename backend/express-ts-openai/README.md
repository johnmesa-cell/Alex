# Express TypeScript OpenAI/Gemini Backend (Alex Project)

Este proyecto es una aplicación backend Node.js construida con Express.js, diseñada para proveer funcionalidades de autenticación y chat con IA (usando Google Gemini) para la plataforma Alex.

La aplicación sigue una arquitectura de controladores y servicios, utilizando Prisma como ORM para PostgreSQL.

## 📂 Estructura del Proyecto

La estructura actual del código fuente en `src/` es la siguiente:

```text
src/
├── config/
│   └── index.js             # Configuraciones generales
├── middlewares/
│   └── auth.middleware.js   # Middleware de verificación de JWT
├── services/
│   ├── app.js               # Punto de entrada de la aplicación
│   ├── prisma.client.js     # Instancia del cliente Prisma
│   ├── gemini.service.js    # Lógica de integración con Google Gemini AI
│   ├── openai.service.js    # Servicio OpenAI (Legacy/Alternativo)
│   ├── controllers/
│   │   ├── ai.controller.js   # Controlador para endpoints de IA
│   │   └── auth.controller.js # Controlador para registro y login
│   └── routes/
│       ├── ai.routes.js       # Rutas para IA (/api/ai)
│       └── auth.routes.js     # Rutas de autenticación (/auth)
└── prisma/
    └── schema.prisma        # Esquema de base de datos PostgreSQL

🚀 Configuración y Setup
1. Prerrequisitos
Node.js (v18+ recomendado)
PostgreSQL (o Docker container asociado)
Clave de API de Google Gemini (y opcionalmente OpenAI)
2. Instalación
# Navegar al directorio
cd backend/express-ts-openai

# Instalar dependencias
npm install

3. Variables de Entorno (.env)
Crea un archivo .env en la raíz de express-ts-openai con el siguiente contenido:

PORT=3000
DATABASE_URL="postgresql://johndoe:randompassword@localhost:5433/alexdb?schema=public" # Ajustar host/puerto según entorno
JWT_SECRET="tu_secreto_super_seguro"
GOOGLE_API_KEY="TU_API_KEY_DE_GEMINI"

4. Base de Datos (Prisma)

# Generar el cliente de Prisma (necesario tras cambios en schema.prisma)
npx prisma generate

# Ejecutar migraciones (sincronizar DB con esquema)
npx prisma migrate dev

5. Ejecución

# Iniciar en modo desarrollo (con nodemon)
npm run dev

# Iniciar en producción
npm start

📡 API Reference
Autenticación (/auth)

POST /auth/register

Registra un nuevo usuario. Nota: Requiere que exista el rol "usuario" en la base de datos


{
  "nombre": "Usuario Prueba",
  "email": "usuario@test.com",
  "password": "1234password"
}

POST /auth/login
Inicia sesión y devuelve información del usuario (token se implementará en respuesta futura para JWT).


{
  "email": "usuario@test.com",
  "password": "1234password"
}

nteligencia Artificial (/api/ai)
POST /api/ai/guidance
Envía un prompt a Gemini y recibe una respuesta generada.

{
  "prompt": "¿Cómo puedo organizar mejor mi tiempo de estudio?"
}
Respuesta

{
  "success": true,
  "data": {
    "respuesta": "Texto generado por la IA..."
  }
}

🛠️ Tecnologías Principales
Express.js: Framework web.
Prisma ORM: Gestión de base de datos PostgreSQL.
Google Generative AI: Motor de inteligencia artificial.
Bcryptjs: Hash de contraseñas.
JWT: Manejo de sesiones (preparado en middleware).
Docker: Contenerización lista para despliegue.
servidor en oracle dockerizado



## License

This project is licensed under the MIT License. See the LICENSE file for more details.
