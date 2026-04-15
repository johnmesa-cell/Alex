# Guía de implementación: integración de OpenClaw y Gemini Live en ALEX

## 1. Propósito del documento

Este documento sirve como guía técnica para implementar mejoras complementarias en el proyecto **ALEX**, manteniendo al **backend como núcleo central** y agregando dos capacidades externas:

- **OpenClaw** como capa de orquestación de IA.
- **Gemini Live** como canal de interacción por voz.

El objetivo no es reemplazar la arquitectura actual, sino **extenderla** para que el usuario pueda interactuar con ALEX por texto o voz, y para que el sistema pueda resolver consultas de IA de forma más flexible, escalable y económica.

---

## 2. Objetivo general

Implementar una arquitectura modular en la que:

- **ALEX backend** conserve el control de:
  - autenticación,
  - validación,
  - persistencia,
  - reglas de negocio,
  - acceso a datos.

- **OpenClaw** funcione como agente externo para:
  - resolver consultas inteligentes,
  - decidir cuándo usar conocimiento local o IA externa,
  - consumir la API del backend sin acceder directamente a la base de datos.

- **Gemini Live** se utilice como una alternativa de interacción por voz para el usuario:
  - entrada de audio,
  - respuesta hablada,
  - experiencia conversacional en tiempo real.

---

## 3. Alcance de la implementación

### Incluye
- Integración de OpenClaw como servicio independiente.
- Creación de endpoints para conocimiento local en el backend.
- Ajustes al flujo de IA del backend para usar caché/conocimiento previo.
- Integración de Gemini Live como interfaz de voz.
- Conexión entre frontend, OpenClaw, Gemini Live y backend mediante API REST o canal de comunicación seguro.
- Documentación técnica y pruebas funcionales.

### No incluye inicialmente
- Sustitución completa del backend.
- Acceso directo de OpenClaw a PostgreSQL.
- Ejecución de modelos LLM locales pesados.
- Automatización clínica autónoma sin supervisión.
- Funciones críticas que actúen sin pasar por validaciones del backend.

---

## 4. Arquitectura objetivo

### 4.1 Componentes

- **Frontend ALEX**
  - Interfaz principal para usuarios.
  - Permite interacción por texto y acceso a funciones visuales.
  - Puede incluir botón de voz para activar Gemini Live.

- **Backend ALEX**
  - API central del sistema.
  - Gestiona autenticación, usuarios, historial, conocimientos y métricas.
  - Expone endpoints para consulta y almacenamiento de respuestas de IA.

- **Base de datos PostgreSQL**
  - Almacena usuarios, consultas, respuestas, métricas y base de conocimiento.

- **OpenClaw**
  - Agente externo de IA.
  - Consume la API del backend.
  - Puede actuar como orquestador entre conocimiento local e IA externa.

- **Gemini Live**
  - Servicio de conversación por voz.
  - Permite interacción en tiempo real mediante audio.

- **Reverse proxy / gateway**
  - Nginx, Caddy o similar.
  - Expone servicios de forma controlada por dominio o subdominio.

---

## 5. Principios de diseño

La implementación debe seguir estos principios:

### 5.1 El backend sigue siendo la fuente de verdad
Toda operación importante debe pasar por el backend de ALEX.  
OpenClaw y Gemini Live son complementos, no dueños del sistema.

### 5.2 Desacoplamiento
Cada componente debe cumplir una función clara:

- backend = reglas y datos,
- OpenClaw = inteligencia,
- Gemini Live = voz,
- frontend = interfaz visual.

### 5.3 Seguridad por diseño
Ningún complemento debe tener acceso directo innecesario a la base de datos ni a secretos críticos.

### 5.4 Evolución gradual
La solución debe poder implementarse por etapas, sin romper el sistema existente.

---

## 6. Flujo de interacción propuesto

### 6.1 Flujo de texto con OpenClaw
1. El usuario escribe una consulta en el frontend o en la interfaz de OpenClaw.
2. La consulta llega al backend o al skill de OpenClaw.
3. OpenClaw consulta primero el conocimiento local del backend.
4. Si hay coincidencia válida, devuelve una respuesta reutilizada.
5. Si no hay coincidencia, el backend llama a la IA externa.
6. La respuesta nueva se almacena en la base de conocimiento.
7. El usuario recibe la respuesta final.

### 6.2 Flujo de voz con Gemini Live
1. El usuario activa el modo voz.
2. El frontend captura audio del micrófono.
3. El audio se envía a Gemini Live.
4. Gemini procesa la conversación y responde por voz.
5. Si la conversación requiere datos de ALEX, se consulta al backend.
6. El sistema devuelve la respuesta hablada al usuario.

