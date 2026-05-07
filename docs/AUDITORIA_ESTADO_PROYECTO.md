# AUDITORÍA DE ESTADO — PROYECTO ALEX

**Fecha:** 7 de mayo de 2026  
**Proyecto:** ALEX — Asistente de Primeros Auxilios con IA  
**Scope:** Frontend (React + Vite), Backend (Express.js), Integración, Base de Datos (PostgreSQL + Prisma)

---

## Resumen Ejecutivo

El proyecto ALEX se encuentra en un estado funcional a nivel prototipo con arquitetura correctamente separada. El backend está operativo y expone múltiples capacidades (autenticación, chat IA, gestión de sesiones, auditoría). El frontend está conectado a los endpoints básicos (registro, login, chat) pero tiene inconsistencias críticas de integración que bloquean el funcionamiento correcto. Existen rutas duplicadas en el backend, un controlador logout no implementado, y el frontend no consume varias capacidades ya disponibles en el backend. La base de datos está correctamente modelada pero requiere inicialización con datos de rol por defecto. El proyecto requiere correcciones inmediatas en la capa de integración antes de agregar nuevas funcionalidades.

---

## Frontend — Hallazgos

### 1. Conflicto de Archivos Duplicados: App.js vs App.jsx
**Archivo afectado:** `/frontend/src/App.js` y `/frontend/src/App.jsx`  
**Problema:** Existen dos archivos que representan el mismo componente: `App.jsx` contiene el código real y `App.js` es un re-export de `App.jsx`. Esto es redundante y puede causar confusión al mantener el código.  
**Por qué es problema:** En proyectos Vite/React, el estándar es usar una única extensión (.jsx para JSX o .js para JavaScript). La existencia de ambas puede causar importaciones erróneas y dificultad en la navegación del proyecto.

### 2. Ruta API Inconsistente en Chat.jsx
**Archivo afectado:** `/frontend/src/pages/Chat.jsx` línea 34  
**Problema:** El frontend llama a `api.post('/api/ai/guidance', ...)` pero el backend en `app.js` registra la ruta como `app.use("/api/ai", router)` donde router contiene `router.post("/guidance", ...)`. Esto resulta en una ruta final de `/api/ai/guidance`, que es correcto. Sin embargo, el endpoint no tiene middleware de autenticación aplicado, lo que permite que usuarios no autenticados accedan al chat.  
**Por qué es problema:** La ruta protegida `/chat` requiere autenticación, pero el endpoint de IA no la valida. Esto rompe la premisa de seguridad de que solo usuarios autenticados pueden hacer consultas de IA.

### 3. Prefijo de Ruta Inconsistente: /auth vs Rutas de Servicio
**Archivo afectado:** `/frontend/src/context/AuthContext.jsx` líneas 49 y 57  
**Problema:** El frontend llama a `/auth/register` y `/auth/login`, pero el backend en `setAuthRoutes()` registra estas rutas con prefijo `/auth`, resultando en `/auth/register` y `/auth/login`. En cambio, las rutas de IA usan `/api/ai/guidance`. La inconsistencia en nomenclatura de prefijos hace que no sea claro cuál es la convención esperada.  
**Por qué es problema:** Falta de consistencia en la estructura de rutas API. Las rutas de autenticación no siguen el patrón `/api/auth/...` como debería ser.

### 4. Ausencia de Protección en Endpoints de Chat IA
**Archivo afectado:** `/frontend/src/pages/Chat.jsx` y `/backend/express-ts-openai/src/services/routes/ai.routes.js`  
**Problema:** El endpoint `/api/ai/guidance` no tiene middleware `verifyToken` aplicado. El frontend intenta usarlo desde una ruta protegida, pero el backend no valida que el usuario esté autenticado antes de procesar la consulta de IA.  
**Por qué es problema:** Vulnerabilidad de seguridad. Cualquier cliente que conozca la URL puede enviar consultas sin autenticación, consumiendo recursos de IA innecesariamente.

