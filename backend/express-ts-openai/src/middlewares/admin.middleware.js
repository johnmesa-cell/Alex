export const requireAdmin = (req, res, next) => {
  // Verificar que el usuario esté autenticado (verifyToken debe correr antes)
  if (!req.usuario) {
    return res.status(401).json({ success: false, message: 'No autenticado' });
  }

  // FIX Bug 3: el rol admin en BD es 2, no 1.
  // Se revisan tanto idRol como roleId para cubrir tokens legacy y nuevos.
  const rolId = Number(
    req.usuario.idRol ?? 
    req.usuario.roleId ?? 
    req.usuario.id_rol ?? 
    req.usuario.rol
  );
  if (rolId !== 2) {
    return res.status(403).json({ success: false, message: 'Acceso denegado: se requiere rol administrador' });
  }

  next();
};
