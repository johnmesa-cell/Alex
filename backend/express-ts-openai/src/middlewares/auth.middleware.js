import jwt from 'jsonwebtoken';
import config from '../config/index.js';

// CORRECCIÓN: Al decodificar el JWT, se garantiza que req.usuario.id_usuario
// siempre exista. Si el payload tiene 'sub' pero no 'id_usuario' (tokens
// generados antes de la corrección del controller), se mapea sub → id_usuario
// para mantener compatibilidad retroactiva.
function normalizePayload(decoded) {
    if (decoded && !decoded.id_usuario && decoded.sub) {
        decoded.id_usuario = decoded.sub;
    }
    return decoded;
}

export const verifyToken = (req, res, next) => {
    try {
        let token = null;

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }

        if (!token && req.cookies && req.cookies.alex_token) {
            token = req.cookies.alex_token;
        }

        if (!token) {
            return res.status(401).json({ success: false, message: 'Token no proporcionado o formato inválido' });
        }

        const decoded = jwt.verify(token, config.jwtSecret);
        req.usuario = normalizePayload(decoded);
        req.token = token;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'El token ha expirado' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Token inválido' });
        }
        return res.status(401).json({ success: false, message: 'Error al verificar el token', error: error.message });
    }
};

export const optionalToken = (req, res, next) => {
    try {
        let token = null;

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }

        if (!token && req.cookies && req.cookies.alex_token) {
            token = req.cookies.alex_token;
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, config.jwtSecret);
                req.usuario = normalizePayload(decoded);
                req.token = token;
            } catch {
                req.usuario = null;
            }
        } else {
            req.usuario = null;
        }

        next();
    } catch (error) {
        next();
    }
};

export const verifyRole = (rolesPermitidos = []) => {
    return (req, res, next) => {
        try {
            if (!req.usuario) {
                return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
            }
            if (!rolesPermitidos.includes(req.usuario.roleId)) {
                return res.status(403).json({ success: false, message: 'No tienes permisos para acceder a este recurso' });
            }
            next();
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Error al verificar permisos', error: error.message });
        }
    };
};

export default { verifyToken, optionalToken, verifyRole };
