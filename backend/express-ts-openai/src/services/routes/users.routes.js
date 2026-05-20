import { Router } from 'express';
import { verifyToken } from '../../middlewares/auth.middleware.js';
import { prisma } from '../prisma.client.js';

const router = Router();

// PUT /api/users/:id — actualiza el nombre del usuario autenticado
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const paramId   = parseInt(req.params.id, 10);
        const tokenId   = req.usuario?.id_usuario;

        // Un usuario solo puede editar su propio perfil
        if (!tokenId || paramId !== tokenId) {
            return res.status(403).json({ success: false, message: 'No autorizado para modificar este perfil.' });
        }

        const { nombre } = req.body ?? {};

        if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
            return res.status(400).json({ success: false, message: 'El nombre no puede estar vacío.' });
        }

        const nombreTrimmed = nombre.trim();
        if (nombreTrimmed.length < 2 || nombreTrimmed.length > 100) {
            return res.status(400).json({ success: false, message: 'El nombre debe tener entre 2 y 100 caracteres.' });
        }

        const updated = await prisma.usuario.update({
            where: { id_usuario: tokenId },
            data:  { nombre: nombreTrimmed },
            select: {
                id_usuario:     true,
                nombre:         true,
                correo:         true,
                id_rol:         true,
                fecha_registro: true,
                ultimo_login:   true,
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Perfil actualizado correctamente.',
            data: { user: updated }
        });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});

export function setUsersRoutes(app) {
    app.use('/api/users', router);
}
