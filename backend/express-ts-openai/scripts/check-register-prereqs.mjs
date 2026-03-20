import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    const role = await prisma.rol.findFirst({ where: { nombre_rol: 'usuario' } });
    console.log('OK_DB=true');
    console.log('ROLE_USUARIO=', role);
  } catch (error) {
    console.log('OK_DB=false');
    console.log('ERROR=', error?.message || String(error));
  } finally {
    await prisma.$disconnect();
  }
}

main();
