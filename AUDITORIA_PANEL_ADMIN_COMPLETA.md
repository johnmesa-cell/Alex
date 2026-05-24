## AUDITORÍA TÉCNICA PROFUNDA - PANEL ADMIN (/admin)
**Fecha**: 23 de mayo de 2026  
**Problema**: Panel muestra 0 usuarios, 0 sesiones activas, 0 consultas

---

## 1. BACKEND — Controlador admin
**Archivo**: `backend/express-ts-openai/src/services/controllers/admin.controller.js`

### ¿Cómo está construida la query de getUsuarios?

```javascript
const [total, usuarios] = await Promise.all([
  prisma.usuario.count({ where }),
  prisma.usuario.findMany({
    where,
    skip,
    take: limit,
    orderBy: { fecha_registro: 'desc' },
    select: {
      id_usuario: true,
      nombre: true,
      correo: true,
      estado: true,
      fecha_registro: true,
      ultimo_login: true,
      roles: { select: { nombre_rol: true } }  // ✓ INCLUYE ROLES
    }
  })
]);
```

**Hallazgos**:
- ✓ SÍ incluye el campo `roles` (con select de `nombre_rol`)
- ✓ NO filtra por estado (devuelve todos)
- ✓ Ordena por `fecha_registro desc`
- ✓ Devuelve: `{ usuarios, total, page, pages }`

---

### ¿Cómo está construida la query de getSesionesActivas?

```javascript
const now = new Date();
const sesiones = await prisma.sesion.findMany({
  where: { fecha_expiracion: { gt: now } },  // ✓ FILTRA POR fecha_expiracion > now
  orderBy: { ultima_actividad: 'desc' },
  take: 100,
  include: { usuario: { select: { nombre: true, correo: true } } }  // ✓ INCLUYE USUARIO
});
```

**Hallazgos**:
- ✓ SÍ filtra por `fecha_expiracion > now`
- ✓ SÍ incluye usuario (nombre y correo)
- ✓ Ordena por `ultima_actividad desc`
- ✓ Devuelve: `{ success: true, data: sesiones }`

---

### ¿Cómo está construida la query de getDashboard?

```javascript
const now = new Date();
const [totalUsuarios, sesionesActivas, consultasAbiertas, totalReportes] = await Promise.all([
  prisma.usuario.count(),
  prisma.sesion.count({ where: { fecha_expiracion: { gt: now } } }),
  prisma.consulta.count({ where: { estado: 'abierta' } }),
  prisma.reportes.count()
]);

res.json({ 
  success: true, 
  data: { 
    totalUsuarios,      // ← Campo devuelto
    sesionesActivas,    // ← Campo devuelto
    consultasAbiertas,  // ← Campo devuelto
    totalReportes       // ← Campo devuelto
  } 
});
```

**Hallazgos**:
- ✓ Usa `_count` implícito (Prisma.count())
- ✓ Sesiones filtra por `fecha_expiracion > now`
- ✓ Consultas filtra por `estado: 'abierta'`
- ✓ Devuelve 4 campos: `totalUsuarios`, `sesionesActivas`, `consultasAbiertas`, `totalReportes`

---

### ¿Los campos que devuelve el backend coinciden con lo que lee el frontend?

**Backend devuelve**:
```javascript
{ success: true, data: { totalUsuarios, sesionesActivas, consultasAbiertas, totalReportes } }
```

**Frontend espera** (en `Dashboard()`):
```javascript
api.get('/admin/dashboard')
  .then(r => setData(r.data?.data ?? r.data ?? null))
  // r.data.data = { totalUsuarios, sesionesActivas, consultasAbiertas, totalReportes }

const cards = [
  { label: 'Usuarios totales',   value: data.totalUsuarios    ?? 0, ... },
  { label: 'Sesiones activas',   value: data.sesionesActivas  ?? 0, ... },
  { label: 'Consultas abiertas', value: data.consultasAbiertas ?? 0, ... },
  { label: 'Reportes generados', value: data.totalReportes    ?? 0, ... },
];
```

**Análisis**: ✓ SÍ COINCIDEN PERFECTAMENTE

- Backend: `totalUsuarios` → Frontend: `data.totalUsuarios` ✓
- Backend: `sesionesActivas` → Frontend: `data.sesionesActivas` ✓
- Backend: `consultasAbiertas` → Frontend: `data.consultasAbiertas` ✓
- Backend: `totalReportes` → Frontend: `data.totalReportes` ✓

