# Reporte de Implementación: Manejo de Archivos y Audio (ALEX Backend)

Este documento detalla las nuevas capacidades del backend para el manejo de archivos multimedia y documentos, así como los cambios estructurales realizados para soportar estas funcionalidades.

## 1. Nuevas Funcionalidades

### A. Asistente de Voz (Audio-to-Speech)
Se ha implementado un sistema inteligente de procesamiento de audio que permite al usuario interactuar con la IA mediante voz.
*   **Endpoint:** `POST /api/asistente-voz`
*   **Procesamiento:** Utiliza **Gemini 1.5 Flash** para analizar el contenido del audio directamente.
*   **Respuesta:** Genera una respuesta en texto y un archivo de audio (TTS) usando la librería `gTTS`.
*   **Almacenamiento temporal:** Los fragmentos de audio se gestionan en la carpeta `temp_voice/`.

### B. Sistema de Subida de Archivos Generales
Se ha creado un controlador robusto para la carga de documentos y evidencias médicas.
*   **Endpoint:** `POST /api/files/upload`
*   **Formatos Soportados:** PDF, JPG, JPEG, PNG y CSV.
*   **Seguridad:** 
    *   Validación de tipo MIME y extensión de archivo.
    *   Límite de tamaño de **10 MB** por archivo.
    *   Renombrado automático con `UUID` para evitar colisiones y sobrescritura.

## 2. Cambios en la Infraestructura del Backend

### Servidor Estático
Se ha configurado Express para servir archivos estáticos, permitiendo que el frontend visualice los archivos subidos mediante URLs directas:
*   `http://localhost:3000/uploads/` -> Para documentos e imágenes.
*   `http://localhost:3000/temp_voice/` -> Para archivos de audio generados.

### Docker y Entorno
El [Dockerfile](./backend/express-ts-openai/Dockerfile) ha sido actualizado para incluir las dependencias críticas del sistema:
*   **Python3:** Necesario para la librería `gTTS`.
*   **FFmpeg:** Para el procesamiento y conversión de flujos de audio.
*   **Permisos:** Se automatizó la creación de carpetas `uploads` y `temp_voice` con permisos `777` dentro del contenedor.

## 3. Estructura de Archivos Creados/Modificados

| Archivo | Función |
| :--- | :--- |
| `src/services/controllers/files.controller.js` | Configuración de Multer y lógica de subida. |
| `src/services/routes/files.routes.js` | Definición del endpoint de archivos. |
| `src/services/controllers/voice.controller.js` | Lógica de IA y procesamiento de audio. |
| `src/services/app.js` | Registro de nuevas rutas y configuración de archivos estáticos. |
| `Dockerfile` | Instalación de dependencias de audio y permisos de carpetas. |

## 4. Instrucciones para el Frontend
Para subir archivos, el frontend debe enviar un `FormData` con la clave `file` (para archivos) o `audio` (para voz), e incluir el `Authorization: Bearer <TOKEN>` en las cabeceras.

---
**Fecha de implementación:** 11 de Abril, 2026
**Responsable:** GitHub Copilot (Agente de Desarrollo)
