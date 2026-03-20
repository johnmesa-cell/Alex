# Propuesta de Prototipo Frontend ALEX (Alineada al Backend Existente)

Fecha: 19 de marzo de 2026
Versión: v1
Estado: Lista para ejecución en Sprint

## 1. Resumen Ejecutivo

Esta propuesta define un prototipo frontend funcional en React, alineado con el backend actualmente operativo en el proyecto ALEX. El objetivo es asegurar integración estable sin desajustes de rutas, payloads ni contratos de respuesta.

El alcance v1 prioriza autenticación, chat con IA y navegación por estado de sesión. Los módulos de historial, métricas y catálogo de primeros auxilios se dejan en fase posterior, ya que no están disponibles con el contrato backend activo.

## 2. Objetivo del Prototipo

Construir una interfaz web responsiva que permita:

1. Registro de usuarios.
2. Inicio de sesión con JWT.
3. Interacción con el asistente de IA por texto.
4. Soporte de dictado por voz mediante Web Speech API.
5. Navegación condicional según sesión activa.

## 3. Alcance Funcional v1

Incluye:

1. Home.
2. Login.
3. Register.
4. Chat IA.
5. Navbar inteligente.
6. Manejo de estado de autenticación en cliente.
7. Gestión de errores y estados de carga.

No incluye en v1:

1. Historial de consultas.
2. Dashboard de métricas.
3. Catálogo de primeros auxilios.
4. Endpoint de perfil de usuario autenticado (equivalente a auth me).

## 4. Contrato Backend Real (Fuente de Verdad)

### 4.1 Endpoints disponibles

1. GET /
- Uso: Healthcheck de API.
- Respuesta esperada: message, status, version.

2. POST /auth/register
- Body:
  - nombre
  - email
  - password
- Respuesta esperada:
  - message
  - user: id_usuario, nombre, correo, id_rol, fecha_registro

3. POST /auth/login
- Body:
  - email
  - password
- Respuesta esperada:
  - message
  - token
  - user: idusuario, nombre, correo, idrol

4. POST /api/ai/guidance
- Body:
  - prompt
- Respuesta esperada:
  - success
  - data.respuesta

### 4.2 Endpoints no disponibles actualmente para frontend

1. GET /auth/me
2. GET /api/consultas
3. POST /api/consultas
4. GET /api/primeros-auxilios
5. GET /api/metricas/resumen

## 5. Arquitectura Frontend Propuesta

Stack sugerido para v1:

1. React 18.
2. Vite 5.
3. React Router DOM para rutas.
4. Axios para cliente HTTP e interceptor JWT.
5. CSS modular o Tailwind (opcional) para estilos responsivos.

Estructura base recomendada:

- src/pages
  - Home.jsx
  - Login.jsx
  - Register.jsx
  - Chat.jsx
- src/components
  - Navbar.jsx
  - ProtectedRoute.jsx
- src/context
  - AuthContext.jsx
- src/services
  - api.js
- src
  - App.js
  - main.jsx
  - styles.css

## 6. Flujo de Autenticación y Sesión

1. Register:
- Usuario envía nombre, email y password a POST /auth/register.
- Si éxito, se muestra confirmación y se redirige a Login.

2. Login:
- Usuario envía email y password a POST /auth/login.
- Si éxito, se almacena token y user en localStorage.
- Se redirige a Chat.

3. Navegación protegida:
- Chat requiere token en cliente.
- Si no hay token, redirigir a Login.

4. Logout:
- Limpiar token y user del almacenamiento local.
- Redirigir a Home o Login.

## 7. Flujo de Chat IA

1. Usuario autenticado escribe mensaje o dicta por voz.
2. Frontend envía POST /api/ai/guidance con prompt.
3. Backend responde con data.respuesta.
4. UI renderiza conversación y estado de carga.

## 8. Reglas de Integración para Evitar Errores

1. Usar email en requests de auth y aceptar correo en response de usuario.
2. No asumir token en register; solo se recibe en login.
3. En chat, leer la respuesta desde data.respuesta.
4. Incluir Authorization: Bearer token solo en endpoints que lo requieran.
5. Centralizar baseURL en un solo archivo de configuración HTTP.

## 9. Criterios de Aceptación (QA)

1. Registro exitoso con datos válidos.
2. Login exitoso y persistencia de sesión local.
3. Bloqueo de ruta Chat cuando no hay token.
4. Envío de prompt y recepción de respuesta IA.
5. Visualización clara de errores de API (400, 401, 409, 500).
6. Diseño responsivo funcional en móvil y escritorio.

## 10. Plan de Implementación

Fase 1 (v1 funcional):

1. Crear páginas Home, Login, Register y Chat.
2. Implementar AuthContext y ProtectedRoute.
3. Configurar Axios con baseURL.
4. Integrar endpoints reales del backend.
5. Pruebas manuales de flujo completo.

Fase 2 (expansión):

1. Agregar endpoints backend para historial y métricas.
2. Exponer endpoint de perfil autenticado.
3. Implementar vistas Historial, Dashboard y Primeros Auxilios.

## 11. Riesgos y Mitigaciones

Riesgo: divergencia entre contratos documentados y backend operativo.
Mitigación: mantener este documento como contrato oficial v1 y validar cambios mediante pruebas HTTP.

Riesgo: token en localStorage vulnerable ante XSS.
Mitigación: para prototipo se acepta; para producción planificar migración a cookies httpOnly y estrategia CSRF.

## 12. Conclusión

Esta propuesta permite entregar un frontend estable, demostrable y compatible con el backend existente sin bloqueos de integración. Define una base sólida para evolucionar en siguientes sprints hacia funcionalidades avanzadas.
