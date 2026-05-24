import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔄 Iniciando creación del usuario administrador...\n');

    // 1. Hash de la contraseña
    const password = 'Admin2026*';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    console.log('✔️ Contraseña hasheada correctamente');

    // 2. Buscar el rol admin
    const adminRole = await prisma.rol.findUnique({
      where: {
        nombre_rol: 'admin',
      },
    });

    if (!adminRole) {
      console.error('❌ El rol "admin" no existe en la base de datos');
      process.exit(1);
    }
    console.log(`✔️ Rol admin encontrado (ID: ${adminRole.id_rol})\n`);

    // 3. Verificar si el usuario ya existe
    const email = 'admin@alex.megiddo20.me';
    const existingUser = await prisma.usuario.findUnique({
      where: {
        correo: email,
      },
    });

    if (existingUser) {
      console.log('⚠️  El usuario ya existe:');
      console.log(`   Email: ${existingUser.correo}`);
      console.log(`   ID: ${existingUser.id_usuario}`);
      console.log(`   Rol ID: ${existingUser.id_rol}`);
      console.log(`   Estado: ${existingUser.estado}`);
      process.exit(0);
    }

    // 4. Crear el usuario admin
    const newAdmin = await prisma.usuario.create({
      data: {
        correo: email,
        nombre: 'Administrador',
        password_hash: passwordHash,
        id_rol: adminRole.id_rol,
        estado: 'activo',
      },
    });

    console.log('✅ Usuario admin creado exitosamente\n');
    console.log('📋 Detalles de la cuenta:');
    console.log(`   Email: ${newAdmin.correo}`);
    console.log(`   Contraseña (texto plano): ${password}`);
    console.log(`   ID Usuario: ${newAdmin.id_usuario}`);
    console.log(`   Rol ID: ${newAdmin.id_rol}`);
    console.log(`   Estado: ${newAdmin.estado}`);
    console.log(`   Fecha de registro: ${newAdmin.fecha_registro}\n`);
  } catch (error) {
    console.error('❌ Error durante la creación del usuario admin:');
    console.error(error.message);
    process.exit(1);
  } finally {
    // 5. Cerrar la conexión de Prisma
    await prisma.$disconnect();
  }
}

createAdmin();
