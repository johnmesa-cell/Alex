export const requireAdmin = (req, res, next) => {
  // Verificar que el usuario esté autenticado
  if (!req.usuario) {
    return res.status(401).json({ success: false, message: 'No autenticado' });
  }

  // Verificar que el rol es admin (idRol = 1)
  // Usar Number() para convertir string a número y evitar comparaciones falsas
  if (Number(req.usuario.idRol) !== 1) {
    return res.status(403).json({ success: false, message: 'Acceso denegado: se requiere rol administrador' });
  }

  next();
};
