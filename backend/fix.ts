import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const t = await prisma.transferencia.findMany({
    include: { equipamentos: true }
  });
  console.log('Transferencias: ', JSON.stringify(t, null, 2));

  const c = await prisma.cautela.findMany({
    where: { status: 'ATIVA' },
    include: { equipamentos: true }
  });
  console.log('Cautelas Ativas: ', JSON.stringify(c, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
