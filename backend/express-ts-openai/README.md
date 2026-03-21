# ALEX — Backend API

**ALEX** (Asistente Logístico de Emergencias y Auxilio) es una API REST construida con **Node.js + Express** que proporciona:

- Autenticación de usuarios mediante **JWT**.
- Orientación médica preliminar impulsada por **Google Gemini** (con soporte opcional para **OpenAI GPT-4o**).
- Persistencia de datos en **PostgreSQL** a través de **Prisma ORM**.

---

## Tabla de contenidos

1. [Arquitectura del proyecto](#arquitectura-del-proyecto)
2. [Requisitos previos](#requisitos-previos)
3. [Variables de entorno](#variables-de-entorno)
4. [Instalación y ejecución](#instalación-y-ejecución)
5. [Endpoints de la API](#endpoints-de-la-api)
   - [Salud del servidor](#salud-del-servidor)
   - [Autenticación](#autenticación)
   - [IA médica](#ia-médica)
6. [Modelos de la base de datos](#modelos-de-la-base-de-datos)
7. [Middlewares](#middlewares)
8. [Servicios de IA](#servicios-de-ia)
9. [Docker](#docker)
10. [Seguridad](#seguridad)

---

## Arquitectura del proyecto

```
backend/express-ts-openai/
├── prisma/
│   └── schema.prisma           # Esquema de la base de datos (Prisma ORM)
├── src/
│   ├── config/
│   │   └── index.js            # Carga y exporta las variables de entorno
│   ├── middlewares/
│   │   └── auth.middleware.js  # Middlewares JWT: verifyToken, verifyRole
│   └── services/
│       ├── app.js              # Punto de entrada — inicializa Express
│       ├── prisma.client.js    # Singleton del cliente Prisma
│       ├── gemini.service.js   # Servicio Google Gemini (IA principal)
│       ├── openai.service.js   # Servicio OpenAI GPT-4o (alternativo)
│       ├── controllers/
│       │   ├── auth.controller.js  # Lógica de registro e inicio de sesión
│       │   └── ai.controller.js    # Lógica del chat con IA
│       └── routes/
│           ├── auth.routes.js  # Rutas /auth/*
│           └── ai.routes.js    # Rutas /api/ai/*
├── .env.example                # Plantilla de variables de entorno
├── Dockerfile                  # Imagen Docker del backend
└── package.json
```

### Patrón de diseño

El backend sigue el patrón **Controller → Service → Repository (Prisma)**:

```
HTTP Request
     │
     ▼
  Router          (src/services/routes/)
     │
     ▼
 Controller       (src/services/controllers/)
     │
     ▼
  Service         (src/services/*.service.js)
     │
     ▼
Prisma Client     (src/services/prisma.client.js → PostgreSQL)
```

---

## Requisitos previos

| Herramienta | Versión mínima |
|-------------|---------------|
| Node.js     | 18.x          |
| npm         | 9.x           |
| PostgreSQL   | 15.x          |
| Docker      | 24.x *(opcional)* |

---

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores:

```bash
cp .env.example .env
```

| Variable       | Descripción                                       | Ejemplo                                           |
|----------------|---------------------------------------------------|---------------------------------------------------|
| `PORT`         | Puerto del servidor HTTP                          | `3000`                                            |
| `NODE_ENV`     | Entorno de ejecución                              | `development` / `production`                      |
| `DATABASE_URL` | Cadena de conexión PostgreSQL                     | `postgresql://user:pass@localhost:5432/alexdb`    |
| `JWT_SECRET`   | Clave secreta para firmar tokens JWT              | *(cadena aleatoria larga y segura)*               |
| `GEMINI_API_KEY` | Clave de la API de Google Generative AI        | *(obtenida en Google AI Studio)*                  |
| `OPENAI_API_KEY` | Clave de la API de OpenAI *(opcional)*         | *(obtenida en platform.openai.com)*               |
| `CORS_ORIGINS` | Orígenes permitidos separados por coma            | `http://localhost:5173,https://tu-dominio.com`    |

---

## Instalación y ejecución

### Desarrollo local

```bash
# 1. Instalar dependencias
npm install

# 2. Crear la base de datos y aplicar el esquema
npx prisma db push

# 3. Generar el cliente Prisma
npx prisma generate

# 4. Iniciar el servidor con recarga automática
npm run dev

# 5. (Alternativa) Iniciar en modo producción
npm start
```

El servidor escucha en `http://localhost:3000` (o el puerto definido en `PORT`).

### Con Docker Compose (recomendado)

```bash
# Desde la raíz del monorepo
docker compose up --build
```

Servicios que se levantan:

| Servicio   | Puerto expuesto | Descripción              |
|------------|-----------------|--------------------------|
| `db`       | 5433 → 5432     | PostgreSQL 15            |
| `backend`  | 3000            | API Express              |
| `frontend` | 80 → 5173       | Interfaz React (Vite)    |

---

## Endpoints de la API

### Base URL

```
http://localhost:3000
```

---

### Salud del servidor

#### `GET /`

Verifica que la API esté en línea.

**Respuesta 200:**
```json
{
  "message": "ALEX API is running",
  "status": "ok"
}
```

---

### Autenticación

#### `POST /auth/register`

Registra un nuevo usuario en el sistema.

**Body:**
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "MiContraseña123"
}
```

| Campo      | Tipo   | Requerido | Descripción                    |
|------------|--------|-----------|-------------------------------|
| `nombre`   | string | ✅        | Nombre completo del usuario    |
| `email`    | string | ✅        | Correo electrónico único       |
| `password` | string | ✅        | Contraseña en texto plano      |

**Respuesta 201 — Éxito:**
```json
{
  "message": "Usuario registrado correctamente.",
  "user": {
    "id_usuario": 1,
    "nombre": "Juan Pérez",
    "correo": "juan@example.com",
    "id_rol": 2,
    "fecha_registro": "2026-03-21T15:30:00.000Z"
  }
}
```

**Respuesta 400 — Campos faltantes:**
```json
{ "error": "Los campos \"nombre\", \"email\" y \"password\" son requeridos." }
```

**Respuesta 409 — Correo duplicado:**
```json
{ "error": "El correo ya se encuentra registrado." }
```

---

#### `POST /auth/login`

Autentica al usuario y devuelve un token JWT.

**Body:**
```json
{
  "email": "juan@example.com",
  "password": "MiContraseña123"
}
```

**Respuesta 200 — Éxito:**
```json
{
  "message": "Inicio de sesión exitoso.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "idusuario": 1,
    "nombre": "Juan Pérez",
    "correo": "juan@example.com",
    "idrol": 2
  }
}
```

**Respuesta 401 — Credenciales inválidas:**
```json
{ "error": "Credenciales inválidas." }
```

> **Nota:** El token JWT tiene una vigencia de **24 horas** e incluye los campos
> `sub` (id_usuario), `email` y `roleId`.

---

### IA médica

#### `POST /api/ai/guidance`

Envía una pregunta o descripción de síntomas al asistente ALEX y recibe orientación médica preliminar.

**Body:**
```json
{
  "prompt": "Me duele la cabeza y tengo fiebre de 39°C, ¿qué debo hacer?"
}
```

| Campo    | Tipo   | Requerido | Descripción                          |
|----------|--------|-----------|--------------------------------------|
| `prompt` | string | ✅        | Pregunta o síntomas del usuario      |

**Respuesta 200 — Éxito:**
```json
{
  "success": true,
  "data": {
    "respuesta": "1. Mantente hidratado tomando agua o líquidos claros...\n\nNota: Esta es una orientación preliminar de IA y no sustituye la valoración de un profesional médico."
  }
}
```

**Respuesta 400 — Prompt vacío:**
```json
{ "success": false, "message": "El mensaje es requerido" }
```

**Respuesta 500 — Error de IA:**
```json
{ "success": false, "message": "Google dice: ..." }
```

> **Emergencias:** Si el sistema detecta una situación de riesgo vital, la
> respuesta siempre comienza con: *"Por favor, llama inmediatamente a la línea 123"*.

---

## Modelos de la base de datos

El esquema Prisma define los siguientes modelos en PostgreSQL:

### `Rol` → tabla `roles`

| Campo         | Tipo    | Descripción                      |
|---------------|---------|----------------------------------|
| `id_rol`      | Int (PK)| Identificador único del rol      |
| `nombre_rol`  | String  | Nombre único (ej. `"usuario"`)   |
| `descripcion` | String? | Descripción opcional del rol     |

### `Usuario` → tabla `usuario`

| Campo           | Tipo      | Descripción                           |
|-----------------|-----------|---------------------------------------|
| `id_usuario`    | Int (PK)  | Identificador único del usuario       |
| `id_rol`        | Int (FK)  | Rol asignado                          |
| `nombre`        | String    | Nombre completo (máx. 100 caracteres) |
| `correo`        | String    | Correo único (máx. 150 caracteres)    |
| `password_hash` | String    | Hash bcrypt de la contraseña          |
| `fecha_registro`| DateTime? | Fecha de registro (auto)              |
| `ultimo_login`  | DateTime? | Fecha del último inicio de sesión     |
| `estado`        | String?   | Estado de la cuenta (`"activo"`)      |

### `Sesion` → tabla `sesiones`

| Campo              | Tipo      | Descripción                        |
|--------------------|-----------|------------------------------------|
| `id_sesion`        | Int (PK)  | Identificador único de la sesión   |
| `id_usuario`       | Int (FK)  | Usuario propietario de la sesión   |
| `token`            | String    | JWT de la sesión                   |
| `fecha_inicio`     | DateTime? | Inicio de la sesión                |
| `ultima_actividad` | DateTime? | Última actividad registrada        |
| `fecha_expiracion` | DateTime? | Expiración del token               |
| `ip`               | String?   | Dirección IP del cliente           |
| `user_agent`       | String?   | User-Agent del navegador           |

### Otros modelos

| Modelo                 | Tabla                   | Propósito                                  |
|------------------------|-------------------------|--------------------------------------------|
| `Registro`             | `registros`             | Registros médicos creados por usuarios     |
| `auditoria`            | `auditoria`             | Log de cambios y acciones en el sistema    |
| `notificaciones`       | `notificaciones`        | Notificaciones para usuarios               |
| `reportes`             | `reportes`              | Reportes configurables                     |
| `reportes_programados` | `reportes_programados`  | Programación de ejecución de reportes      |

---

## Middlewares

### `verifyToken`

Verifica el JWT enviado en el header `Authorization: Bearer <token>`.

- Si el token es válido → añade `req.usuario` (payload del JWT) y `req.token`, y llama `next()`.
- Si el token expiró → responde `401` con `{ message: "El token ha expirado" }`.
- Si el token es inválido → responde `401` con `{ message: "Token inválido" }`.

```js
import { verifyToken } from '../middlewares/auth.middleware.js';

router.get('/perfil', verifyToken, (req, res) => {
  res.json({ usuario: req.usuario });
});
```

### `verifyRole(rolesPermitidos)`

Factory que genera un middleware de autorización por rol. Debe usarse **después** de `verifyToken`.

```js
import { verifyToken, verifyRole } from '../middlewares/auth.middleware.js';

// Solo los administradores pueden acceder
router.delete('/usuario/:id', verifyToken, verifyRole(['admin']), handler);
```

---

## Servicios de IA

### Google Gemini (`gemini.service.js`) — Servicio principal

- **Modelo:** `gemini-2.5-flash`
- **Función exportada:** `getGeminiGuidance(userMessage: string): Promise<string>`
- **Clave de entorno:** `GEMINI_API_KEY` o `GOOGLE_API_KEY`

El servicio aplica una instrucción de sistema fija que establece el tono médico,
la detección de emergencias (→ línea 123) y el formato de texto plano.

### OpenAI GPT-4o (`openai.service.js`) — Servicio alternativo

- **Modelo:** `gpt-4o`
- **Clase exportada:** `OpenAIService`
- **Método:** `getMedicalGuidance(userMessage, systemPrompt?): Promise<string>`
- **Clave de entorno:** `OPENAI_API_KEY`

El cliente de OpenAI se inicializa de forma perezosa en la primera llamada.

---

## Docker

### Variables en Docker Compose

Crea un archivo `.env` en la raíz del monorepo con los valores reales antes de
ejecutar `docker compose up`.

### Comandos útiles

```bash
# Construir y levantar todos los servicios
docker compose up --build

# Solo el backend
docker compose up backend

# Ver logs del backend
docker compose logs -f backend

# Ejecutar migraciones dentro del contenedor
docker compose exec backend npx prisma db push

# Abrir Prisma Studio
docker compose exec backend npx prisma studio
```

---

## Seguridad

| Medida                   | Implementación                                   |
|--------------------------|--------------------------------------------------|
| Contraseñas              | Hashing con **bcryptjs** (10 rondas de sal)      |
| Autenticación            | **JWT** firmados con `JWT_SECRET`, vigencia 24h  |
| Autorización             | Middleware `verifyRole` con control por rol      |
| CORS                     | Lista blanca de orígenes configurable            |
| Secrets                  | Variables de entorno, nunca en código fuente     |
| SQL Injection            | Prevenida por el ORM Prisma (queries parametrizadas) |

> ⚠️ **Nunca** uses el `JWT_SECRET` por defecto en producción. Genera una cadena
> aleatoria segura (mínimo 32 caracteres) y almacénala en la variable de entorno.
