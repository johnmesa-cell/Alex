// 📚 EJEMPLO: Cómo usar el middleware de autenticación en tus propias rutas

import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// =====================================
// 1️⃣ Ruta Protegida (Requiere token)
// =====================================

router.get('/mi-perfil', authMiddleware.verifyToken, async (req, res) => {
  try {
    // req.usuario contiene la información del token decodificado
    const { idusuario, correo, nombre, idrol } = req.usuario;
    
    return res.status(200).json({
      success: true,
      message: 'Información del perfil',
      data: {
        idusuario,
        correo,
        nombre,
        idrol,
        mensaje: `Hola ${nombre}, eres usuario autenticado`
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error.message
    });
  }
});

// =====================================
// 2️⃣ Ruta Protegida por Rol (Solo Admin)
// =====================================

router.get('/dashboard-admin', 
  authMiddleware.verifyToken,
  authMiddleware.verifyRole(['admin']),
  async (req, res) => {
    try {
      return res.status(200).json({
        success: true,
        message: 'Bienvenido al dashboard de administrador',
        data: {
          usuario: req.usuario.nombre,
          rol: req.usuario.nombrerol
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error en dashboard admin',
        error: error.message
      });
    }
  }
);

// =====================================
// 3️⃣ Ruta Protegida por Múltiples Roles
// =====================================

router.get('/content-management', 
  authMiddleware.verifyToken,
  authMiddleware.verifyRole(['admin', 'moderador', 'editor']),
  async (req, res) => {
    try {
      return res.status(200).json({
        success: true,
        message: 'Acceso a gestión de contenido',
        data: {
          usuario: req.usuario.nombre,
          rol: req.usuario.nombrerol,
          permisos: ['crear', 'editar', 'publicar']
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error en gestión de contenido',
        error: error.message
      });
    }
  }
);

// =====================================
// 4️⃣ Ruta Pública (Sin autenticación)
// =====================================

router.get('/informacion-publica', async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Información pública disponible para todos',
      data: {
        titulo: 'Información de ALEX',
        descripcion: 'Sistema de IA asistente'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener información',
      error: error.message
    });
  }
});

// =====================================
// 5️⃣ ACCESO A INFORMACIÓN DEL USUARIO AUTENTICADO
// =====================================

router.post('/crear-consulta',
  authMiddleware.verifyToken,
  async (req, res) => {
    try {
      const { idusuario } = req.usuario;  // ⭐ Aquí obtienes el ID del usuario
      const { pregunta, tema } = req.body;

      // Puedes usar idusuario para guardar datos asociados al usuario
      // Ejemplo: await prisma.consulta.create({
      //   data: {
      //     idusuario: idusuario,
      //     pregunta,
      //     tema
      //   }
      // });

      return res.status(201).json({
        success: true,
        message: 'Consulta creada exitosamente',
        data: {
          idusuario,
          pregunta,
          tema
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al crear consulta',
        error: error.message
      });
    }
  }
);

export default router;

/*
=====================================
📋 GUÍA RÁPIDA DE USO:
=====================================

✅ SINTAXIS BÁSICA:
  router.get('/ruta', 
    authMiddleware.verifyToken,        // Requiere token válido
    authMiddleware.verifyRole(['role']), // (opcional) Requiere rol específico
    controllerFunction                 // Tu función del controlador
  );

✅ INFORMACIÓN DISPONIBLE:
  req.usuario = {
    idusuario: número,
    correo: string,
    nombre: string,
    idrol: número,
    nombrerol: string
  }

  req.token = el JWT completo

✅ EJEMPLOS DE ROLES:
  - 'admin'
  - 'moderador'
  - 'usuario'
  - (depende de tu base de datos)

✅ FLUJO TÍPICO:
  1. Cliente hace petición con header Authorization
  2. verifyToken decodifica y valida el JWT
  3. verifyRole (opcional) verifica permisos
  4. Tu función maneja la lógica

✅ ERRORES AUTOMÁTICOS:
  - Sin token → 401 (Unauthorized)
  - Token expirado → 401 (Token expirado)
  - Token inválido → 401 (Token inválido)
  - Rol insuficiente → 403 (Forbidden)

*/
