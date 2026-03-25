import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const equipamentos = await prisma.equipamento.findMany();
    console.log('Equipamentos encontrados:', equipamentos.length);
  } catch (err: any) {
    console.error('ERRO NO PRISMA:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