### 5. Variable de Entorno Faltante: .env del Frontend
**Archivo afectado:** `/frontend/.env.example`  
**Problema:** El archivo `.env.example` contiene `VITE_API_BASE_URL=http://localhost:3000`, pero el frontend no tiene un archivo `.env` real. En entorno de Docker, esto debería apuntar a `http://backend:3000` o similares, no a localhost.  
**Por qué es problema:** En Docker Compose, `localhost` desde dentro de un contenedor hace referencia al contenedor mismo, no al servicio backend. El frontend no podrá conectar con el backend en producción o en entorno Dockerizado.

### 6. Configuración de Vite sin Proxy Explícito
**Archivo afectado:** `/frontend/vite.config.js`  
**Problema:** El archivo `vite.config.js` no define un proxy para reescribir peticiones a `/api/...` hacia el backend. El frontend está configurado para apuntar directamente a través de la variable `VITE_API_BASE_URL`, lo que funciona en desarrollo pero es frágil.  
**Por qué es problema:** Sin proxy en Vite, cualquier cambio de URL del backend requiere actualizar la variable de entorno. Además, no hay encapsulación de la lógica de ruteo.

### 7. Manejo Genérico de Errores sin Contexto
**Archivo afectado:** `/frontend/src/services/api.js` línea 24-29  
**Problema:** La función `getApiError()` intenta extraer el error de varias propiedades (`error.response.data.message`, `error.response.data.error`, `error.message`) pero no maneja estructuras anidadas ni valida el tipo de la respuesta. Si el backend devuelve un error con estructura diferente, el usuario verá "Ocurrio un error inesperado".  
**Por qué es problema:** Debugging difícil cuando algo falla. El usuario no sabrá qué fue mal realmente.

### 8. Falta de Reintentos en Peticiones Fallidas
**Archivo afectado:** `/frontend/src/pages/Chat.jsx` línea 34-41  
**Problema:** Si la petición al endpoint `/api/ai/guidance` falla, no hay mecanismo de reintentos. El usuario solo ve un error sin poder reintentar automáticamente.  
**Por qué es problema:** En redes inestables o con servicios temporalmente no disponibles, la experiencia es pobre. Las peticiones de IA pueden tomar tiempo y es buena práctica tener reintentos.

### 9. Nombre de Campo Inconsistente en Login: correo vs email
**Archivo afectado:** `/frontend/src/pages/Login.jsx` línea 25 y `/frontend/src/context/AuthContext.jsx` línea 57  
**Problema:** El formulario de login usa el campo `email` en el estado (`formData.email`), pero el backend espera `correo` según el modelo Prisma. El login funciona porque ambos campos se mapean a la columna `correo` en la BD, pero el backend aún recibe `email` del frontend.  
**Por qué es problema:** Inconsistencia semántica. El backend acepta `email` aunque su modelo interno usa `correo`. Esto puede confundir a futuros desarrolladores.

### 10. Validación de Contraseña Mínima Solo en Frontend
**Archivo afectado:** `/frontend/src/pages/Register.jsx` línea 42  
**Problema:** El frontend valida `minLength={8}` en el input de contraseña, pero es una validación HTML5. El backend no tiene validación de longitud mínima de contraseña en el controlador `register()`.  
**Por qué es problema:** Un cliente malicioso puede bypassear la validación del frontend y enviar contraseñas cortas al backend.

---

## Backend — Hallazgos

### 1. Duplicidad de Rutas: /src/routes/ vs /src/services/routes/
**Archivos afectados:** `/backend/express-ts-openai/src/routes/auth.routes.js` y `/backend/express-ts-openai/src/services/routes/auth.routes.js`  
**Problema:** Existen dos directorios de rutas: uno en `/src/routes/` y otro en `/src/services/routes/`. En `app.js` se importan las rutas del directorio `/services/routes/`, pero el directorio `/src/routes/` contiene código que nunca se ejecuta. Esto crea confusión sobre cuál es la fuente de verdad.  
**Por qué es problema:** Mantenibilidad. Los desarrolladores pueden editar el archivo incorrecto sin darse cuenta. El código muerto consume espacio y confunde.

