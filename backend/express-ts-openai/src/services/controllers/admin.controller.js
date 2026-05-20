import { prisma } from '../prisma.client.js';

// ── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const [totalUsuarios, sesionesActivas, consultasAbiertas, totalReportes] = await Promise.all([
      prisma.usuario.count(),
      prisma.sesion.count({ where: { fecha_expiracion: { gt: now } } }),
      prisma.consulta.count({ where: { estado: 'abierta' } }),
      prisma.reportes.count()
    ]);
    res.json({ success: true, data: { totalUsuarios, sesionesActivas, consultasAbiertas, totalReportes } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al cargar dashboard', error: err.message });
  }
};

// ── Usuarios ─────────────────────────────────────────────────────────────────
export const getUsuarios = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  || '1'));
    const limit  = Math.min(50, parseInt(req.query.limit || '20'));
    const skip   = (page - 1) * limit;
    const search = req.query.search || '';

    const where = search
      ? { OR: [{ nombre: { contains: search, mode: 'insensitive' } }, { correo: { contains: search, mode: 'insensitive' } }] }
      : {};

    const [total, usuarios] = await Promise.all([
      prisma.usuario.count({ where }),
      prisma.usuario.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fecha_registro: 'desc' },
        select: {
          id_usuario: true,
          nombre: true,
          correo: true,
          estado: true,
          fecha_registro: true,
          ultimo_login: true,
          roles: { select: { nombre_rol: true } }
        }
      })
    ]);

    res.json({ success: true, data: { usuarios, total, page, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al cargar usuarios', error: err.message });
  }
};

export const updateUsuario = async (req, res) => {
  try {
    const id     = parseInt(req.params.id);
    const { estado, id_rol } = req.body;
    const data = {};
    if (estado)  data.estado  = estado;
    if (id_rol)  data.id_rol  = parseInt(id_rol);

    const updated = await prisma.usuario.update({
      where: { id_usuario: id },
      data,
      select: { id_usuario: true, nombre: true, correo: true, estado: true, id_rol: true }
    });

    // Auditoría — usar req.usuario.id_usuario (asignado por verifyToken)
    await prisma.auditoria.create({
      data: {
        id_usuario: req.usuario.id_usuario,
        accion: 'UPDATE_USUARIO',
        tabla_afectada: 'usuario',
        id_registro_afectado: id,
        valor_nuevo: JSON.stringify(data),
        ip: req.ip
      }
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al actualizar usuario', error: err.message });
  }
};

// ── Sesiones activas ──────────────────────────────────────────────────────────
export const getSesionesActivas = async (req, res) => {
  try {
    const now = new Date();
    const sesiones = await prisma.sesion.findMany({
      where: { fecha_expiracion: { gt: now } },
      orderBy: { ultima_actividad: 'desc' },
      take: 100,
      include: { usuario: { select: { nombre: true, correo: true } } }
    });
    res.json({ success: true, data: sesiones });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al cargar sesiones', error: err.message });
  }
};

export const cerrarSesion = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.sesion.delete({ where: { id_sesion: id } });

    // Auditoría — usar req.usuario.id_usuario (asignado por verifyToken)
    await prisma.auditoria.create({
      data: {
        id_usuario: req.usuario.id_usuario,
        accion: 'FORCE_LOGOUT',
        tabla_afectada: 'sesiones',
        id_registro_afectado: id,
        ip: req.ip
      }
    });
    res.json({ success: true, message: 'Sesión cerrada' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al cerrar sesión', error: err.message });
  }
};

// ── Auditoría ─────────────────────────────────────────────────────────────────
export const getAuditoria = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  || '1'));
    const limit = Math.min(100, parseInt(req.query.limit || '30'));
    const skip  = (page - 1) * limit;

    const [total, eventos] = await Promise.all([
      prisma.auditoria.count(),
      prisma.auditoria.findMany({
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: { usuario: { select: { nombre: true, correo: true } } }
      })
    ]);

    res.json({ success: true, data: { eventos, total, page, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al cargar auditoría', error: err.message });
  }
};

// ── Consultas ──────────────────────────────────────────────────────────────────
export const getConsultas = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  || '1'));
    const limit  = Math.min(50, parseInt(req.query.limit || '20'));
    const skip   = (page - 1) * limit;
    const estado = req.query.estado || '';

    const where = estado ? { estado } : {};

    const [total, consultas] = await Promise.all([
      prisma.consulta.count({ where }),
      prisma.consulta.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fecha_creacion: 'desc' },
        include: { usuario: { select: { nombre: true, correo: true } } }
      })
    ]);

    res.json({ success: true, data: { consultas, total, page, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al cargar consultas', error: err.message });
  }
};
