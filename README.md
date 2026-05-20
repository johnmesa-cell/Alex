<img width="622" height="640" alt="Logo Alex" src="https://github.com/user-attachments/assets/257be21a-5a7a-4759-95cb-f4cd2cfc0f87" />

# ALEX — Asistente Virtual de IA Especializado en Salud y Emergencias

ALEX es una plataforma web inteligente orientada al área de la salud y emergencias. Integra un asistente virtual basado en Inteligencia Artificial que brinda orientación básica, información preventiva y apoyo inicial a los usuarios las 24 horas del día, mediante una interfaz accesible y segura.

El sistema está construido sobre una **arquitectura de microservicios** desacoplada y modular, compuesta por dos repositorios independientes:

| Repositorio | Rol |
|---|---|
| `johnmesa-cell/Alex` | Plataforma principal: frontend React, backend REST, PostgreSQL, autenticación, archivos, métricas y proxy hacia el microservicio de IA |
| `johnmesa-cell/agente-alex` | Microservicio de IA: lógica conversacional, modelos de lenguaje, ChromaDB, Tavily y clasificador de emergencias |

---

## 🏛️ Arquitectura del Sistema

### ⚙️ Backend (Alex)
- **Runtime:** Node.js 20+ con Express (JavaScript ES Modules)
- **ORM:** Prisma para interacción tipada con PostgreSQL
- **Autenticación:** JWT + bcryptjs (registro, login, recuperación de contraseña)
- **Controladores:** auth, admin, consultas, archivos, primeros auxilios, métricas y voz
- **Proxy de IA:** el backend **no llama directamente a ninguna API de IA** — delega toda la lógica al microservicio `agente-alex` vía `fetch()` interno

### 🎨 Frontend (React)
- **Framework:** React 18 + Vite 5
- **Enrutamiento:** React Router
- **HTTP:** Axios
- **Estilos:** CSS propio (sin frameworks externos)
- **Páginas implementadas:** Login, Register, Chat, Home, AdminPanel, Profile, Settings, Soporte, Informacion, ForgotPassword

### 🗄️ Base de Datos
- **Motor:** PostgreSQL
- **ORM:** Prisma — modelos para usuarios, sesiones, consultas y archivos médicos

### 🔀 Reverse Proxy
- **Nginx** como proxy entre contenedores

---

## 🧠 Inteligencia Artificial — Microservicio agente-alex

