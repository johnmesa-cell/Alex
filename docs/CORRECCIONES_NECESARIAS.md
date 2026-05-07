# CORRECCIONES NECESARIAS — PROYECTO ALEX
**Fecha:** 7 de mayo de 2026
**Basado en:** Auditoría completa de estado del proyecto
**Propósito:** Lista de trabajo priorizada para corregir antes de agregar nuevas funcionalidades

---

## ⚠️ BLOQUEANTES — Resolver primero (impiden funcionamiento básico)

### 1. Implementar el método `logout()` en AuthController
- **Archivo:** `/backend/express-ts-openai/src/services/controllers/auth.controller.js`
- **Qué está mal:** El método `logout` está declarado en la ruta pero no existe en el controlador. Cualquier llamada al endpoint de logout genera error 500.
- **Por qué bloquea:** Los usuarios no pueden cerrar sesión. Las sesiones se acumulan en la base de datos sin límite.

### 2. Agregar middleware `verifyToken` al endpoint de chat IA
- **Archivo:** `/backend/express-ts-openai/src/services/routes/ai.routes.js`
- **Qué está mal:** La ruta `POST /api/ai/guidance` no tiene protección. Cualquier persona sin autenticación puede hacer consultas al modelo de IA.
- **Por qué bloquea:** Vulnerabilidad de seguridad activa y consumo no controlado de la API de Gemini.

### 3. Estandarizar la estructura de respuesta JSON en toda la API
- **Archivos:** `/backend/express-ts-openai/src/services/controllers/auth.controller.js` y `ai.controller.js`
- **Qué está mal:** Auth devuelve `{ message, token, user }` pero AI devuelve `{ success, data: { respuesta } }`. No hay una estructura unificada.
- **Por qué bloquea:** El frontend necesita lógica especial para cada endpoint. Agrega complejidad y facilita bugs al extender la app.

### 4. Eliminar la carpeta duplicada de rutas
- **Archivos:** `/backend/express-ts-openai/src/routes/` (carpeta completa)
- **Qué está mal:** Existen dos carpetas de rutas: `/src/routes/` y `/src/services/routes/`. `app.js` solo usa la segunda, pero la primera contiene código activo que nunca se ejecuta.
- **Por qué bloquea:** Cualquier desarrollador puede editar el archivo incorrecto y no ver el efecto, causando bugs silenciosos difíciles de rastrear.

### 5. Estandarizar el prefijo de todas las rutas a `/api/`
- **Archivos:** `/backend/express-ts-openai/src/services/app.js` y `/frontend/src/context/AuthContext.jsx`
- **Qué está mal:** Las rutas de autenticación usan `/auth/login` sin el prefijo `/api`, mientras que las de IA usan `/api/ai/guidance`. No hay convención uniforme.
- **Por qué bloquea:** Confusión arquitectural que se multiplica con cada nueva ruta que se agregue al sistema.

### 6. Corregir la configuración de variables de entorno para Docker
- **Archivos:** `/frontend/.env.example` y `/docker-compose.yml`
- **Qué está mal:** El frontend no tiene archivo `.env` real (solo `.env.example`). Además, `VITE_API_BASE_URL` apunta a `localhost` lo cual no funciona dentro de un contenedor Docker.
- **Por qué bloquea:** La aplicación no funciona en entorno Dockerizado, solo en desarrollo local puro.

---

## 🔴 CRÍTICOS — Resolver después de los bloqueantes (afectan seguridad y flujo principal)

### 7. El logout del frontend no llama al backend
- **Archivo:** `/frontend/src/context/AuthContext.jsx`
- **Qué está mal:** La función de logout solo borra el token de `localStorage` pero no hace `POST /auth/logout` para invalidar la sesión en la base de datos.
- **Por qué es crítico:** El usuario cree que cerró sesión pero el token sigue siendo válido en el backend.

### 8. Los claims del JWT no coinciden con lo que verifica el middleware de roles
- **Archivos:** `/backend/express-ts-openai/src/services/controllers/auth.controller.js` y `auth.middleware.js`
- **Qué está mal:** El JWT se firma con claims `{ sub, email, roleId }` pero el middleware `verifyRole()` espera un claim llamado `nombrerol`. Los nombres no coinciden.
- **Por qué es crítico:** El middleware de roles nunca funcionará correctamente, dejando rutas supuestamente protegidas por rol completamente abiertas.

### 9. Inconsistencia en el nombre del campo de login entre frontend y backend
- **Archivos:** `/frontend/src/pages/Login.jsx` y `/backend/express-ts-openai/src/services/controllers/auth.controller.js`
- **Qué está mal:** El formulario de login envía el campo como `email` pero el backend y el modelo Prisma esperan `correo`.
- **Por qué es crítico:** El login puede fallar si el backend deja de aceptar `email` como alias, y genera confusión en todo el equipo de desarrollo.