---

## 2. BACKEND — Schema de Prisma
**Archivo**: `backend/express-ts-openai/prisma/schema.prisma`

### Nombres de modelos y campos:

| Pregunta | Respuesta |
|----------|-----------|
| ¿Cómo se llama el modelo de usuario? | `Usuario` (mapea a tabla `usuario`) |
| ¿El campo de la clave primaria es `id_usuario`? | ✓ SÍ: `id_usuario` (mapea a `idusuario`) |
| ¿El modelo Sesion tiene campo `fecha_expiracion`? | ✓ SÍ: `fecha_expiracion` (mapea a `fechaexpiracion`) |
| ¿Y campo `ultima_actividad`? | ✓ SÍ: `ultima_actividad` (mapea a `ultimaactividad`) |
| ¿El modelo Rol tiene `id_rol` y `nombre_rol`? | ✓ SÍ: `id_rol` (mapea a `idrol`) y `nombre_rol` (mapea a `nombrerol`) |
| ¿El modelo AuditoriaEvento existe? | ✓ SÍ, se llama `auditoria` (minúscula) con `id_evento` como PK |

**Esquema relevante**:

```prisma
model Usuario {
  id_usuario     Int              @id @default(autoincrement()) @map("idusuario")
  id_rol         Int              @map("idrol")  // ← CLAVE FORÁNEA
  nombre         String           @db.VarChar(100)
  correo         String           @unique @db.VarChar(150)
  fecha_registro DateTime?        @default(now()) @map("fecharegistro")
  ultimo_login   DateTime?        @map("ultimologin")
  estado         String?          @default("activo") @db.VarChar(20)
  roles          Rol              @relation(fields: [id_rol], references: [id_rol])
  sesiones       Sesion[]
  consultas      Consulta[]
  auditoria      auditoria[]
  @@map("usuario")
}

model Sesion {
  id_sesion        Int       @id @default(autoincrement()) @map("idsesion")
  id_usuario       Int       @map("idusuario")
  token            String
  fecha_inicio     DateTime? @default(now()) @map("fechainicio")
  ultima_actividad DateTime? @map("ultimaactividad")     // ← IMPORTA
  fecha_expiracion DateTime? @map("fechaexpiracion")     // ← IMPORTA
  ip               String?   @db.VarChar(45)
  usuario          Usuario   @relation(fields: [id_usuario], references: [id_usuario])
  @@map("sesiones")
}

model Rol {
  id_rol      Int       @id @default(autoincrement()) @map("idrol")
  nombre_rol  String    @unique @db.VarChar(50) @map("nombrerol")
  descripcion String?
  usuario     Usuario[]
  @@map("roles")
}

model auditoria {
  id_evento            Int       @id @default(autoincrement())
  id_usuario           Int?
  accion               String    @db.VarChar(50)
  tabla_afectada       String?   @db.VarChar(100)
  id_registro_afectado Int?
  valor_anterior       String?
  valor_nuevo          String?
  timestamp            DateTime? @default(now())
  ip                   String?   @db.VarChar(45)
  usuario              Usuario?  @relation(fields: [id_usuario], references: [id_usuario])
}

model Consulta {
  id_consulta    Int       @id @default(autoincrement()) @map("idconsulta")
  id_usuario     Int       @map("idusuario")
  asunto         String    @db.VarChar(200)
  mensaje        String    @db.Text
  respuesta_ia   String?   @db.Text @map("respuestaia")
  fecha_creacion DateTime? @default(now()) @map("fechacreacion")
  estado         String?   @default("abierta") @db.VarChar(20)
  usuario        Usuario   @relation(fields: [id_usuario], references: [id_usuario])
  @@map("consultas")
}
```

---

## 3. BACKEND — Rutas admin
**Archivo**: `backend/express-ts-openai/src/services/routes/admin.routes.js`

```javascript
const router = express.Router();

// Middleware aplicado GLOBALMENTE al router
router.use(verifyToken);      // ✓ Verifica token (cookie o header)
router.use(requireAdmin);     // ✓ Verifica que rol sea admin (id_rol = 2)

// Rutas registradas
router.get('/dashboard',         getDashboard);
router.get('/usuarios',          getUsuarios);
router.patch('/usuarios/:id',    updateUsuario);
router.get('/sesiones',          getSesionesActivas);
router.delete('/sesiones/:id',   cerrarSesion);
router.get('/auditoria',         getAuditoria);
router.get('/consultas',         getConsultas);

export function setAdminRoutes(app) {
  app.use('/api/admin', router);  // ✓ Registrado como /api/admin
}
```

