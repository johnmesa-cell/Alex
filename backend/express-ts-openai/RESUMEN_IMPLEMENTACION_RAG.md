# Resumen de Implementación: Endpoint RAG con IA

Este documento resume los cambios arquitectónicos y de código realizados para implementar un endpoint de `primeros auxilios` basado en un modelo de RAG (Retrieval-Augmented Generation), utilizando una base de datos vectorial local y la API de Gemini.

## 1. Creación del Endpoint de Primeros Auxilios

Se desarrolló un nuevo endpoint `GET /api/primeros-auxilios` para responder preguntas de los usuarios.

-   **Nuevas Rutas:** Se creó el archivo `backend/express-ts-openai/src/services/routes/firstaid.routes.js` para gestionar la ruta.
-   **Nuevo Controlador:** La lógica principal reside en `backend/express-ts-openai/src/services/controllers/firstaid.controller.js`. Este controlador:
    1.  Recibe una `pregunta` del usuario a través de query params.
    2.  Implementa un **filtro de seguridad** para bloquear preguntas con palabras clave inapropiadas (ej. violencia, autolesión), devolviendo un error `403 Forbidden`.
    3.  Genera un embedding para la pregunta.
    4.  Consulta la base de datos vectorial para obtener contexto relevante.
    5.  Envía la pregunta y el contexto a la IA (Gemini) para generar una respuesta.
    6.  Devuelve la respuesta al usuario.

## 2. Arquitectura de la Base de Datos Vectorial

Se migró de una solución basada en `faiss-node` a una arquitectura más robusta y desacoplada utilizando **ChromaDB** y embeddings locales.

-   **Nuevo Contenedor Docker:** Se añadió un servicio `chroma` al archivo `docker-compose.yml` para levantar una instancia de ChromaDB. Esto permite que la base de datos vectorial se ejecute de forma aislada y persistente.
-   **Modelo de Embedding Local:** Se adoptó la librería `@xenova/transformers` para generar los embeddings directamente en el backend, utilizando el modelo `Xenova/all-MiniLM-L6-v2`. Esto elimina la dependencia de servicios de embedding externos y sus costos asociados.
-   **Script de Generación:** El script `backend/express-ts-openai/scripts/generate-vector-store.mjs` fue modificado para:
    1.  Leer los documentos PDF de la carpeta `data/pdfs`.
    2.  Dividir el texto en fragmentos manejables.
    3.  Generar los embeddings para cada fragmento usando el modelo local.
    4.  Conectarse a la instancia de ChromaDB en Docker y almacenar los fragmentos junto a sus embeddings en una colección llamada `first_aid_docs`.

## 3. Dependencias y Configuración

Para soportar la nueva arquitectura, se añadieron las siguientes dependencias clave al `package.json` del backend:

-   `@xenova/transformers`: Para la generación de embeddings.
-   `chromadb`: Cliente oficial para interactuar con la base de datos ChromaDB desde Node.js.
-   `pdf-parse`: Para la lectura y extracción de texto de los documentos PDF.

## 4. Sincronización de la Base de Datos (Prisma)

Durante las pruebas, surgió un error persistente que impedía el registro y login de usuarios: `The column 'existe' does not exist in the current database`.

-   **Diagnóstico:** Se determinó que el problema no estaba en el código, sino en una desincronización entre el esquema de Prisma (`schema.prisma`) y el estado real de la base de datos de desarrollo local. La base de datos local contenía una "columna fantasma" de una migración anterior.
-   **Solución Definitiva:** Para forzar la base de datos a ser un reflejo exacto del esquema actual, se utilizó el siguiente comando. **Este comando es destructivo y solo debe usarse en desarrollo**:

    ```bash
    npx prisma db push --force-reset
    ```

    Este comando borra todos los datos de la base de datos de desarrollo y la recrea desde cero basándose en el `schema.prisma`, solucionando el problema de forma permanente.

## 5. Integración con la API de Gemini

La conexión con la API de Google Gemini presentó problemas de acceso que impidieron obtener una respuesta del modelo de IA.

-   **Problema:** Al realizar peticiones a la API con diferentes modelos (`gemini-1.5-flash`, `gemini-pro`, `gemini-pro-vision`), se recibía consistentemente un error `404 Not Found`, indicando que los modelos no estaban disponibles para la clave de API utilizada.
-   **Diagnóstico:** Se concluyó que el problema no era el código ni las dependencias (que fueron actualizadas a la última versión), sino un problema de permisos o configuración en la `GEMINI_API_KEY`.
-   **Solución Recomendada:** La solución es generar una nueva clave de API en la consola de Google Cloud, asegurándose de que esté asociada a un proyecto que tenga la **API de Vertex AI** (o Generative Language) explícitamente habilitada.
