import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seeding de roles...");

  const roles = [
    { nombre_rol: "admin",   descripcion: "Administrador con acceso total al sistema" },
    { nombre_rol: "doctor",  descripcion: "Doctor/Médico autorizado" },
    { nombre_rol: "usuario", descripcion: "Usuario registrado estándar (rol por defecto)" },
    { nombre_rol: "patient", descripcion: "Paciente registrado" },
    { nombre_rol: "guest",   descripcion: "Usuario invitado sin autenticación" }
  ];

  for (const rol of roles) {
    await prisma.rol.upsert({
      where:  { nombre_rol: rol.nombre_rol },
      update: {},
      create: rol
    });
  }

  console.log("✅ Roles verificados/creados exitosamente:");
  roles.forEach(r => console.log(`   - ${r.nombre_rol}: ${r.descripcion}`));
}

main()
  .catch(e => {
    console.error("❌ Error durante el seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