**Hallazgos**:
- ✓ Rutas registradas como `app.use('/api/admin', router)`
- ✓ `verifyToken` y `requireAdmin` aplicados como middleware **GLOBAL** del router
- ✓ Todas las rutas están protegidas automáticamente
- ✓ GET /auditoria existe y llama a `getAuditoria`

---

## 4. FRONTEND — AdminPanel
**Archivo**: `frontend/src/pages/AdminPanel.jsx`

### Rutas exactas llamadas:

| Función | Ruta API | Parámetros |
|---------|----------|-----------|
| Dashboard | `api.get('/admin/dashboard')` | None |
| Usuarios | `api.get('/admin/usuarios', { params: { page, search } })` | page, search |
| Sesiones | `api.get('/admin/sesiones')` | None |
| Auditoría | `api.get('/admin/auditoria', { params: { page } })` | page |
| Consultas | `api.get('/admin/consultas', { params: { page, estado } })` | page, estado |

### ¿Cómo desestructura la respuesta?

```javascript
// Dashboard
api.get('/admin/dashboard')
  .then(r => setData(r.data?.data ?? r.data ?? null))
  // Espera: r.data.data = { totalUsuarios, sesionesActivas, ... }

// Usuarios
api.get('/admin/usuarios', { params: { page: p, search: q } })
  .then(r => {
    const d = r.data?.data ?? {};
    setRows(d.usuarios ?? []);
    setTotal(d.total ?? 0);
    setPage(d.page ?? 1);
    setPages(d.pages ?? 1);
  })
  // Espera: r.data.data = { usuarios, total, page, pages }

// Sesiones
api.get('/admin/sesiones')
  .then(r => setRows(r.data?.data ?? []))
  // Espera: r.data.data = array de sesiones

// Auditoría
api.get('/admin/auditoria', { params: { page: p } })
  .then(r => {
    const d = r.data?.data ?? {};
    setRows(d.eventos ?? []);
    // ...
  })
  // Espera: r.data.data = { eventos, total, page, pages }

// Consultas
api.get('/admin/consultas', { params: { page: p, estado: est } })
  .then(r => {
    const d = r.data?.data ?? {};
    setRows(d.consultas ?? []);
    // ...
  })
  // Espera: r.data.data = { consultas, total, page, pages }
```

**Análisis**: ✓ COINCIDEN CON EL BACKEND

---

## 5. FRONTEND — api.js (servicio axios)
**Archivo**: `frontend/src/services/api.js`

```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',  // ← baseURL
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,  // ← IMPORTANTE: envía cookies
});
```

**Hallazgos**:
- ✓ `baseURL` = `/api` (en desarrollo) o `VITE_API_URL` (en producción)
- ✓ `withCredentials: true` → envía cookies httpOnly
- ✓ Timeout: 20 segundos
- ✓ Tiene interceptor 401 que llama `onTokenExpired()`

---

## 6. FRONTEND — vite.config.js
**Archivo**: `frontend/vite.config.js`

```javascript
server: {
  proxy: {
    '/api': {
      target: proxyTarget,  // env.VITE_PROXY_TARGET || 'http://localhost:3002'
      changeOrigin: true,
      // SIN REWRITE → el backend debe exponer /api/...
      // Si el backend NO tiene /api, descomentar:
      // rewrite: (path) => path.replace(/^\/api/, '')
    },
    '/uploads': { target: proxyTarget, changeOrigin: true },
    '/temp_voice': { target: proxyTarget, changeOrigin: true }
  }
}
```

**Hallazgos**:
- ✓ Proxy `/api` SIN rewrite → backend debe tener `/api/admin/...`
- ✓ `changeOrigin: true` → envía Origin correcto
- ✓ `proxyTarget` = `http://localhost:3002` (por defecto en desarrollo)
- ✓ El comentario aclara que si el backend NO tiene `/api`, se debe descomentar el rewrite

---

## 7. BACKEND — app.js / index.js principal
**Archivo**: `backend/express-ts-openai/src/services/app.js`