### 2. Controlador logout No Implementado
**Archivos afectados:** `/backend/express-ts-openai/src/routes/auth.routes.js` línea 34 y `/backend/express-ts-openai/src/services/controllers/auth.controller.js`  
**Problema:** La ruta POST `/auth/logout` intenta importar y usar `logout` desde `auth.controller.js`, pero el método no está definido en la clase `AuthController`. Solo están implementados `register` y `login`.  
**Por qué es problema:** Si el frontend (o cualquier cliente) intenta hacer logout, recibirá un error de "logout is not defined". La sesión no será cerrada correctamente en la BD.

### 3. Middleware de Autenticación No Aplicado a Rutas de IA
**Archivos afectados:** `/backend/express-ts-openai/src/services/routes/ai.routes.js`  
**Problema:** La ruta `/api/ai/guidance` (que llamará a `chatWithAI`) no tiene el middleware `verifyToken` aplicado. Cualquiera puede hacer una solicitud POST sin token.  
**Por qué es problema:** Seguridad. El chat de IA debería estar protegido para usuarios autenticados solamente. Además, sin usuario autenticado, es difícil auditar quién hizo cada consulta.

### 4. Inconsistencia en Estructura de Respuesta JSON
**Archivos afectados:** `/backend/express-ts-openai/src/services/controllers/auth.controller.js` y `/backend/express-ts-openai/src/services/controllers/ai.controller.js`  
**Problema:**
- En `auth.controller.js`, el login devuelve: `{ message: "...", token: "...", user: { idusuario, nombre, correo, idrol } }`
- En `ai.controller.js`, el chatWithAI devuelve: `{ success: true, data: { respuesta: "..." } }`
Las estructuras son completamente diferentes. Algunas usan `success`, otras `message`, algunas usan `data` anidado.  
**Por qué es problema:** El frontend debe tener lógica especial para cada tipo de respuesta. Falta de consistencia en API.

### 5. El Campo "respuesta" no Sigue Convención de Nomenclatura
**Archivo afectado:** `/backend/express-ts-openai/src/services/controllers/ai.controller.js` línea 14  
**Problema:** La respuesta de IA se devuelve en un campo llamado `respuesta`, pero en otras partes del código se usan camelCase (token, user, success). Debería ser `response` o `answer` en inglés o consistently `respuesta` en Spanish.  
**Por qué es problema:** Inconsistencia de nomenclatura en toda la API.

### 6. Constructor de AuthController Innecesario
**Archivo afectado:** `/backend/express-ts-openai/src/services/controllers/auth.controller.js` líneas 5-8  
**Problema:** El constructor vincula explícitamente `this.register` y `this.login`, pero estos métodos nunca se usan con `this`. La clase se exporta como instancia singleton pero el binding es innecesario.  
**Por qué es problema:** Código innecesario que añade complejidad sin valor. Debería ser métodos estáticos o funciones simples.

### 7. Campos de Prisma Mapeados Inconsistentemente
**Archivo afectado:** `/backend/express-ts-openai/prisma/schema.prisma`  
**Problema:** El modelo `Usuario` mapea campos a nombres diferentes en la BD: `id_usuario` → `idusuario`, `id_rol` → `idrol`, `password_hash` → `passwordhash`, etc. En el controlador de login, se devuelven campos con diferentes formas: `idusuario`, `idrol` en la respuesta. El frontend normaliza estos nombres en `AuthContext.jsx` con la función `normalizeUser()`.  
**Por qué es problema:** Complica el código y dificulta el debugging. Los nombres en la BD no coinciden con los del modelo ORM.

