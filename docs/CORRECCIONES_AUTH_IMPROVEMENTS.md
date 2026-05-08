# 📋 Documento de Correcciones y Mejoras
## Rama de referencia: `john-frotend` → Aplicar en: `fix/auth-improvements`

> **Fecha:** Mayo 2026  
> **Objetivo:** Aplicar las mejoras de calidad y seguridad hechas en `john-frotend` sobre la rama `fix/auth-improvements`, que parte de `main` con todas las funcionalidades completas.

---

## 🗂️ Resumen de archivos a modificar o crear

| Archivo | Acción | Prioridad |
|---|---|---|
| `src/config/index.js` | **Actualizar** | 🔴 Alta |
| `src/services/app.js` | **Actualizar** (agregar `cookie-parser`) | 🔴 Alta |
| `src/middlewares/auth.middleware.js` | **Actualizar** | 🔴 Alta |
| `src/services/controllers/auth.handler.js` | **Reemplazar** por `auth.controller.js` | 🔴 Alta |
| `src/services/routes/auth.routes.js` | **Actualizar** (agregar logout) | 🔴 Alta |
| `src/services/controllers/ai.controller.js` | **Actualizar** (validaciones mejoradas) | 🟡 Media |

---

## 🔧 CORRECCIÓN 1 — `src/config/index.js`

### ❌ Estado actual en `main`
El archivo de configuración en `main` tiene un tamaño de 156 bytes y no está completamente estructurado como módulo centralizado reutilizable.

### ✅ Nuevo contenido (de `john-frotend`)
```js
import dotenv from 'dotenv';
dotenv.config();

const config = {
    port: process.env.PORT || 3000,
    openaiApiKey: process.env.OPENAI_API_KEY,
    jwtSecret: process.env.JWT_SECRET || 'alex_super_secret_key_2026',
};

export default config;
```

### 📌 Por qué aplicar este cambio
- Centraliza todas las variables de entorno en un solo lugar.
- Evita que cada archivo importe `process.env.JWT_SECRET` directamente (como ocurre en `main`).
- Si en el futuro se cambia el nombre de una variable de entorno, solo se cambia aquí.

---

## 🔧 CORRECCIÓN 2 — `src/services/app.js`

### ❌ Problema en `main`
- No usa `cookie-parser`, por lo que las cookies `httpOnly` no pueden leerse.
- CORS no soporta `process.env.FRONTEND_ORIGIN` como origen dinámico.
- La respuesta del endpoint `/` no incluye `version`.

### ✅ Cambios a aplicar

**1. Agregar dependencia e import de `cookie-parser`:**
```js
import cookieParser from "cookie-parser";
```

**2. Registrar el middleware (después de `bodyParser.json()`):**
```js
app.use(bodyParser.json());
app.use(cookieParser());  // ← NUEVO: necesario para leer cookies httpOnly
```

**3. Actualizar la lista de orígenes CORS para incluir variable de entorno:**
```js
const allowedOrigins = [
    process.env.FRONTEND_ORIGIN,   // ← NUEVO: origen configurable por env
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost",
    "http://127.0.0.1"
].filter(Boolean);
```

**4. Actualizar respuesta del endpoint raíz `/`:**
```js
app.get("/", (req, res) => {
    res.status(200).json({
        message: "ALEX API is running",
        status: "ok",
        version: "1.0.0",  // ← NUEVO
    });
});
```

### 📌 Por qué aplicar este cambio
- `cookie-parser` es **obligatorio** para que el logout pueda leer la cookie `alex_token`.
- Sin este middleware, `req.cookies` siempre será `undefined` y el logout fallará.

---

## 🔧 CORRECCIÓN 3 — `src/middlewares/auth.middleware.js`

### ❌ Problemas en `main`
1. Solo lee el token desde `Authorization: Bearer <token>` en el header. **No soporta cookies httpOnly.**
2. `verifyRole` compara contra `req.usuario.nombrerol` (string) — campo que **no existe en el JWT** generado.
3. El JWT secret se declara como constante local en lugar de usar el módulo `config`.

### ✅ Cambios a aplicar

**1. Importar config centralizado:**
```js
import config from '../config/index.js';
```

**2. Reemplazar la lectura del secret:**
```js
// ❌ Antes (main):
const JWT_SECRET = process.env.JWT_SECRET || 'alex_super_secret_key_2026';
// ...
const decoded = jwt.verify(token, JWT_SECRET);

// ✅ Después (john-frotend):
const decoded = jwt.verify(token, config.jwtSecret);
```

**3. Hacer que `verifyToken` también lea cookies httpOnly:**
```js
export const verifyToken = (req, res, next) => {
  try {
    let token = null;

    // Primero intentar desde header Authorization
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // Si no hay token en header, buscar en cookie httpOnly
    if (!token && req.cookies && req.cookies.alex_token) {
      token = req.cookies.alex_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado o formato inválido',
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    req.usuario = decoded;
    req.token = token;
    next();
  } catch (error) {
    // ... manejo de errores igual
  }
};
```

