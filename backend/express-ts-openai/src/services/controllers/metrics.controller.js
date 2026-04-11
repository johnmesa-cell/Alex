import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ALEX-53: Endpoint GET /api/metricas/resumen
export const getMetricsSummary = async (req, res) => {
    try {
        // Ejecutamos múltiples conteos en paralelo para mayor eficiencia
        const [
            totalUsuarios,
            totalConsultas,
            consultasAbiertas,
            totalRegistros,
            ultimasConsultas
        ] = await Promise.all([
            prisma.usuario.count(),
            prisma.consulta.count(),
            prisma.consulta.count({ where: { estado: 'abierta' } }),
            prisma.registro.count(),
            prisma.consulta.findMany({
                take: 5,
                orderBy: { fecha_creacion: 'desc' },
                include: { usuario: { select: { nombre: true } } }
            })
        ]);

        res.status(200).json({
            success: true,
            data: {
                resumen: {
                    usuarios: totalUsuarios,
                    consultasTotales: totalConsultas,
                    consultasPendientes: consultasAbiertas,
                    registrosSalud: totalRegistros
                },
                actividadReciente: ultimasConsultas.map(c => ({
                    id: c.id_consulta,
                    usuario: c.usuario.nombre,
                    asunto: c.asunto,
                    fecha: c.fecha_creacion
                }))
            }
        });
    } catch (error) {
        console.error('Error al obtener métricas:', error);
        res.status(500).json({ success: false, message: 'Error al generar el resumen de métricas.' });
    }
};
