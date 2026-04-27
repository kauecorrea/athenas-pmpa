import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const ditelId = '69cfe4aa03b35075601063b2';
  
  // Verify if DITEL exists just in case
  const ditel = await prisma.unidade.findUnique({
    where: { id: ditelId },
  });

  if (!ditel) {
    console.error('Unidade DITEL não encontrada com o ID fornecido.');
    return;
  }

  console.log('Iniciando migração de TODOS os equipamentos para a unidade DITEL...');

  const result = await prisma.equipamento.updateMany({
    data: {
      unidadeId: ditelId,
    },
  });

  console.log(`Sucesso! ${result.count} equipamentos atualizados para DITEL.`);
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