### 8. Ausencia de Validación de Entrada en Controladores
**Archivo afectado:** `/backend/express-ts-openai/src/services/controllers/auth.controller.js` líneas 15-18 y 92-95  
**Problema:** Se valida que los campos existan (`!nombre || !email || !password`) pero no se valida:
- Formato válido de email (regex)
- Longitud mínima de contraseña
- Caracteres especiales o inyección SQL
- Campos extra no esperados (spray attack)  
**Por qué es problema:** Vulnerabilidades de seguridad. Aunque Prisma previene inyección SQL, la validación de datos de entrada es una práctica esencial.

### 9. JWT_SECRET Puede No Estar Configurado
**Archivo afectado:** `/backend/express-ts-openai/src/middlewares/auth.middleware.js` línea 7 y `/backend/express-ts-openai/src/services/controllers/auth.controller.js` línea 106  
**Problema:** Se define una constante `JWT_SECRET` con fallback a `'alex_super_secret_key_2026'`, y en el controlador se verifica si `JWT_SECRET` existe en env, pero la verificación de la ruta de logout usa el middleware que tiene su propio JWT_SECRET con fallback diferente.  
**Por qué es problema:** Inconsistencia. Si JWT_SECRET no está en env, ambos usarán diferentes valores (o el mismo valor hardcoded inseguro). Debería haber una única fuente de verdad.

### 10. Logs en Consola sin Nivel de Severidad
**Archivo afectado:** Múltiples archivos (prisma.client.js, gemini.service.js, auth.controller.js, ai.controller.js)  
**Problema:** Todos los logs usan `console.log()` o `console.error()` sin ningún nivel de severidad estructurado. En producción, esto dificulta filtrar logs importantes.  
**Por qué es problema:** Operabilidad. Logs desestructurados no ayudan a monitoreo en producción.

### 11. El Endpoint /api/ai/Guidance No Valida Longitud de Prompt
**Archivo afectado:** `/backend/express-ts-openai/src/services/controllers/ai.controller.js` líneas 5-7  
**Problema:** Se valida que `prompt` exista, pero no se valida:
- Longitud máxima (podría ser un ataque de negación de servicio)
- Prompts vacíos o solo espacios en blanco
- Longitud mínima para que la IA haga algo útil  
**Por qué es problema:** Sin límites, un usuario malicioso podría enviar prompts enormes y causar timeout o alto consumo de API de Gemini.

### 12. Respuesta del Registro No Incluye Token
**Archivo afectado:** `/backend/express-ts-openai/src/services/controllers/auth.controller.js` línea 56  
**Problema:** El endpoint `/auth/register` devuelve el usuario registrado pero NO devuelve un token JWT. El frontend espera recibir un usuario pero no un token. Después del registro, el usuario debe hacer login por separado.  
**Por qué es problema:** Flujo de UX incómodo. Sería mejor devolver un token inmediatamente después del registro para auto-loguear al usuario.

### 13. Falta Handling de Sesión Duplicada
**Archivo afectado:** `/backend/express-ts-openai/src/services/controllers/auth.controller.js` línea 117  
**Problema:** En cada login, se crea una nueva sesión sin verificar si ya existe una sesión activa para ese usuario. Con muchos logins, la tabla `sesiones` crecerá indefinidamente.  
**Por qué es problema:** Bloat de BD. No hay limpieza de sesiones antiguas.

---

## Conexión Front-Back — Hallazgos

### 1. Inconsistencia en Prefijo de Rutas: /auth vs /api/auth
**Afectados:** `/frontend/src/context/AuthContext.jsx` y `/backend/express-ts-openai/src/services/routes/auth.routes.js`  
**Problema:** El frontend llama a `/auth/login` y `/auth/register`, pero la ruta se registra sin el prefijo `/api`. En cambio, las rutas de IA usan `/api/ai/...`. Esto crea una inconsistencia: algunas rutas tienen `/api` y otras no.  
**Por qué es problema:** Confusión sobre la convención de API. Debería ser `/api/auth/...` para todas las rutas de autenticación.

