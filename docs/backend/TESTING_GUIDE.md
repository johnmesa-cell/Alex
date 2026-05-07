# 🧪 GUÍA DE TESTING - API de Autenticación ALEX

Puedes probar la API usando **Postman**, **Thunder Client** o **cURL**.

---

## 📦 Importar en Postman/Thunder Client

Si tienes instalado Postman o Thunder Client, sigue estos pasos:

1. Abre **Postman** o **Thunder Client**
2. Crea una nueva Colección llamada "ALEX Auth"
3. Copia y pega las peticiones de abajo

---

## 🔧 PETICIONES HTTP

### 1️⃣ REGISTRACIÓN

**Método:** `POST`  
**URL:** `http://localhost:3000/api/auth/register`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "nombre": "Carlos López",
  "correo": "carlos@example.com",
  "password": "MiPassword123",
  "idrol": 2
}
```

**Respuesta Esperada (201):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "idusuario": 1,
    "nombre": "Carlos López",
    "correo": "carlos@example.com",
    "idrol": 2,
    "fecharegistro": "2026-03-17T15:45:00.000Z"
  }
}
```

---

### 2️⃣ LOGIN

**Método:** `POST`  
**URL:** `http://localhost:3000/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "correo": "carlos@example.com",
  "password": "MiPassword123"
}
```

**Respuesta Esperada (200):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "idusuario": 1,
    "nombre": "Carlos López",
    "correo": "carlos@example.com",
    "nombrerol": "usuario",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZHVzdWFyaW8iOjEsImNvcmVvIjoiY2FybG9zQGV4YW1wbGUuY29tIiwibm9tYnJlIjoiQ2FybG9zIExsb3BleiIsImlkcm9sIjoyLCJub21icmVyb2wiOiJ1c3VhcmlvIiwiaWF0IjoxNzEwNzAyNzAwLCJleHAiOjE3MTA3ODkxMDB9.xyz..."
  }
}
```

⭐ **IMPORTANTE:** Guarda el `token` para las próximas peticiones

---

### 3️⃣ VALIDAR ACCESO PROTEGIDO

**Método:** `POST`  
**URL:** `http://localhost:3000/api/auth/logout`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZHVzdWFyaW8iOjEsImNvcmVvIjoiY2FybG9zQGV4YW1wbGUuY29tIiwibm9tYnJlIjoiQ2FybG9zIExsb3BleiIsImlkcm9sIjoyLCJub21icmVyb2wiOiJ1c3VhcmlvIiwiaWF0IjoxNzEwNzAyNzAwLCJleHAiOjE3MTA3ODkxMDB9.xyz...
```

**Body:** `{}` (vacío)

**Respuesta Esperada (200):**
```json
{
  "success": true,
  "message": "Logout exitoso"
}
```

---

## 🧪 CASOS DE ERROR PARA PROBAR

### ❌ Error 1: Email no proporcionado

**Petición:** Register sin correo

```json
{
  "nombre": "Juan",
  "password": "MiPassword123"
}
```

**Respuesta (400):**
```json
{
  "success": false,
  "message": "Nombre, correo y contraseña son requeridos"
}
```

---

### ❌ Error 2: Email inválido

**Petición:** Register con email mal formato

```json
{
  "nombre": "Juan",
  "correo": "email-sin-arroba.com",
  "password": "MiPassword123"
}
```

**Respuesta (400):**
```json
{
  "success": false,
  "message": "El formato del correo es inválido"
}
```

---

### ❌ Error 3: Contraseña muy corta

**Petición:** Register con password < 6 caracteres

```json
{
  "nombre": "Juan",
  "correo": "juan@example.com",
  "password": "123"
}
```

**Respuesta (400):**
```json
{
  "success": false,
  "message": "La contraseña debe tener al menos 6 caracteres"
}
```

---

### ❌ Error 4: Email duplicado

**Petición:** Register con email que ya existe

```json
{
  "nombre": "Otro Usuario",
  "correo": "carlos@example.com",
  "password": "MiPassword123"
}
```

**Respuesta (409):**
```json
{
  "success": false,
  "message": "El correo ya está registrado"
}
```

---

### ❌ Error 5: Credenciales incorrectas en Login

**Petición:** Login con password incorrecto

```json
{
  "correo": "carlos@example.com",
  "password": "PasswordIncorrecto"
}
```

**Respuesta (401):**
```json
{
  "success": false,
  "message": "Correo o contraseña incorrectos"
}
```

---

### ❌ Error 6: Token no proporcionado en ruta protegida

**Petición:** POST /api/auth/logout SIN header Authorization

**Headers:**
```
Content-Type: application/json
```

**Respuesta (401):**
```json
{
  "success": false,
  "message": "Token no proporcionado o formato inválido"
}
```

---

### ❌ Error 7: Token inválido

**Petición:** POST /api/auth/logout con token falso

**Headers:**
```
Content-Type: application/json
Authorization: Bearer token_falso_xyz
```

**Respuesta (401):**
```json
{
  "success": false,
  "message": "Token inválido"
}
```

---

### ❌ Error 8: Token expirado

**Nota:** El token expira después de 24 horas. Una vez expirado:

**Respuesta (401):**
```json
{
  "success": false,
  "message": "El token ha expirado"
}
```

---

## 🔄 FLUJO DE TESTING COMPLETO

### Paso 1: Registrar un usuario

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test User",
    "correo": "test@example.com",
    "password": "TestPass123"
  }'
```