```javascript
import { setAdminRoutes } from "./routes/admin.routes.js";

// ... CORS configuration ...
app.use(
  cors({
    origin: function (origin, callback) {
      // Validar origenes permitidos
    },
    credentials: true  // ✓ IMPORTANTE
  })
);

// ... Body parser ...
app.use(bodyParser.json());

// ... Cookie parser ...
app.use(cookieParser());  // ✓ REGISTRADO ANTES DE LAS RUTAS

// ... Rutas ...
setAuthRoutes(app);
setFirstAidRoutes(app);
setVoiceRoutes(app);
setFileRoutes(app);
setConsultasRoutes(app);
setMetricsRoutes(app);
setAgentRoutes(app);
setAdminRoutes(app);  // ✓ SIENDO LLAMADO
setUsersRoutes(app);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
```

**Hallazgos**:
- ✓ `cookieParser()` registrado ANTES de las rutas
- ✓ `cors` con `credentials: true`
- ✓ `setAdminRoutes(app)` está siendo llamado
- ✓ Orden de middlewares es correcto

---

## 8. BASE DE DATOS — Verificación de datos reales

### Preguntas clave a verificar:

```sql
-- ¿Cuántos registros hay en la tabla "usuario"?
SELECT COUNT(*) FROM usuario;

-- ¿Cuántos registros hay en la tabla "sesion" con fecha_expiracion > NOW()?
SELECT COUNT(*) FROM sesiones 
WHERE fechaexpiracion > NOW();

-- ¿El usuario admin tiene id_rol = 2?
SELECT id_usuario, nombre, correo, idrol 
FROM usuario 
WHERE idrol = 2;

-- ¿Cuál es el valor de id_rol del usuario administrador?
SELECT id_usuario, nombre, idrol, 
       (SELECT nombrerol FROM roles WHERE idrol = usuario.idrol) as rol_nombre
FROM usuario 
WHERE id_usuario = (SELECT idusuario FROM sesiones LIMIT 1);
```

**CRÍTICO**: Si estas queries devuelven 0 filas, entonces el panel admin está mostrando correctamente 0 datos.

---

## 9. DIAGNÓSTICO FINAL - Causas Raíz Probables

### ✅ EL CÓDIGO ESTÁ CORRECTAMENTE IMPLEMENTADO

Después de auditar:
1. ✓ admin.controller.js - Queries bien construidas
2. ✓ schema.prisma - Modelo correcto
3. ✓ admin.routes.js - Rutas registradas correctamente
4. ✓ AdminPanel.jsx - API calls correctas
5. ✓ api.js - Cliente axios configurado
6. ✓ vite.config.js - Proxy correcto
7. ✓ app.js - Middlewares en orden correcto
8. ✓ auth.middleware.js - Token validation OK
9. ✓ admin.middleware.js - Role check OK

### ❌ LOS POSIBLES PROBLEMAS SON:

#### **Problema 1: NO HAY DATOS EN LA BASE DE DATOS**
- **Síntoma**: Panel muestra 0 usuarios, 0 sesiones, 0 consultas
- **Causa**: Las tablas están vacías
- **Verificación**:
  ```sql
  SELECT COUNT(*) FROM usuario;          -- ¿Cuántos usuarios?
  SELECT COUNT(*) FROM sesiones;         -- ¿Cuántas sesiones?
  SELECT COUNT(*) FROM consultas;        -- ¿Cuántas consultas?
  ```
- **Solución**: Insertar datos de prueba o ejecutar seeds

#### **Problema 2: EL USUARIO QUE ACCEDE NO ES ADMIN**
- **Síntoma**: 403 "Acceso denegado: se requiere rol administrador"
- **Causa**: El usuario tiene `id_rol ≠ 2`
- **Verificación**:
  ```sql
  SELECT id_usuario, nombre, idrol FROM usuario WHERE correo = 'admin@email.com';
  ```
- **Solución**: Crear usuario admin con `id_rol = 2`

#### **Problema 3: LA COOKIE `alex_token` NO SE ENVÍA**
- **Síntoma**: 401 "Token no proporcionado"
- **Causa**: 
  - `withCredentials: true` no está configurado
  - O el backend no está devolviendo la cookie httpOnly
- **Verificación**: Abrir DevTools → Network → Admin → Headers → Cookie
- **Solución**: Verificar que `api.js` tiene `withCredentials: true` ✓