### 2. CORS Configuration Sin Validación Explícita del Frontend
**Afectados:** `/backend/express-ts-openai/src/services/app.js` y `/frontend/vite.config.js`  
**Problema:** El backend permite CORS desde `http://localhost:5173` (hardcoded), pero no hay forma de cambiar esto sin editar el código fuente. La variable de entorno `FRONTEND_ORIGIN` es leída pero si no existe, se silencia.  
**Por qué es problema:** En entornos Dockerizados o de producción, `localhost` no funciona. El frontend está en `http://frontend:5173` (nombre de servicio en Docker), no en `localhost`.

### 3. Token JWT Almacenado en localStorage Sin HttpOnly
**Afectados:** `/frontend/src/context/AuthContext.jsx` línea 37 y `/frontend/src/services/api.js` línea 11  
**Problema:** El token JWT se almacena en `localStorage`, que es accesible desde JavaScript. Cualquier script XSS puede robar el token.  
**Por qué es problema:** Vulnerabilidad de seguridad. Los tokens sensibles deben almacenarse en cookies HttpOnly (inaccesibles desde JavaScript).

### 4. Frontend No Maneja Expiración de Token JWT
**Archivos afectados:** `/frontend/src/services/api.js` y `/frontend/src/context/AuthContext.jsx`  
**Problema:** Si un token expira (24h en backend), el frontend no lo detecta automáticamente. El usuario seguirá intentando hacer llamadas con un token expirado hasta que el servidor rechace la solicitud.  
**Por qué es problema:** Experiencia de usuario pobre. El frontend debería preemptivamente verificar la expiración o tener mecanismo de refresh token.

### 5. Inconsistencia en Nombres de Campos de Usuario
**Afectados:** `/backend/express-ts-openai/src/services/controllers/auth.controller.js` línea 132 y `/frontend/src/context/AuthContext.jsx` línea 9-14  
**Problema:** El backend devuelve `idusuario`, `idrol`, `correo` pero el frontend normaliza esto a `id`, `idRol`, `correo` (camelCase vs snake_case).  
**Por qué es problema:** Fragmentación de datos. Cada capa debe conocer la transformación, lo que añade complejidad.

### 6. No Hay Mecanismo de Refresh Token
**Afectados:** Backend entero y frontend entero  
**Problema:** Los tokens JWT expiran en 24h. No hay endpoint para renovar el token sin hacer login nuevamente.  
**Por qué es problema:** Seguridad: tokens de larga duración son riesgosos. UX: usuario será deslogueado después de 24h aunque el navegador esté abierto.

### 7. El Logout del Frontend No Comunica con Backend
**Afectados:** `/frontend/src/context/AuthContext.jsx` línea 73 y `/frontend/src/components/Navbar.jsx` línea 9  
**Problema:** El frontend solo borra el token local (`clearSession()`) pero NO hace una llamada al endpoint `/auth/logout` para invalidar la sesión en la BD.  
**Por qué es problema:** La sesión sigue siendo válida en la BD. Un atacante con acceso al token podría seguir usándolo después de que el usuario cree que cerró sesión.

### 8. Variable de Entorno del Backend No Se Propaga Correctamente a Docker
**Afectados:** `/docker-compose.yml` línea 26  
**Problema:** En docker-compose.yml, el backend carga `.env` desde `./backend/express-ts-openai/.env`, pero el frontend intenta cargar desde `.env` (raíz del proyecto). Los nombres y ubicaciones no son consistentes.  
**Por qué es problema:** Confusión sobre dónde van las variables. El frontend en Docker no tendrá acceso a `VITE_API_BASE_URL` si está en un archivo `.env` de raíz.

