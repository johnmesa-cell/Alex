# Reporte de Incidencia y Solución: Generación del Almacén de Vectores

**Fecha:** 31 de Marzo de 2026
**Autor:** Asistente de IA (GitHub Copilot)
**Estado:** Resuelto

## 1. Resumen Ejecutivo

El objetivo inicial era reparar un script (`generate-vector-store.mjs`) encargado de procesar una colección de documentos PDF para crear una base de datos vectorial para un sistema RAG (Retrieval-Augmented Generation). El script original, basado en `langchain` y `faiss-node`, presentaba fallos persistentes e intratables en el entorno de desarrollo (Windows).

Tras un exhaustivo proceso de depuración, se determinó que la pila tecnológica original era inviable. La solución implicó un rediseño arquitectónico del script, reemplazando componentes clave:
1.  **Vector Store:** Se migró de `faiss-node` a **ChromaDB**, ejecutado en un contenedor de Docker para garantizar la portabilidad y estabilidad.
2.  **Modelo de Embeddings:** Se reemplazó la API de Google Gemini por un modelo local de alto rendimiento (`Xenova/all-MiniLM-L6-v2`) a través de la librería **`@xenova/transformers`**, eliminando dependencias de red y APIs externas para esta tarea.

El resultado es un proceso de generación de vectores robusto, autónomo y portable, listo para su despliegie en entornos de producción.

## 2. Cronología del Incidente y Fases de la Solución

### Fase 1: Intento de Reparación con `faiss-node`

- **Problema Inicial:** El script fallaba de forma silenciosa. El usuario solicitó "eliminar langchain del proyecto para instalar lo que se necesita nuevamente desde 0" debido a la gran cantidad de problemas.
- **Acciones Realizadas:**
    - Se desinstalaron todas las dependencias relacionadas con `langchain` y `faiss-node`.
    - Se realizó una limpieza completa del directorio `node_modules` y del `package-lock.json`.
    - Se reinstalaron las dependencias.
- **Fallos Encontrados:**
    - **Conflictos de Dependencias:** Surgieron errores `ERESOLVE` que requirieron el uso del flag `--legacy-peer-deps` para ser omitidos, indicando una base de dependencias inestable.
    - **Errores de Memoria:** Se descubrió que el script procesaba casi 5000 fragmentos de texto de 9 PDFs grandes, causando un consumo de memoria que probablemente hacía que el proceso `faiss-node` fallara sin un error explícito.
    - **Inviabilidad de `faiss-node`:** Se concluyó que `faiss-node`, al depender de compilaciones nativas, era una fuente de inestabilidad en el entorno de desarrollo (Windows) y una posible fuente de problemas en producción.

### Fase 2: Pivote a ChromaDB y la API de Google

- **Alternativa Propuesta:** Reemplazar `faiss-node` por `ChromaDB` como base de datos vectorial, y utilizar la API de Google Gemini para la generación de los embeddings.
- **Acciones Realizadas:**
    - Se instaló la librería `chromadb`.
    - Se modificó el `docker-compose.yml` para añadir el servicio de ChromaDB.
    - Se guió al usuario para iniciar el contenedor de Docker correctamente.
    - Se reescribió el script `generate-vector-store.mjs` para usar `Chroma` y `GoogleGenerativeAIEmbeddings` de LangChain.
- **Fallos Encontrados:**
    - **Embeddings Vacíos:** La API de Google Gemini devolvía embeddings vacíos para todos los fragmentos de texto extraídos de los PDFs, haciendo imposible la inserción en ChromaDB. A pesar de los intentos de filtrado y procesamiento por lotes, el problema persistió, apuntando a un posible problema con el contenido de los PDFs o la API.

### Fase 3: Pivote a Embeddings Locales con `@xenova/transformers`

- **Alternativa Propuesta:** Para eliminar todas las dependencias externas problemáticas (API de Google) y de compilación (faiss-node), se decidió adoptar un modelo de embeddings que se ejecutara localmente.
- **Acciones Realizadas:**
    - Se instaló la librería `@xenova/transformers`.
    - Se intentó integrar el modelo local usando las clases de LangChain (`SentenceTransformerEmbeddings`, `XenovaTransformersEmbeddings`).
- **Fallos Encontrados:**
    - **Errores de Importación (`ERR_PACKAGE_PATH_NOT_EXPORTED`):** Se encontraron errores críticos al intentar importar los wrappers de embeddings desde `@langchain/community`. Múltiples versiones del paquete presentaron el mismo problema, lo que bloqueó completamente el uso de las abstracciones de LangChain para este propósito.

### Fase 4: Solución Definitiva - Implementación Directa

- **Estrategia Final:** Ante los problemas insuperables con las abstracciones de LangChain, se decidió eludir esa capa por completo y utilizar las librerías base directamente.
- **Acciones Realizadas:**
    - Se reescribió el script `generate-vector-store.mjs` desde cero para:
        1.  Usar `PDFLoader` y `RecursiveCharacterTextSplitter` de `langchain` (componentes que funcionaban bien) para cargar y dividir los documentos.
        2.  Usar la función `pipeline` de `@xenova/transformers` directamente para generar los embeddings de los fragmentos de texto.
        3.  Usar el `ChromaClient` de la librería `chromadb` para conectarse a la base de datos y añadir los documentos, metadatos y embeddings manualmente en lotes.
    - Se corrigieron errores finales relacionados con el formato de los metadatos que exigía ChromaDB.
- **Resultado:** El script se ejecutó con éxito, procesando todos los PDFs y poblando la base de datos vectorial en ChromaDB.

## 3. Requisitos y Consideraciones para el Despliegue

La solución actual está diseñada para ser portable y robusta. Para un despliegue en un servidor (ej. Oracle Cloud), se deben tener en cuenta los siguientes requisitos:

1.  **Node.js:** El servidor debe tener instalado Node.js (versión 18+ recomendada).
2.  **Docker:** El servidor debe tener Docker y Docker Compose instalados para poder ejecutar el contenedor de ChromaDB.
3.  **Archivos del Proyecto:** Se debe subir toda la carpeta del backend al servidor, incluyendo los PDFs en la carpeta `data/pdfs`.
4.  **Conectividad de Red (Inicial):** La primera vez que se ejecute el script `generate-vector-store.mjs` en el servidor, este necesitará acceso a internet para descargar los archivos del modelo de embeddings desde Hugging Face. Una vez descargados, se almacenarán en una caché local (`.cache`) y no se requerirá más conexión para esta tarea.
5.  **Variables de Entorno:** Asegurarse de que las variables de entorno (como las claves de API para el modelo de lenguaje que generará las respuestas finales) estén configuradas en el entorno de producción.

## 4. Conclusión

El problema fue resuelto exitosamente mediante un cambio de arquitectura que priorizó la estabilidad y la autonomía. La pila tecnológica final (`Node.js` + `ChromaDB` en Docker + `@xenova/transformers`) es una solución moderna y confiable para sistemas RAG, minimizando las dependencias de compilaciones nativas frágiles y de APIs externas para el proceso de embedding.