Toda la inteligencia del sistema vive en el repositorio independiente [`agente-alex`](https://github.com/johnmesa-cell/agente-alex):

- **Modelo principal:** Llama 3.3 70B vía [Groq API](https://groq.com)
- **Fallback automático:** DeepSeek V3 / R1 si Groq no responde
- **Base de conocimiento vectorial:** ChromaDB con contenido médico
- **Búsqueda web complementaria:** Tavily API (cuando ChromaDB no resuelve la consulta)
- **Clasificador de intención:** módulo propio `intentClassifier.js` (emergencia vs. consulta informativa)
- **Historial de sesiones:** en memoria (JavaScript), con limpieza automática por inactividad
- **Panel de administración:** gestión de sesiones activas y actualización de API Keys en caliente sin reiniciar el servicio
- **Síntesis de voz:** text-to-speech con `gTTS`

### Flujo de una conversación

```
Usuario (Frontend React)
↓
Backend Alex (Express)
  --- valida JWT del usuario
  --- añade nombre del usuario al mensaje
  --- hace fetch() al agente en http://alex_agent:3500/chat
↓
Microservicio agente-alex (Express)
  --- clasifica intención: emergencia o consulta
  --- consulta ChromaDB (base de conocimiento médica)
  --- si ChromaDB no responde → busca en internet con Tavily
  --- llama a Groq (Llama 3.3 70B)
  --- si Groq falla → fallback automático a DeepSeek V3/R1
  --- devuelve respuesta al backend Alex
↓
Backend Alex
  --- guarda la consulta en PostgreSQL (si usuario autenticado)
  --- devuelve respuesta al frontend
```

---

## ✅ Estado Actual del Proyecto

### Completado
- Backend REST con 7 controladores funcionales (auth, admin, consultas, archivos, primeros auxilios, métricas, voz)
- Sistema de autenticación JWT completo (registro, login, recuperación de contraseña)
- Microservicio agente-alex construido desde cero con clasificador, Groq, fallback DeepSeek, ChromaDB, Tavily y sesiones
- Frontend con 10 páginas React implementadas
- Dashboard de métricas (backend + panel admin en frontend)
- Subida y gestión de archivos médicos por sesión
- Síntesis de voz (gTTS)
- Docker Compose con todos los servicios configurados (backend, agente, frontend, ChromaDB, Nginx)
- Pipeline CI/CD con GitLab CI configurado

### En progreso / pendiente
- Cobertura de pruebas automatizadas (actualmente 65%, meta 70%)
- Pruebas E2E
- Documentación técnica completa
- Manuales de usuario

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
|---|---|
| **Backend** | Node.js 20, Express, Prisma, PostgreSQL, JWT, bcryptjs, Multer, gTTS |
| **Frontend** | React 18, Vite 5, Axios, React Router, CSS propio |
| **IA** | Groq (Llama 3.3 70B), DeepSeek V3/R1, ChromaDB, Tavily |
| **Infraestructura** | Docker, Docker Compose, Nginx, GitLab CI |

---

## ⚙️ Variables de Entorno

### Backend Alex
| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL |
| `JWT_SECRET` | Secreto para firma de tokens JWT |
| `AGENT_URL` | URL interna del microservicio agente-alex (ej: `http://alex_agent:3500`) |
| `PORT` | Puerto del servidor backend |

### Microservicio agente-alex
| Variable | Descripción |
|---|---|
| `GROQ_API_KEY` | API Key de Groq (modelo Llama 3.3 70B) |
| `DEEPSEEK_API_KEY` | API Key de DeepSeek (fallback automático) |
| `TAVILY_API_KEY` | API Key de Tavily (búsqueda web) |
| `CHROMA_URL` | URL del servidor ChromaDB |
| `CHROMA_KNOWLEDGE_COLLECTION` | Nombre de la colección de conocimiento médico |
| `CHROMA_UPLOADS_COLLECTION` | Nombre de la colección de uploads de usuarios |
| `PORT` | Puerto del microservicio (default: 3001) |
| `ADMIN_USER` | Usuario del panel de administración |
| `ADMIN_PASSWORD` | Contraseña del panel de administración |

---

## 🚀 Inicio Rápido con Docker

1. Asegúrate de tener **Docker** y **Docker Compose** instalados.
2. Copia `.env.example` a `.env` y configura las variables de entorno.
3. Ejecuta:
   ```bash
   docker-compose up --build
   ```

---

## 🔄 Pipeline CI/CD (GitLab CI)

El pipeline se activa automáticamente con cada `git push` a `main` y consta de tres etapas:

1. **Build:** instala dependencias y genera el build del frontend con Vite.
2. **Test:** ejecuta pruebas de backend y frontend (`allow_failure: true`).
3. **Deploy:** se activa solo en `main`, despliega vía SSH al servidor remoto.

| Variable GitLab | Descripción |
|---|---|
| `$SSH_PRIVATE_KEY` | Clave privada SSH para acceder al servidor |
| `$SERVER_IP` | Dirección IP del servidor de despliegue |
| `$SERVER_USER` | Usuario del servidor (ej. ubuntu) |

---

## 👥 Integrantes

- John Mesa
- Juan José Restrepo Londoño
- Johan Samuel Oviedo Granados
- Julián David Calderón Largo

**Universidad Tecnológica de Pereira — Tecnología en Desarrollo de Software — Facultad de Ingenierías**

---

*Este proyecto representa el esfuerzo por democratizar el acceso a la orientación en salud mediante tecnología de vanguardia.*