### 9. Handshake de Autenticación Usa Tokens Sin Claims Validables
**Afectados:** `/backend/express-ts-openai/src/services/controllers/auth.controller.js` línea 112  
**Problema:** El JWT se firma con claims `{ sub, email, roleId }` pero en el middleware de verificación, se espera un claim llamado `nombrerol`. Los claims no coinciden.  
**Por qué es problema:** El middleware `verifyRole()` nunca funcionará correctamente porque el JWT no incluye `nombrerol`.

### 10. No Hay Validación de CORS en Peticiones de Preflight
**Afectados:** `/backend/express-ts-openai/src/services/app.js`  
**Problema:** El CORS está configurado pero no hay manejo explícito de peticiones OPTIONS (preflight). Express con CORS middleware debería manejarlo, pero si algo va mal, no hay logs.  
**Por qué es problema:** Debugging difícil si CORS falla.

---

## Capacidades del Backend No Usadas por el Frontend

### 1. Ruta POST /auth/logout
**Descripción:** Cierra la sesión del usuario e invalida su token en la BD.  
**Ubicación:** `/backend/express-ts-openai/src/routes/auth.routes.js` línea 34  
**Estado:** Declarada pero no implementada (falta el método `logout()` en `AuthController`)  
**Por qué el frontend no la usa:** No existe una implementación funcional en el backend.

### 2. Gestión de Sesiones (Tabla sesiones en Prisma)
**Descripción:** El backend crea registros de sesión en la BD con información de IP, user-agent, fecha de inicio/último acceso, y fecha de expiración.  
**Ubicación:** `/backend/express-ts-openai/prisma/schema.prisma` línea 23-32 y `/backend/express-ts-openai/src/services/controllers/auth.controller.js` línea 117-127  
**Estado:** Implementado en backend, no consumido por frontend  
**Por qué el frontend no la usa:** El frontend no tiene interfaz para ver sesiones activas, terminar sesiones remotamente, o ser notificado de login en otro dispositivo.

### 3. Auditoría (Tabla auditoria en Prisma)
**Descripción:** Modelo para registrar cambios en el sistema (quién hizo qué, cuándo, desde qué IP).  
**Ubicación:** `/backend/express-ts-openai/prisma/schema.prisma` línea 51-62  
**Estado:** Modelo existe, pero no hay endpoints en el backend para crear o consultar auditoría  
**Por qué el frontend no la usa:** No hay API para acceder a logs de auditoría.

### 4. Notificaciones (Tabla notificaciones en Prisma)
**Descripción:** Sistema de notificaciones por usuario con tipos y marca de lectura.  
**Ubicación:** `/backend/express-ts-openai/prisma/schema.prisma` línea 64-71  
**Estado:** Modelo existe, pero no hay endpoints en el backend para enviar o consultar notificaciones  
**Por qué el frontend no la usa:** No hay API.

### 5. Registros (Tabla registros en Prisma)
**Descripción:** Modelo para guardar registros/casos de primeros auxilios con título, descripción, categoría.  
**Ubicación:** `/backend/express-ts-openai/prisma/schema.prisma` línea 41-49  
**Estado:** Modelo existe, pero no hay endpoints  
**Por qué el frontend no la usa:** No hay API.

### 6. Reportes (Tablas reportes y reportes_programados en Prisma)
**Descripción:** Sistema para crear y programar reportes.  
**Ubicación:** `/backend/express-ts-openai/prisma/schema.prisma` línea 73-87  
**Estado:** Modelos existen, pero no hay endpoints  
**Por qué el frontend no la usa:** No hay API.

### 7. Servicio OpenAI (openai.service.js)
**Descripción:** Clase `OpenAIService` con método `getMedicalGuidance()` para consultas a ChatGPT/GPT-4o.  
**Ubicación:** `/backend/express-ts-openai/src/services/openai.service.js`  
**Estado:** Implementado, pero no hay ruta que lo use  
**Por qué el frontend no la usa:** El endpoint de chat usa Gemini, no OpenAI. OpenAI nunca se integró en una ruta.

