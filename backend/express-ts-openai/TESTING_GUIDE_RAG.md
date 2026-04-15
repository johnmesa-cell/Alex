# Guía de Pruebas: Endpoint de Primeros Auxilios (`/api/primeros-auxilios`)

Esta guía explica cómo probar el endpoint de RAG (Retrieval-Augmented Generation) para primeros auxilios utilizando una herramienta como Postman.

### Paso 1: Configuración de la Petición

-   **Método:** `GET`
-   **URL:** `http://localhost:3000/api/primeros-auxilios`

### Paso 2: Autenticación (Bearer Token)

Este es un endpoint protegido y requiere un token de autenticación válido.

1.  Ve a la pestaña **Authorization**.
2.  Selecciona el tipo **Bearer Token**.
3.  En el campo de la derecha, pega el token JWT que obtuviste al iniciar sesión (`/auth/login`).

### Paso 3: Parámetros de la Petición (Query Params)

Para las peticiones `GET`, los datos se envían a través de parámetros en la URL, no en el cuerpo (Body).

1.  Ve a la pestaña **Params**.
2.  En la primera fila, en el campo `Key`, escribe `pregunta`.
3.  En el campo `Value`, escribe la pregunta que deseas hacer. Para este ejemplo, usaremos: `¿como hacer RCP?`

Postman construirá automáticamente la URL completa por ti: `http://localhost:3000/api/primeros-auxilios?pregunta=¿como hacer RCP?`

### Paso 4: Cuerpo de la Petición (Body)

El cuerpo de la petición debe estar vacío.

1.  Ve a la pestaña **Body**.
2.  Selecciona la opción `none`.

### Paso 5: Ejecución y Salida Esperada en Consola

Haz clic en el botón **Send**. En la terminal donde se está ejecutando el backend (`npm run dev`), deberías ver una secuencia de logs similar a esta:

```log
Recibida pregunta: "¿como hacer RCP?"
Generando embedding para la pregunta...
Buscando contexto en ChromaDB...
Contexto encontrado: la persona se esté atragantando. Después de cada ciclo subsiguiente de
compresiones en el pecho y antes de intentar la respiración de salvamento, busque
si hay algún objeto y, si lo hubiera, retírel...
Enviando pregunta y contexto a Gemini...
```

**Nota sobre el error de ChromaDB:** Es posible que sigas viendo el mensaje `Cannot instantiate a collection with the DefaultEmbeddingFunction...`. Puedes ignorar este warning de forma segura, ya que, como se ve en los logs, el sistema **sí logra encontrar y extraer el contexto** relevante de la base de datos vectorial.

### Paso 6: Respuesta Esperada en Postman (De momento no funciona debido a problemas con la api de Gemini)

Si la clave de API de Gemini es correcta y el proceso finaliza con éxito, deberías recibir una respuesta `200 OK` en Postman con un cuerpo (Body) en formato JSON similar a este:

```json
{
    "pregunta": "¿como hacer RCP?",
    "respuesta_ia": "Por favor, llama inmediatamente a la línea 123.\n\n1. Coloca a la persona boca arriba sobre una superficie firme.\n2. Arrodíllate a un lado de la persona, a la altura de su pecho.\n3. Coloca la base de una de tus manos en el centro del pecho de la persona, entre los pezones.\n4. Coloca tu otra mano encima de la primera y entrelaza los dedos.\n5. Mantén los brazos rectos y los hombros directamente sobre las manos.\n6. Realiza compresiones fuertes y rápidas, a un ritmo de 100 a 120 compresiones por minuto.\n\nNota: Esta es una orientación preliminar de IA y no sustituye la valoración de un profesional médico."
}
```