import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/consultas
export const createConsulta = async (req, res) => {
    try {
        const { asunto, mensaje } = req.body;
        const id_usuario = req.usuario.id_usuario;

        if (!asunto || !mensaje) {
            return res.status(400).json({ success: false, message: 'Asunto y mensaje son requeridos.' });
        }

        const nuevaConsulta = await prisma.consulta.create({
            data: { id_usuario, asunto, mensaje, estado: 'abierta' }
        });

        res.status(201).json({ success: true, data: nuevaConsulta });
    } catch (error) {
        console.error('Error al crear consulta:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};

// GET /api/consultas/resumen
// Devuelve: { totalConsultas, ultimaConsulta, archivosSubidos }
export const getResumenConsultas = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;

        const [totalConsultas, ultimaConsulta, totalArchivos] = await Promise.all([
            prisma.consulta.count({ where: { id_usuario } }),
            prisma.consulta.findFirst({
                where: { id_usuario },
                orderBy: { fecha_creacion: 'desc' },
                select: {
                    id_consulta:   true,
                    asunto:        true,
                    fecha_creacion: true,
                    respuesta_ia:  true,
                }
            }),
            // Contamos registros del usuario (tabla registros = documentos/archivos)
            prisma.registro.count({ where: { id_creador: id_usuario } }),
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalConsultas,
                ultimaConsulta: ultimaConsulta ?? null,
                archivosSubidos: totalArchivos,
            }
        });
    } catch (error) {
        console.error('Error al obtener resumen:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};

// GET /api/consultas
export const getAllConsultas = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;

        const consultas = await prisma.consulta.findMany({
            where: { id_usuario },
            orderBy: { fecha_creacion: 'desc' },
            select: {
                id_consulta:    true,
                asunto:         true,
                mensaje:        true,
                respuesta_ia:   true,
                fecha_creacion: true,
                estado:         true,
            }
        });

        res.status(200).json({ success: true, data: consultas });
    } catch (error) {
        console.error('Error al listar consultas:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};

// GET /api/consultas/:id
export const getConsultaById = async (req, res) => {
    try {
        const { id } = req.params;
        const id_usuario = req.usuario.id_usuario;

        const consulta = await prisma.consulta.findFirst({
            where: { id_consulta: parseInt(id), id_usuario }
        });

        if (!consulta) {
            return res.status(404).json({ success: false, message: 'Consulta no encontrada.' });
        }

        res.status(200).json({ success: true, data: consulta });
    } catch (error) {
        console.error('Error al obtener consulta:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};

// DELETE /api/consultas/:id
export const deleteConsulta = async (req, res) => {
    try {
        const { id } = req.params;
        const id_usuario = req.usuario.id_usuario;

        const consulta = await prisma.consulta.findFirst({
            where: { id_consulta: parseInt(id), id_usuario }
        });

        if (!consulta) {
            return res.status(404).json({ success: false, message: 'Consulta no encontrada o no autorizada.' });
        }

        await prisma.consulta.delete({ where: { id_consulta: parseInt(id) } });

        res.status(200).json({ success: true, message: 'Consulta eliminada correctamente.' });
    } catch (error) {
        console.error('Error al eliminar consulta:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};