### 8. Validación de Rol (Middleware verifyRole)
**Descripción:** Middleware para proteger rutas basadas en rol de usuario.  
**Ubicación:** `/backend/express-ts-openai/src/middlewares/auth.middleware.js` línea 50-77  
**Estado:** Implementado pero no se usa en ninguna ruta  
**Por qué el frontend no la usa:** No hay rutas protegidas por rol.

### 9. Endpoint GET / (Health Check)
**Descripción:** Retorna estado del servidor con versión.  
**Ubicación:** `/backend/express-ts-openai/src/services/app.js` línea 31-36  
**Estado:** Implementado, puede usarse para verificar conectividad  
**Por qué el frontend no la usa:** No hay necesidad explícita, pero podría usarse para detectar desconexión.

### 10. Actualización de último_login en Base de Datos
**Descripción:** Cada login actualiza el campo `ultimo_login` del usuario.  
**Ubicación:** `/backend/express-ts-openai/src/services/controllers/auth.controller.js` línea 129-131  
**Estado:** Implementado, el frontend podría mostrar esto en un panel de usuario  
**Por qué el frontend no la usa:** No hay interfaz de perfil de usuario que muestre esta información.

---

## Prioridades de Corrección

### 1. **BLOQUEANTE — Implementar Método logout() en AuthController**
**Severidad:** Alta  
**Razón:** El frontend intenta hacer logout, pero el backend no tiene el método implementado. Esto causa errores 500 en runtime. Bloquea la funcionalidad básica de autenticación.  
**Impacto:** Usuarios no pueden cerrar sesión correctamente. Sessions se acumulan en la BD sin límite.  
**Acción:** Implementar el método `logout()` que invalide la sesión en BD y retorne confirmación.

### 2. **BLOQUEANTE — Agregar Middleware de Autenticación a /api/ai/guidance**
**Severidad:** Alta  
**Razón:** Cualquiera puede consultar la IA sin token. Vulnerabilidad de seguridad y consumo no controlado de API.  
**Impacto:** Abuso de recurso, falta de auditoría, posible costo alto en APIs de terceros.  
**Acción:** Aplicar `verifyToken` middleware a la ruta de chat.

### 3. **BLOQUEANTE — Unificar Estructura de Respuesta JSON en Toda la API**
**Severidad:** Alta  
**Razón:** El frontend debe tener lógica diferente para cada tipo de respuesta (auth vs ai). Esto es error-prone.  
**Impacto:** Código duplicado en frontend, dificultad para agregar nuevos endpoints.  
**Acción:** Definir estándar único: `{ success: boolean, message: string, data?: object, error?: string }` en todos los endpoints.

### 4. **BLOQUEANTE — Eliminar Duplicidad de Rutas (src/routes vs src/services/routes)**
**Severidad:** Alta  
**Razón:** Confusión sobre cuál es la fuente de verdad. Los desarrolladores pueden editar el archivo incorrecto.  
**Impacto:** Inconsistencia, bugs difíciles de trackear.  
**Acción:** Eliminar `/src/routes/` completamente y mantener solo `/src/services/routes/`.

### 5. **CRÍTICA — Estandarizar Prefijo de Rutas a /api/**
**Severidad:** Alta  
**Razón:** `/auth` no tiene `/api` pero `/api/ai` sí. Inconsistencia en convención.  
**Impacto:** Confusión de arquitectura, documentación incompleta.  
**Acción:** Cambiar `/auth` a `/api/auth` en backend y actualizar frontend.

### 6. **CRÍTICA — Configurar Variables de Entorno Correctas para Docker**
**Severidad:** Alta  
**Razón:** En Docker, `localhost` no funciona. El frontend no puede conectar al backend.  
**Impacto:** Aplicación no funciona en Docker, solo en desarrollo local.  
**Acción:** Actualizar VITE_API_BASE_URL a usar nombre de servicio Docker (`http://backend:3000`). Configurar en docker-compose.yml.

