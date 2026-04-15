# Reporte de Implementación: Gestión de Consultas (ALEX-46 a ALEX-49)

Este documento detalla la implementación de los endpoints para el sistema de consultas médico-paciente del proyecto ALEX.

## 1. Tareas Completadas

### ALEX-46: Crear endpoint POST /api/consultas
*   **Descripción:** Permite a un usuario autenticado enviar una nueva consulta de salud.
*   **Entrada:** Objeto JSON con `asunto` (string) y `mensaje` (texto).
*   **Procesamiento:** Vincula automáticamente la consulta al `id_usuario` extraído del token JWT.
*   **Respuesta:** Devuelve el objeto de la consulta creada con estado "abierta".

### ALEX-47: Endpoint GET /api/consultas (listar)
*   **Descripción:** Recupera el historial completo de consultas del usuario logueado.
*   **Seguridad:** Solo devuelve las consultas pertenecientes al usuario que realiza la petición.
*   **Orden:** Las consultas se entregan ordenadas por fecha de creación descendente (las más recientes primero).

### ALEX-48: Endpoint GET /api/consultas/:id
*   **Descripción:** Obtiene el detalle de una consulta específica mediante su ID.
*   **Validación:** Verifica que la consulta exista y que pertenezca al usuario solicitante.

### ALEX-49: Endpoint DELETE /api/consultas/:id
*   **Descripción:** Permite al usuario eliminar una consulta de su historial.
*   **Seguridad:** Implementa doble validación (existencia y propiedad) antes de proceder con el borrado en la base de datos.

## 2. Cambios Técnicos Realizados

### Base de Datos (Prisma)
Se añadió el modelo `Consulta` al esquema relacional:
```prisma
model Consulta {
  id_consulta    Int       @id @default(autoincrement()) @map("idconsulta")
  id_usuario     Int       @map("idusuario")
  asunto         String    @db.VarChar(200)
  mensaje        String    @db.Text
  respuesta_ia   String?   @db.Text @map("respuestaia")
  fecha_creacion DateTime? @default(now()) @db.Timestamp(6) @map("fechacreacion")
  estado         String?   @default("abierta") @db.VarChar(20)
  usuario        Usuario   @relation(fields: [id_usuario], references: [id_usuario], onDelete: Cascade, onUpdate: NoAction, map: "fk_consulta_usuario")

  @@map("consultas")
}
```

### Estructura de Archivos
| Archivo | Función |
| :--- | :--- |
| `src/services/controllers/consultas.controller.js` | Lógica CRUD y validaciones de negocio. |
| `src/services/routes/consultas.routes.js` | Definición de rutas y protección con `verifyToken`. |
| `src/services/app.js` | Registro del módulo de consultas en el servidor Express. |

## 3. Guía de Uso (API)

| Operación | Método | Endpoint | Cabecera Obligatoria |
| :--- | :--- | :--- | :--- |
| Crear Consulta | `POST` | `/api/consultas` | `Authorization: Bearer <TOKEN>` |
| Ver Todas | `GET` | `/api/consultas` | `Authorization: Bearer <TOKEN>` |
| Ver una | `GET` | `/api/consultas/1` | `Authorization: Bearer <TOKEN>` |
| Eliminar | `DELETE` | `/api/consultas/1` | `Authorization: Bearer <TOKEN>` |

---
**Fecha de implementación:** 11 de Abril, 2026
**Estatus:** Completado y desplegado en backend local.
**Responsable:** GitHub Copilot
