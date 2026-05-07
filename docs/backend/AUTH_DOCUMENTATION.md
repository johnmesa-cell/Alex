# 🔐 Sistema de Autenticación ALEX

Documentación completa del sistema de autenticación JWT implementado en el backend de ALEX.

---

## 📋 Tabla de Contenidos

1. [Dependencias Instaladas](#-dependencias-instaladas)
2. [Archivos Creados](#-archivos-creados)
3. [Endpoints de la API](#-endpoints-de-la-api)
4. [Ejemplos de Uso](#-ejemplos-de-uso)
5. [Manejo de Errores](#-manejo-de-errores)
6. [Seguridad](#-seguridad)

---

## 📦 Dependencias Instaladas

```bash
npm install bcryptjs jsonwebtoken
```

### Descripción de cada dependencia:

| Dependencia | Versión | Propósito |
|-------------|---------|----------|
| **bcryptjs** | ^2.4.0 | Cifrar y verificar contraseñas de forma segura |
| **jsonwebtoken** | ^9.1.0 | Crear, firmar y verificar tokens JWT |
| **@prisma/client** | ya instalado | Cliente ORM para base de datos |

---

## 📁 Archivos Creados

### 1. **auth.controller.js**
📍 Ubicación: `backend/express-ts-openai/src/services/controllers/auth.controller.js`

Controlador con las siguientes funciones:
- `register`: Registra un nuevo usuario
- `login`: Autentica un usuario y genera JWT
- `logout`: Cierra la sesión del usuario

**Características:**
- Validación de emails tipo RFC 5322
- Contraseñas con mínimo 6 caracteres
- Hash de contraseña con bcrypt (10 rounds de sal)
- Tokens JWT con expiración de 24h
- Registro de sesiones en base de datos
- Captura de IP y User-Agent

---

### 2. **auth.middleware.js**
📍 Ubicación: `backend/express-ts-openai/src/middlewares/auth.middleware.js`

Middlewares para proteger rutas:
- `verifyToken`: Verifica JWT válido en header Authorization
- `verifyRole`: Verifica que el usuario tenga un rol específico

**Características:**
- Extrae información del usuario del token
- Detecta tokens expirados
- Detecta tokens inválidos
- Control granular por roles

---

### 3. **auth.routes.js**
📍 Ubicación: `backend/express-ts-openai/src/routes/auth.routes.js`

Define los endpoints:
- POST `/api/auth/register` - Registración pública
- POST `/api/auth/login` - Login público
- POST `/api/auth/logout` - Logout protegido

---

## 🔗 Endpoints de la API

### 1. Register - Registración de Usuario

**Endpoint:**
```
POST /api/auth/register
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "nombre": "Juan Pérez",
  "correo": "juan@example.com",
  "password": "MiPassword123",
  "idrol": 2
}
```

**Respuesta (201 - Exitosa):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "idusuario": 1,
    "nombre": "Juan Pérez",
    "correo": "juan@example.com",
    "idrol": 2,
    "fecharegistro": "2026-03-17T15:30:00.000Z"
  }
}
```

**Errores Posibles:**
- `400`: Campos requeridos faltantes
- `400`: Formato de email inválido
- `400`: Contraseña muy corta (< 6 caracteres)
- `409`: Email ya registrado

---

### 2. Login - Autenticación

**Endpoint:**
```
POST /api/auth/login
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "correo": "juan@example.com",
  "password": "MiPassword123"
}
```

**Respuesta (200 - Exitosa):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "idusuario": 1,
    "nombre": "Juan Pérez",
    "correo": "juan@example.com",
    "nombrerol": "usuario",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZHVzdWFyaW8iOjEsImNvcmVvIjoianVhbkBleGFtcGxlLmNvbSIsImlhdCI6MTcxMDA4...",
  }
}
```

**Errores Posibles:**
- `400`: Correo o contraseña faltantes
- `401`: Credenciales incorrectas
- `403`: Usuario inactivo o bloqueado

---

### 3. Logout - Cierre de Sesión

**Endpoint:**
```
POST /api/auth/logout
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <tu_token_jwt>
```

**Respuesta (200 - Exitosa):**
```json
{
  "success": true,
  "message": "Logout exitoso"
}
```

**Errores Posibles:**
- `401`: Token no proporcionado
- `401`: Token expirado
- `401`: Token inválido

---

## 📝 Ejemplos de Uso

### Ejemplo 1: Registración con cURL

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Carlos López",
    "correo": "carlos@example.com",
    "password": "Segura123",
    "idrol": 2
  }'
```

### Ejemplo 2: Login con cURL

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "correo": "carlos@example.com",
    "password": "Segura123"
  }'
```

### Ejemplo 3: Acceder a ruta protegida

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Ejemplo 4: Usar en Fetch API (Frontend)

```javascript
// Registration
async function registrarse() {
  const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: 'Ana García',
      correo: 'ana@example.com',
      password: 'Segura456',
      idrol: 2
    })
  });
  
  const data = await response.json();
  console.log(data);
}

// Login
async function login() {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      correo: 'ana@example.com',
      password: 'Segura456'
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Guardar token en localStorage
    localStorage.setItem('token', data.data.token);
    console.log('Login exitoso:', data.data);
  }
}

// Usar token en peticiones autenticadas
async function hacerPeticionProtegida() {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3000/api/protected-route', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  console.log(data);
}
```

---

## 🛡️ Manejo de Errores

Todos los endpoints retornan respuestas en JSON con la siguiente estructura:

```json
{
  "success": boolean,
  "message": "Descripción del resultado",
  "data": {} // Opcional, contiene datos en caso de éxito
  "error": "Detalles del error" // Opcional, solo en errores 5xx
}
```

### Códigos HTTP Utilizados:

| Código | Significado |
|--------|------------|
| `200` | OK - Operación exitosa |
| `201` | CREATED - Recurso creado |
| `400` | BAD REQUEST - Validación fallida |
| `401` | UNAUTHORIZED - Token inválido o expirado |
| `403` | FORBIDDEN - Acceso denegado (usuario inactivo) |
| `409` | CONFLICT - Recurso duplicado (email) |
| `500` | INTERNAL SERVER ERROR - Error del servidor |

---

## 🔒 Seguridad

### Prácticas de Seguridad Implementadas:

1. **Hash de Contraseñas**: Bcrypt con 10 rounds de sal
2. **JWT Firmado**: Tokens firmados con JWT_SECRET
3. **Expiración de Tokens**: 24 horas
4. **Validación de Campos**: Verificación de contenido y formato
5. **Registro de Sesiones**: Almacenamiento de IP y User-Agent
6. **Estado de Usuario**: Verificación de usuario activo
7. **Token en Header**: Uso de Authorization Bearer

### Recomendaciones Adicionales:

- ✅ Usar HTTPS en producción (TLS/SSL)
- ✅ Implementar Rate Limiting para endpoints de login
- ✅ Implementar 2FA (Two-Factor Authentication)
- ✅ Renovación de tokens (refresh tokens)
- ✅ Logout desde todos los dispositivos
- ✅ Monitoreo de intentos fallidos de login

---

## 🔧 Configuración en .env

Asegúrate de tener estas variables en tu archivo `.env`:

```env
DATABASE_URL="postgresql://johndoe:randompassword@localhost:5433/alexdb?schema=public"
JWT_SECRET="alex_super_secret_key_2026"
PORT=3000
```

---

## 📌 Campos del Modelo Usuario en Prisma

```prisma
model Usuario {
  idusuario     Int        @id @default(autoincrement())
  idrol         Int
  nombre        String     @db.VarChar(100)
  correo        String     @unique @db.VarChar(150)
  passwordhash  String     @db.Text    // ⚠️ IMPORTANTE: passwordhash, no password
  fecharegistro DateTime?  @default(now())
  ultimologin   DateTime?
  estado        String?    @default("activo") @db.VarChar(20)
  
  rol           Rol        @relation(fields: [idrol], references: [idrol])
  sesiones      Sesion[]
  registros     Registro[]
  consultas     Consulta[]

  @@map("usuario")
}
```

---

## ✅ Checklist de Implementación

- [x] Instalar bcryptjs
- [x] Instalar jsonwebtoken
- [x] Crear auth.controller.js
- [x] Crear auth.middleware.js
- [x] Crear auth.routes.js
- [x] Integrar rutas en app.js
- [x] Cifrado de contraseñas con bcrypt
- [x] Generación de JWT de 24h
- [x] Validaciones de entrada
- [x] Registro de sesiones
- [x] Manejo de errores completo
- [ ] Tests unitarios (próximo paso)
- [ ] Implementar Refresh Tokens
- [ ] Implementar Rate Limiting

---

**Desarrollado por:** Senior Backend Developer  
**Proyecto:** ALEX  
**Fecha:** 17 de Marzo, 2026  
**Tecnologías:** Node.js, Express, Prisma, JWT, Bcrypt