### 10. Validación de contraseña solo existe en el frontend
- **Archivos:** `/frontend/src/pages/Register.jsx` y `/backend/express-ts-openai/src/services/controllers/auth.controller.js`
- **Qué está mal:** El frontend valida `minLength={8}` mediante HTML5, pero el backend no valida longitud mínima ni formato de la contraseña.
- **Por qué es crítico:** Cualquier cliente puede saltarse el frontend y registrar usuarios con contraseñas de 1 carácter.

### 11. El frontend no maneja la expiración del token JWT
- **Archivos:** `/frontend/src/services/api.js` y `/frontend/src/context/AuthContext.jsx`
- **Qué está mal:** Los tokens expiran en 24h. El frontend no detecta la expiración y el usuario verá errores de autenticación sin explicación clara.
- **Por qué es crítico:** Experiencia de usuario confusa. El usuario no sabrá que debe volver a iniciar sesión.

### 12. El token JWT se almacena en `localStorage` (vulnerable a XSS)
- **Archivos:** `/frontend/src/context/AuthContext.jsx` y `/frontend/src/services/api.js`
- **Qué está mal:** `localStorage` es accesible desde cualquier script JavaScript. Un ataque XSS puede robar el token.
- **Por qué es crítico:** Vulnerabilidad de seguridad estándar. Debería usarse cookies `HttpOnly` inaccesibles desde JavaScript.

### 13. Inconsistencia en nombres de campos del usuario entre capas
- **Archivos:** `/backend/express-ts-openai/src/services/controllers/auth.controller.js` y `/frontend/src/context/AuthContext.jsx`
- **Qué está mal:** El backend devuelve `idusuario`, `idrol`, `correo` (snake_case sin guiones) y el frontend los normaliza manualmente a `id`, `idRol`, `correo`. Cada capa tiene su propio mapeo.
- **Por qué es crítico:** Cualquier nuevo campo en el backend requiere actualización manual en el frontend. Fuente constante de bugs silenciosos.

---

## 🟡 IMPORTANTES — Resolver antes de lanzar nuevas funcionalidades

### 14. El archivo `App.js` es redundante y debe eliminarse
- **Archivo:** `/frontend/src/App.js`
- **Qué está mal:** `App.js` solo re-exporta `App.jsx`. Ambos archivos conviven sin necesidad.
- **Por qué importa:** Puede causar importaciones ambiguas en Vite y confunde a cualquier colaborador del proyecto.

### 15. El endpoint de IA no valida longitud máxima del prompt
- **Archivo:** `/backend/express-ts-openai/src/services/controllers/ai.controller.js`
- **Qué está mal:** Solo se valida que el campo `prompt` exista, pero no su longitud máxima ni mínima.
- **Por qué importa:** Un usuario puede enviar prompts enormes causando timeouts y costos elevados en la API de Gemini.

### 16. No hay validación de formato de email ni de otros campos en el backend
- **Archivo:** `/backend/express-ts-openai/src/services/controllers/auth.controller.js`
- **Qué está mal:** Se verifica que los campos existan, pero no se valida formato de email, longitud de contraseña, ni se rechaza input inesperado.
- **Por qué importa:** Datos malformados pueden entrar a la base de datos y generar errores difíciles de diagnosticar.

### 17. El constructor de `AuthController` hace binding innecesario
- **Archivo:** `/backend/express-ts-openai/src/services/controllers/auth.controller.js`
- **Qué está mal:** El constructor vincula explícitamente `this.register` y `this.login` sin necesidad, ya que los métodos nunca se llaman con `this`.
- **Por qué importa:** Código innecesario que añade confusión al leer la clase.

### 18. Sesiones duplicadas se acumulan en la base de datos
- **Archivo:** `/backend/express-ts-openai/src/services/controllers/auth.controller.js`
- **Qué está mal:** Cada login crea una nueva sesión sin verificar si ya existe una sesión activa para ese usuario.
- **Por qué importa:** La tabla `sesiones` crecerá indefinidamente sin limpieza.

### 19. JWT_SECRET inconsistente entre archivos
- **Archivos:** `/backend/express-ts-openai/src/middlewares/auth.middleware.js` y `auth.controller.js`
- **Qué está mal:** Ambos archivos tienen su propia constante `JWT_SECRET` con un fallback hardcodeado diferente. Si la variable de entorno no está presente, usarán claves distintas.
- **Por qué importa:** Tokens generados por el controlador no podrán ser verificados por el middleware si usan claves diferentes.

---

## 📋 Resumen de conteo por severidad

| Categoría | Cantidad |
|---|---|
| 🔴 Bloqueantes | 6 |
| 🔴 Críticos | 7 |
| 🟡 Importantes | 6 |
| **Total** | **19** |

---

*Nota: Resolver los 6 bloqueantes es suficiente para tener una base estable. Los críticos deben resolverse antes de exponer la aplicación a usuarios reales. Los importantes pueden atacarse en paralelo al desarrollo de nuevas funcionalidades.*