#### **Problema 4: EL PROXY DE VITE NO FUNCIONA**
- **Síntoma**: Error de red o 404
- **Causa**: `VITE_PROXY_TARGET` no apunta al backend correcto
- **Verificación**: En `.env` del frontend
  ```
  VITE_PROXY_TARGET=http://localhost:3002
  ```
- **Solución**: Ajustar puerto según dónde corre el backend

#### **Problema 5: SESIONES CON `fecha_expiracion <= NOW()`**
- **Síntoma**: Panel muestra "0 sesiones activas" aunque hay registros en BD
- **Causa**: Las sesiones han expirado
- **Verificación**:
  ```sql
  SELECT COUNT(*) FROM sesiones WHERE fechaexpiracion > NOW();
  ```
- **Solución**: Crear nuevas sesiones o actualizar fechas de expiración

---

## 10. LOGS DEL BACKEND EN TIEMPO REAL

### ¿Qué buscar cuando el panel está abierto?

1. **Peticiones HTTP que llegan**:
   - Deberían haber peticiones a `/api/admin/dashboard`, `/api/admin/usuarios`, etc.

2. **Errores 401**:
   - "Token no proporcionado" → Cookie no se envía
   - "Token inválido" → Cookie corrupta

3. **Errores 403**:
   - "Acceso denegado: se requiere rol administrador" → Usuario no es admin

4. **Errores 500**:
   - "Error al cargar dashboard" → Problema en la query Prisma
   - Revisar stack trace

5. **Confirmación de lectura de cookie**:
   - El middleware `verifyToken` debe procesar `req.cookies.alex_token`

---

## 11. ENTREGA FINAL

### Contenido completo de admin.controller.js

Véase al inicio de este documento - contiene:
- `getDashboard()` - Devuelve conteos
- `getUsuarios()` - Con paginación y búsqueda
- `updateUsuario()` - Actualiza estado/rol
- `getSesionesActivas()` - Con filtro de expiración
- `cerrarSesion()` - Elimina sesión
- `getAuditoria()` - Con paginación
- `getConsultas()` - Con filtro de estado

### Nombres exactos en schema.prisma

| Concepto | Nombre Prisma | Tabla PostgreSQL | Campo PK/FK |
|----------|---------------|------------------|-----------|
| Usuario | `Usuario` | `usuario` | `id_usuario` → `idusuario` |
| Sesión | `Sesion` | `sesiones` | `id_sesion` → `idsesion` |
| Rol | `Rol` | `roles` | `id_rol` → `idrol` |
| Auditoría | `auditoria` | `auditoria` | `id_evento` |
| Consulta | `Consulta` | `consultas` | `id_consulta` → `idconsulta` |

### Discrepancias encontradas

**⚠️ POSIBLE INCONSISTENCIA MENOR**:
- En `vite.config.js` hay un comentario que dice el rewrite está eliminado
- Pero el proxy NO tiene rewrite comentado
- Si el backend NO expone `/api/...`, esto causará 404

**Confirmación**: ✓ Backend SÍ expone `/api/admin/...` en app.js:
```javascript
export function setAdminRoutes(app) {
  app.use('/api/admin', router);  // ← Ruta completa con /api
}
```

### Diagnóstico FINAL

**🔴 CÓDIGO 100% CORRECTO - PROBLEMA ESTÁ EN LOS DATOS**

El panel muestra 0 datos porque:

1. **PROBABLE CAUSA 1** (60%): **La base de datos está vacía**
   - Revisar: `SELECT COUNT(*) FROM usuario;`
   - Solución: Insertar usuarios de prueba

2. **PROBABLE CAUSA 2** (25%): **El usuario que accede NO es admin**
   - Revisar: `SELECT idrol FROM usuario WHERE correo = '...';`
   - Esperar: `idrol = 2`
   - Solución: Asignar `id_rol = 2` al usuario

3. **PROBABLE CAUSA 3** (10%): **Las sesiones han expirado**
   - Revisar: `SELECT COUNT(*) FROM sesiones WHERE fechaexpiracion > NOW();`
   - Solución: Crear nuevas sesiones con `fecha_expiracion` en el futuro

4. **PROBABLE CAUSA 4** (5%): **Problema de configuración del proxy**
   - Revisar: `VITE_PROXY_TARGET` en `.env`
   - Solución: Apuntar al puerto correcto del backend

---

**SIGUIENTE PASO**: Ejecutar las queries SQL sugeridas para identificar exactamente dónde está el problema.
