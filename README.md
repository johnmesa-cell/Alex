

<img width="622" height="640" alt="Logo Alex" src="https://github.com/user-attachments/assets/257be21a-5a7a-4759-95cb-f4cd2cfc0f87" />

# ALEX - Asistente Logístico de Emergencias y Auxilio

ALEX es una plataforma integral diseñada para la gestión de salud personal y respuesta ante emergencias. Combina un potente backend en Node.js, un frontend moderno en React y capacidades de Inteligencia Artificial (IA) generativa. El sistema permite a los usuarios gestionar su historial médico, recibir orientación en tiempo real y procesar información mediante texto, voz y documentos.

---

## 🏛️ Arquitectura Técnica (Avance)

El proyecto ha evolucionado hacia una arquitectura desacoplada y modular, garantizando escalabilidad y seguridad:

### ⚙️ Backend (Core Logic)
- **Motor:** Node.js v20+ con Express.
- **ORM:** Prisma para una interacción fluida y tipada con la base de datos.
- **Seguridad:** Middleware de autenticación robusto basado en **JWT** y hashing de contraseñas con **bcryptjs**.
- **Control de Acceso:** Sistema de Roles (RBAC) para proteger endpoints sensibles.

### 🎨 Frontend (SPA)
- **Framework:** React 18 impulsado por Vite 5 para una experiencia de desarrollo ultrarrápida.
- **Estado Global:** Uso de `AuthContext` para la gestión centralizada de sesiones y persistencia del usuario.
- **Interfaz:** Diseño responsivo y moderno enfocado en la accesibilidad para pacientes y personal médico.

### 🗄️ Persistencia de Datos
- **Base de Datos:** PostgreSQL 15+.
- **Esquema Relacional:** Modelos optimizados para usuarios, sesiones, consultas médicas y registros de salud.

---

## 🧠 Capacidades de Inteligencia Artificial

ALEX no es solo un chat; es un sistema inteligente capaz de:

### 1. Orientación Médica Segura
- **Motores:** Integración híbrida con **Gemini 2.5 Flash**
- **Seguridad Médica:** Filtros de seguridad que redireccionan automáticamente emergencias críticas a la línea 123.
- **RAG (Retrieval-Augmented Generation):** Implementación de búsqueda vectorial para que la IA responda basándose en guías médicas locales almacenadas en el sistema.

### 2. Interacción Multimodal
- **Audio-to-Speech:** Procesamiento de audio en tiempo real y respuestas habladas mediante la librería `gTTS`.
- **Dictado:** Integración con la Web Speech API en el frontend para interacción sin manos.
- **Voz en Vivo:** Integración avanzada con **Gemini Live** para conversaciones fluidas.

---

## 🚀 Módulos Implementados en Avance 2

### ✅ Seguridad y Autenticación
- Flujos completos de Registro, Login y Logout.
- Validación de payloads y manejo de errores centralizado.

### ✅ Gestión de Consultas (ALEX-46 a ALEX-49)
- Listado histórico de consultas por usuario.
- Detalle, creación y eliminación segura de registros de salud.

### ✅ Dashboard de Métricas (ALEX-53)
- Visualización de KPIs: total de usuarios, consultas pendientes y actividad reciente.
- Generación de reportes de estado de la plataforma.

### ✅ Procesamiento de Archivos
- Subida y almacenamiento seguro de evidencias médicas (PDF, PNG, JPG hasta 10MB).
- Servidor estático para visualización de documentos y audios.

---

## 📂 Estructura del Proyecto

- `backend/express-ts-openai/`: Núcleo de la API, servicios de IA y controladores.
- `frontend/`: Aplicación React, componentes y servicios de consumo de API.
- `database/`: Scripts SQL y configuración de esquemas.
- `docs/`: Repositorio documental, guías de implementación (Avance 1 y 2) y cronogramas.
- `deployment/`: Configuraciones de entornos y comandos útiles.

---

## 🛠️ Tecnologías y Herramientas

| Capa | Tecnologías |
| :--- | :--- |
| **Backend** | Node.js, Express, Prisma, JavaScript/TypeScript |
| **Frontend** | React, Vite, Axios, React Router, Tailwind |
| **IA** | Google Gemini API, OpenAI API, OpenClaw, FAISS |
| **DevOps** | Docker, Docker Compose, Nginx, Linux |
| **Gestión** | GitHub, Trello (para seguimiento de tareas) |

---

## 🚀 Inicio Rápido

### Instalación con Docker
1. Asegúrate de tener **Docker** y **Docker Compose** instalados.
2. Configura las variables de entorno en `./backend/express-ts-openai/.env` (usa `.env.example` como base).
3. Ejecuta el comando:
   ```bash
   docker-compose up --build
   ```

## 🚀 Pipeline de Integración Continua (CI/CD)

Este proyecto utiliza *GitLab CI/CD* para automatizar la construcción,
validación y despliegue de la aplicación.

### Estructura del Pipeline
El pipeline consta de tres etapas (stages):

1. *Build:*
   - Instala las dependencias del Backend y el Frontend.
   - Genera los archivos de producción del Frontend (dist/) usando Vite.
   - Almacena los resultados en *artifacts* para las siguientes etapas.

2. *Test:*
   - Ejecuta las pruebas del Backend y el Frontend.
   - Tiene activado allow_failure: true para reportar el estado
     sin bloquear el deploy.

3. *Deploy:*
   - Se activa exclusivamente en la rama main.
   - Usa conexión segura vía *SSH* con variables protegidas.
   - Actualiza el código en el servidor remoto con los últimos cambios.

### Cómo se activa
El pipeline se dispara *automáticamente* con cada git push a la
rama main, ejecutando todos los stages en orden.

### Variables de Entorno Utilizadas
Configuradas como variables protegidas en GitLab
(Settings > CI/CD > Variables):

| Variable | Descripción |
|---|---|
| $SSH_PRIVATE_KEY | Clave privada SSH para acceder al servidor |
| $SERVER_IP | Dirección IP del servidor de despliegue |
| $SERVER_USER | Usuario del servidor (ej. ubuntu) |
   

## 📄 Documentación Seleccionada
Para profundizar en aspectos específicos del Avance 2:
- [Guía de Integración Gemini & OpenClaw](docs/integration_guide_OpenClaw_Gemini_Live.md)
- [Reporte Técnico de Métricas](docs/Implementacion-Metricas-ALEX-53.md)
- [Gestión de Audio y Archivos](docs/Implementacion-Audio-Archivos-2026.md)
- [Arquitectura de Autenticación](backend/AUTH_DOCUMENTATION.md)

---
*Este proyecto representa el esfuerzo por democratizar el acceso a la orientación médica de calidad mediante tecnología de vanguardia.*