**4. Corregir `verifyRole` para usar `roleId` (número) en lugar de `nombrerol` (string):**
```js
// ❌ Antes (main) — campo que no existe en el JWT:
if (!rolesPermitidos.includes(req.usuario.nombrerol)) { ... }

// ✅ Después (john-frotend) — campo correcto del JWT:
if (!rolesPermitidos.includes(req.usuario.roleId)) { ... }
```

### 📌 Por qué aplicar este cambio
- El middleware de `main` **no podía proteger rutas** cuando el frontend usara cookies, solo funcionaba con Bearer token.
- `verifyRole` en `main` **nunca funcionaba** porque comparaba contra un campo (`nombrerol`) que no existe en el payload del JWT — el JWT tiene `roleId`.

---

## 🔧 CORRECCIÓN 4 — `src/services/controllers/auth.handler.js` → renombrar a `auth.controller.js`

### ❌ Problemas en `main` (`auth.handler.js`)
1. **No tiene endpoint `logout`** — no hay forma de cerrar sesión.
2. **Sin validación de formato de email** — acepta cualquier cadena como correo.
3. **Sin validación de complejidad de contraseña** — acepta contraseñas de 1 carácter.
4. **Sin validación de nombre** — acepta caracteres especiales o nombres muy cortos.
5. En `register`, usa `prisma.rol.upsert()` que **crea el rol si no existe** — esto puede generar roles duplicados o inconsistencias en producción.
6. El token JWT se **devuelve directamente en el JSON** del login — expuesto a ataques XSS.
7. No limpia sesiones anteriores al hacer login — acumula sesiones obsoletas en la DB.
8. Las respuestas no tienen estructura consistente (`success`, `message`, `data`).

### ✅ Nuevo archivo: `auth.controller.js` (de `john-frotend`)

**Funciones helper de validación a agregar (arriba de la clase):**
```js
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string') return { isValid: false, error: 'El email debe ser un texto válido' };
    const trimmedEmail = email.trim();
    if (trimmedEmail.length < 5) return { isValid: false, error: 'El email es demasiado corto' };
    if (trimmedEmail.length > 254) return { isValid: false, error: 'El email es demasiado largo' };
    if (!emailRegex.test(trimmedEmail)) return { isValid: false, error: 'El formato del email no es válido' };
    return { isValid: true, error: null };
}

function validateNombre(nombre) {
    if (!nombre || typeof nombre !== 'string') return { isValid: false, error: 'El nombre debe ser un texto válido' };
    const trimmedNombre = nombre.trim();
    if (trimmedNombre.length < 2) return { isValid: false, error: 'El nombre debe tener al menos 2 caracteres' };
    if (trimmedNombre.length > 100) return { isValid: false, error: 'El nombre no puede exceder 100 caracteres' };
    const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/;
    if (!nombreRegex.test(trimmedNombre)) return { isValid: false, error: 'El nombre contiene caracteres no permitidos' };
    return { isValid: true, error: null };
}

function validatePassword(password) {
    if (!password || typeof password !== 'string') return { isValid: false, error: 'La contraseña debe ser una cadena de texto' };
    if (password.length < 8) return { isValid: false, error: 'La contraseña debe tener al menos 8 caracteres' };
    if (password.length > 128) return { isValid: false, error: 'La contraseña no puede exceder 128 caracteres' };
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
        return { isValid: false, error: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número' };
    }
    return { isValid: true, error: null };
}

function normalizeUserResponse(user) {
    return {
        id: user.id_usuario,
        nombre: user.nombre,
        correo: user.correo,
        idRol: user.id_rol,
        fechaRegistro: user.fecha_registro
    };
}
```

**Cambios clave en `register`:**
- Acepta tanto `email` como `correo` en el body: `const emailField = email || correo;`
- Ejecuta validaciones de nombre, email y contraseña antes de tocar la DB.
- Reemplaza `prisma.rol.upsert()` por `prisma.rol.findFirst()` — no crea roles nuevos automáticamente.
- Respuesta estandarizada con `{ success: true, message, data: { user } }`.

**Cambios clave en `login`:**
- Acepta tanto `email` como `correo` en el body.
- Valida el formato del email antes de consultar la DB.
- **Limpia sesiones anteriores** antes de crear una nueva: `await prisma.sesion.deleteMany({ where: { id_usuario: user.id_usuario } })`
- **Retorna el token en cookie httpOnly** (no en el JSON) → protección anti-XSS:
```js
res.cookie('alex_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
});
```
- Respuesta estandarizada — devuelve solo datos del usuario, **no el token**.

