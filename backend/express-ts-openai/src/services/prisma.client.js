/**
 * @fileoverview Cliente singleton de Prisma ORM.
 *
 * Exporta una única instancia del {@link PrismaClient} que es reutilizada
 * en toda la aplicación para evitar el agotamiento del pool de conexiones
 * a la base de datos PostgreSQL.
 *
 * En desarrollo, la instancia se almacena en `globalThis` para que los
 * reinicios de módulos realizados por herramientas como Nodemon no
 * creen múltiples clientes activos.
 *
 * Configuración de logging:
 *  - En todos los entornos se registran avisos (`warn`) y errores (`error`).
 *
 * Variable de entorno requerida:
 *  - DATABASE_URL  Cadena de conexión de PostgreSQL en formato:
 *                  `postgresql://user:password@host:port/database?schema=public`
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

/**
 * Instancia singleton del cliente Prisma.
 * En desarrollo se reutiliza la misma instancia entre recargas de módulos.
 *
 * @type {PrismaClient}
 */
export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ["warn", "error"]
    });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