**Respuesta:** Guardas el `idusuario`

---

### Paso 2: Hacer Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "correo": "test@example.com",
    "password": "TestPass123"
  }'
```

**Respuesta:** Guardas el `token`

---

### Paso 3: Usar el token para acceder a ruta protegida

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

**Respuesta:** Logout exitoso

---

## 📊 TABLA DE CÓDIGOS HTTP

| Código | Significado | Ejemplo |
|--------|------------|---------|
| 200 | OK - Éxito | Login o Logout correcto |
| 201 | Created - Creado | Registro exitoso |
| 400 | Bad Request | Validación fallida |
| 401 | Unauthorized | Token inválido o expirado |
| 403 | Forbidden | Usuario inactivo |
| 409 | Conflict | Email duplicado |
| 500 | Server Error | Error en el servidor |

---

## 💾 DATOS DE PRUEBA RECOMENDADOS

```
Usuario 1:
- Nombre: Juan Pérez
- Correo: juan@test.com
- Contraseña: Test123456
- Rol: 2 (usuario)

Usuario 2:
- Nombre: Monica Admin
- Correo: monica@test.com
- Contraseña: Admin123456
- Rol: 1 (admin)

Usuario 3:
- Nombre: Pedro Moderador
- Correo: pedro@test.com
- Contraseña: Moderator123
- Rol: 3 (moderador)
```

---

## 🛠️ HERRAMIENTAS RECOMENDADAS

### Opción 1: Postman
- Descargar: https://www.postman.com/downloads/
- Fácil, interfaz gráfica
- Permite guardar colecciones

### Opción 2: Thunder Client (VSCode)
- Extensión: Thunder Client
- Ligero y rápido
- Integrado en VS Code

### Opción 3: cURL (Terminal)
- Pre-instalado en Windows, Mac, Linux
- Perfecto para CI/CD
- Sin interfaz gráfica

### Opción 4: REST Client (VSCode)
- Extensión: REST Client
- Crea archivos `.http` o `.rest`
- Perfecto para versionado

---

## 📝 ARCHIVO .http PARA REST CLIENT

Crea un archivo `test.http` con este contenido:

```http
### Variables
@base = http://localhost:3000/api/auth
@token = 

### 1. Register
POST {{base}}/register
Content-Type: application/json

{
  "nombre": "Test User",
  "correo": "test@example.com",
  "password": "TestPass123",
  "idrol": 2
}

### 2. Login
POST {{base}}/login
Content-Type: application/json

{
  "correo": "test@example.com",
  "password": "TestPass123"
}

### 3. Logout
POST {{base}}/logout
Content-Type: application/json
Authorization: Bearer {{token}}

{}
```

Luego haz clic en "Send Request" sobre cada petición.

---

## ⚡ COMANDOS RÁPIDOS PARA TERMINAL

### Registrarse:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"User","correo":"user@test.com","password":"Test123"}'
```

### Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"user@test.com","password":"Test123"}'
```

### Logout (reemplaza TOKEN):
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer TOKEN"
```

---

**¡Ahora estás listo para probar la API de autenticación!** 🚀