**Nuevo método `logout`:**
```js
async logout(req, res) {
    try {
        const token = req.cookies?.alex_token;
        if (!token) {
            return res.status(401).json({ success: false, message: "No hay sesión activa", data: null });
        }
        await prisma.sesion.deleteMany({ where: { token } });
        res.clearCookie('alex_token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
        return res.status(200).json({ success: true, message: "Sesión cerrada correctamente.", data: null });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error al cerrar sesión.", data: null, details: error.message });
    }
}
```

---

## 🔧 CORRECCIÓN 5 — `src/services/routes/auth.routes.js`

### ❌ Estado actual en `main`
```js
import { register, login } from '../controllers/auth.handler.js';
// Solo tiene POST /register y POST /login
```

### ✅ Nuevo contenido
```js
import express from "express";
import authController from "../controllers/auth.controller.js";

export const setAuthRoutes = (app) => {
    const router = express.Router();

    router.post("/register", authController.register);
    router.post("/login", authController.login);
    router.post("/logout", authController.logout);  // ← NUEVO

    app.use("/auth", router);
};
```

### 📌 Por qué aplicar este cambio
- Apunta al nuevo controlador `auth.controller.js`.
- Registra el endpoint `POST /auth/logout` que antes no existía.

---

## 🔧 CORRECCIÓN 6 — `src/services/controllers/ai.controller.js`

### ❌ Problema en `main`
- Solo valida si `prompt` existe, pero no valida tipo, longitud mínima ni longitud máxima.
- Error 500 expone el `error.message` directamente sin mensaje amigable.

### ✅ Cambios a aplicar

**Agregar constantes de validación al inicio del archivo:**
```js
const MIN_PROMPT_LENGTH = 1;
const MAX_PROMPT_LENGTH = 5000;
```

**Reemplazar el bloque de validación existente:**
```js
if (!prompt) {
    return res.status(400).json({ success: false, message: 'El campo "prompt" es requerido', data: null });
}

if (typeof prompt !== 'string') {
    return res.status(400).json({ success: false, message: 'El campo "prompt" debe ser un texto', data: null });
}

if (prompt.trim().length < MIN_PROMPT_LENGTH) {
    return res.status(400).json({ success: false, message: `El prompt no puede estar vacío (mínimo ${MIN_PROMPT_LENGTH} carácter)`, data: null });
}

if (prompt.length > MAX_PROMPT_LENGTH) {
    return res.status(400).json({ success: false, message: `El prompt no puede exceder ${MAX_PROMPT_LENGTH} caracteres (actual: ${prompt.length})`, data: null });
}
```

**Actualizar respuesta exitosa para incluir `message`:**
```js
return res.status(200).json({
    success: true,
    message: 'Consulta procesada correctamente',  // ← NUEVO
    data: { respuesta }
});
```

**Actualizar respuesta de error 500:**
```js
return res.status(500).json({
    success: false,
    message: 'Error al procesar la consulta',  // ← mensaje amigable
    data: null,
    details: error.message  // ← detalles en campo separado
});
```

---

## 📦 Dependencia npm a instalar

En `backend/express-ts-openai/` ejecutar:
```bash
npm install cookie-parser
```
Esto agrega `cookie-parser` al `package.json`, necesario para que `app.use(cookieParser())` funcione.

---

## ✅ Checklist de implementación

- [ ] Actualizar `src/config/index.js`
- [ ] Agregar `cookie-parser` al `app.js` (import + `app.use(cookieParser())`)
- [ ] Actualizar CORS en `app.js` para incluir `process.env.FRONTEND_ORIGIN`
- [ ] Actualizar `src/middlewares/auth.middleware.js` (soporte cookies + corrección `verifyRole`)
- [ ] Crear `src/services/controllers/auth.controller.js` con la versión nueva
- [ ] Actualizar `src/services/routes/auth.routes.js` (importar nuevo controlador + ruta logout)
- [ ] Actualizar `src/services/controllers/ai.controller.js` (validaciones mejoradas)
- [ ] Ejecutar `npm install cookie-parser` en `backend/express-ts-openai/`
- [ ] Probar `POST /auth/register` con datos válidos e inválidos
- [ ] Probar `POST /auth/login` — verificar que cookie `alex_token` se establezca
- [ ] Probar `POST /auth/logout` — verificar que cookie se elimine y sesión se borre de DB
- [ ] Verificar que rutas protegidas con `verifyToken` funcionen con cookie Y con Bearer header
- [ ] Verificar que `verifyRole` funcione correctamente con `roleId` numérico

---

## ⚠️ Archivos que NO deben modificarse

Estos módulos existen en `main` y **no están en `john-frotend`** — no tocar:
- `src/services/controllers/firstaid.controller.js`
- `src/services/controllers/voice.controller.js`
- `src/services/controllers/files.controller.js`
- `src/services/controllers/consultas.controller.js`
- `src/services/controllers/metrics.controller.js`
- `src/services/routes/firstaid.routes.js`
- `src/services/routes/voice.routes.js`
- `src/services/routes/files.routes.js`
- `src/services/routes/consultas.routes.js`
- `src/services/routes/metrics.routes.js`