### 6.3 Flujo híbrido
El usuario puede alternar entre:
- escribir al sistema,
- hablar con Gemini Live,
- o usar OpenClaw para tareas más guiadas o especializadas.

---

## 7. Cambios recomendados en el backend

### 7.1 Nuevo modelo de conocimiento
Agregar un modelo de base de conocimiento para guardar preguntas y respuestas reutilizables.

Campos sugeridos:
- `id`
- `questionRaw`
- `questionNorm`
- `answer`
- `source`
- `tags`
- `createdAt`
- `updatedAt`

### 7.2 Endpoints nuevos
Implementar endpoints como:

- `GET /api/knowledge/search?q=...`
- `POST /api/knowledge`
- `GET /api/ai/guidance`
- `GET /api/metrics/summary`

### 7.3 Ajuste del flujo de IA
Antes de llamar a un modelo externo:
1. normalizar la pregunta,
2. buscar coincidencias,
3. revisar si ya existe respuesta útil,
4. solo entonces llamar a la IA externa.

### 7.4 Registro de trazabilidad
Guardar:
- consulta original,
- respuesta usada,
- fuente de respuesta,
- fecha,
- usuario o sesión.

---

## 8. Integración de OpenClaw

### 8.1 Rol de OpenClaw
OpenClaw debe actuar como:
- asistente inteligente,
- orquestador de consulta,
- consumidor de endpoints del backend.

### 8.2 Restricciones
OpenClaw:
- no debe conectarse directamente a PostgreSQL,
- no debe ejecutar acciones críticas sin validación del backend,
- no debe operar con permisos excesivos.

### 8.3 Skills sugeridos
#### Skill 1: `alex-knowledge`
Función:
- consultar conocimiento local,
- decidir si una respuesta puede resolverse sin IA externa,
- o derivar la consulta al backend.

#### Skill 2: `alex-metrics`
Función:
- consultar métricas básicas,
- útil para demostraciones o panel administrativo.

### 8.4 Comunicación
OpenClaw debe comunicarse con ALEX mediante:
- API REST,
- tokens de acceso,
- validaciones por rol.

---

## 9. Integración de Gemini Live

### 9.1 Rol de Gemini Live
Gemini Live funcionará como:
- interfaz conversacional por voz,
- alternativa al teclado,
- canal adicional de interacción.

### 9.2 Casos de uso
- usuario con dificultad para escribir,
- interacción rápida en emergencias,
- demostración más natural,
- accesibilidad.

### 9.3 Requisitos técnicos
- acceso al micrófono,
- streaming de audio,
- manejo de permisos del navegador,
- soporte de baja latencia,
- control de interrupción de voz.

### 9.4 Integración recomendada
La opción más segura es que Gemini Live:
- opere desde el frontend,
- use el backend solo cuando necesite datos o acciones controladas.

---

## 10. Estrategia de implementación por fases

### Fase 1: Base funcional
- revisar arquitectura actual,
- definir endpoints necesarios,
- crear modelo de conocimiento,
- ajustar el controlador de IA.

### Fase 2: OpenClaw
- desplegar OpenClaw en contenedor separado,
- crear skill `alex-knowledge`,
- probar conexión con el backend.

### Fase 3: Gemini Live
- habilitar interfaz de voz,
- conectar micrófono,
- probar flujo conversacional,
- validar respuesta hablada.

### Fase 4: Integración final
- unir frontend, OpenClaw y Gemini Live,
- documentar arquitectura,
- realizar pruebas de usuario,
- preparar demo final.

---

## 11. Recomendaciones de seguridad

- No exponer credenciales en frontend.
- No dar acceso directo a OpenClaw a la base de datos.
- Usar autenticación para todos los endpoints sensibles.
- Registrar accesos y uso de IA.
- Limitar acciones permitidas por cada complemento.
- Revisar prompts para evitar inyecciones o respuestas inseguras.

---

## 12. Beneficios esperados

Con esta implementación, ALEX podrá:

- responder consultas con mejor eficiencia,
- reutilizar conocimiento ya generado,
- reducir consumo de APIs externas,
- ofrecer interacción por voz,
- mejorar accesibilidad,
- presentar una arquitectura más moderna y demostrable.

---

## 13. Conclusión

La integración de **OpenClaw** y **Gemini Live** es viable siempre que ALEX conserve el papel de **núcleo central** del sistema.  
La clave de la implementación es el desacoplamiento: cada componente aporta valor sin reemplazar la lógica principal.

Esta guía propone una evolución progresiva, segura y coherente con el diseño original del proyecto.
