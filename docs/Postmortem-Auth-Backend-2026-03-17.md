# Postmortem tecnico - Error 500 en registro de usuario

Fecha: 2026-03-17
Proyecto: ALEX backend (Express + Prisma + PostgreSQL)

## Resumen del incidente

Durante las pruebas de los endpoints de autenticacion (`POST /auth/register` y `POST /auth/login`), el backend devolvia 500 y no se persistian datos en la base.

Error observado por API:

- `Ocurrio un error al registrar el usuario.`
- `Invalid prisma.usuario.findUnique() invocation`
- `The column existe does not exist in the current database.`

## Causas raiz

1. Desincronizacion entre Prisma schema, Prisma Client y la API
- Habia mas de un contexto de Prisma en el repo (`backend` y `backend/express-ts-openai`).
- Se generaba cliente en una ruta distinta a la que consumia la API.
- Hubo mezcla de versiones (5.x y 6.x) durante el proceso de depuracion.

2. Inconsistencia de nombres de campos entre schema y controlador
- El schema efectivo de Prisma quedo con nombres en snake_case (ejemplo: `id_usuario`, `password_hash`, `nombre_rol`).
- El controlador usaba nombres antiguos en camel/simple (ejemplo: `idusuario`, `passwordhash`, `nombrerol`).

3. Confusion de variables de entorno por duplicidad de `.env`
- Existian `.env` en raiz y en `backend/express-ts-openai`.
- El backend ejecutado desde `backend/express-ts-openai` solo lee su `.env` local.

## Que se cambio

### 1) Endpoints y auth real
Se crearon y conectaron rutas/controlador de autenticacion.

Archivos:
- `backend/express-ts-openai/src/services/routes/auth.routes.js`
- `backend/express-ts-openai/src/services/controllers/auth.controller.js`
- `backend/express-ts-openai/src/services/app.js`

Implementacion:
- Register: validacion de payload, correo unico, hash de password, insercion de usuario.
- Login: validacion de credenciales, JWT, registro de sesion, actualizacion de ultimo login.

### 2) Prisma local para la API
Se fijo el uso de schema local en el paquete de la API.

Archivo:
- `backend/express-ts-openai/package.json`

Cambio clave:
- Se agrego bloque `prisma.schema = "prisma/schema.prisma"`.

### 3) Schema Prisma local en la API
Se establecio un schema local en:
- `backend/express-ts-openai/prisma/schema.prisma`

Con nombres reales en snake_case:
- `Usuario.id_usuario`
- `Usuario.password_hash`
- `Rol.nombre_rol`
- `Sesion.fecha_inicio`, `Sesion.user_agent`, etc.

### 4) Ajuste del controlador al schema real
Archivo:
- `backend/express-ts-openai/src/services/controllers/auth.controller.js`

Ajustes principales:
- `nombrerol` -> `nombre_rol`
- `idrol` -> `id_rol`
- `passwordhash` -> `password_hash`
- `idusuario` -> `id_usuario`
- `fecharegistro` -> `fecha_registro`
- `ultimologin` -> `ultimo_login`
- `sesion`: `idusuario/fechainicio/ultimaactividad/fechaexpiracion/useragent` -> `id_usuario/fecha_inicio/ultima_actividad/fecha_expiracion/user_agent`

### 5) Diagnostico mas claro en errores HTTP
Se agrego `details` en respuestas 500 del auth controller para reducir tiempo de depuracion.

## Estado final

- Prisma Client generado correctamente para la API (`v6.19.2`) en su propio `node_modules`.
- Consulta de prueba Prisma (`findUnique`) devolvio `OK null` sin excepcion, confirmando cliente funcional.
- Error de columna inexistente resuelto por sincronizacion de schema/cliente y ajuste del controlador.

## Checklist de arranque estable (backend)

Desde `backend/express-ts-openai`:

1. Verificar `.env` local con al menos:
- `DATABASE_URL=...`
- `JWT_SECRET=...`
- `PORT=3000`

2. Instalar dependencias:
- `npm install`

3. Generar Prisma Client (schema local):
- `npx prisma generate`

4. Levantar backend:
- `npm run start`

5. Probar endpoints:
- `POST /auth/register`
- `POST /auth/login`

## Riesgos conocidos / notas

1. Rol por defecto
- `register` requiere que exista rol `usuario` en tabla `roles` (campo `nombre_rol`).
- Si no existe, respondera error 500 con mensaje de configuracion.

2. Duplicidad de `.env`
- Mantener como fuente de verdad: `backend/express-ts-openai/.env`.
- Evitar depender de `.env` en raiz para este backend.

3. Prisma 7
- Aparece warning deprecando `package.json#prisma`.
- A futuro migrar a `prisma.config.ts` cuando se planifique upgrade.

## Comando recomendado para resync rapido

En `backend/express-ts-openai`:

- `npx prisma db pull --schema prisma/schema.prisma`
- `npx prisma generate`

Esto vuelve a alinear cliente con la BD si cambia el esquema fisico.