### 7. **CRÍTICA — Validar Longitud Mínima de Contraseña en Backend**
**Severidad:** Media  
**Razón:** La validación está solo en frontend. Backend acepta contraseñas de 1 carácter.  
**Impacto:** Seguridad débil si alguien hace request directo al endpoint.  
**Acción:** Agregar validación de longitud mínima (8-12 caracteres) en `auth.controller.js`.

### 8. **CRÍTICA — Implementar Frontend Logout que Invalide Sesión en Backend**
**Severidad:** Media  
**Razón:** Logout actual solo borra localStorage. Sesión sigue válida en la BD.  
**Impacto:** Usuario cree que cerró sesión pero el token sigue siendo válido.  
**Acción:** Hacer POST a `/api/auth/logout` antes de limpiar localStorage en frontend.

### 9. **IMPORTANTE — Manejar Expiración de Token JWT en Frontend**
**Severidad:** Media  
**Razón:** Token expira en 24h pero frontend no lo detecta. Usuario verá errores sin saber por qué.  
**Impacto:** Experiencia de usuario confusa después de 24h de inactividad.  
**Acción:** Implementar refresh token o detectar expiración con interceptor de Axios.

### 10. **IMPORTANTE — Agregar Validación de Entrada en Backend**
**Severidad:** Media  
**Razón:** No hay validación de formato de email, longitud mínima, caracteres especiales, etc.  
**Impacto:** Posibles vulnerabilidades de inyección o formato inválido en BD.  
**Acción:** Usar librería como `joi` o `zod` para validar esquemas en todos los endpoints.

### 11. **IMPORTANTE — Eliminar Archivo App.js Duplicado**
**Severidad:** Baja  
**Razón:** Redundancia y confusión.  
**Impacto:** Confusión de mantenibilidad.  
**Acción:** Mantener solo `App.jsx`, eliminar `App.js`.

### 12. **IMPORTANTE — Configurar Almacenamiento de Token en HttpOnly Cookies**
**Severidad:** Media  
**Razón:** localStorage es vulnerable a XSS.  
**Impacto:** Tokens pueden ser robados por scripts maliciosos.  
**Acción:** Cambiar a cookies HttpOnly (requiere cambio en backend para enviarlas).

### 13. **MEJORA — Crear Endpoints para Auditoría, Notificaciones y Reportes**
**Severidad:** Baja  
**Razón:** Modelos existen pero no hay endpoints.  
**Impacto:** Funcionalidades no aprovechadas.  
**Acción:** Crear CRUD endpoints para cada modelo que deseas exponer.

### 14. **MEJORA — Integrar Endpoint de OpenAI en Alternativa a Gemini**
**Severidad:** Baja  
**Razón:** `openai.service.js` está implementado pero no se usa.  
**Impacto:** Inversión de desarrollo no aprovechada.  
**Acción:** Agregar parámetro opcional al endpoint `/api/ai/guidance` para elegir proveedor (gemini o openai).

### 15. **MEJORA — Implementar Logs Estructurados**
**Severidad:** Baja  
**Razón:** Todos los logs son console.log/error sin nivel de severidad.  
**Impacto:** Debugging y monitoreo difícil en producción.  
**Acción:** Usar librería como `winston` o `pino` para logs estructurados.

---

## Notas Finales

- **Base de datos:** Está correctamente modelada pero requiere inicialización con un registro de rol por defecto (`INSERT INTO roles (id_rol, nombre_rol) VALUES (1, 'usuario');`).
- **Docker:** La configuración en docker-compose.yml es correcta pero requiere variables de entorno adecuadas para que funcione.
- **Autenticación:** El flujo JWT está implementado pero tiene vulnerabilidades (sin refresh token, sin HttpOnly cookies) que deben corregirse antes de producción.
- **Próximas etapas:** Después de resolver los hallazgos de la sección "BLOQUEANTE", el proyecto está listo para agregar más funcionalidades (auditoría, notificaciones, reportes, etc.) sin riesgo de romper lo existente.

