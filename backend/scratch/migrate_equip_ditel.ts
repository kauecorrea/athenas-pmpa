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
    process.exit(1);
  }

  console.log('Iniciando migração de equipamentos para a unidade DITEL...');

  const result = await prisma.equipamento.updateMany({
    where: {
      OR: [
        { unidadeId: null },
        { unidadeId: { isSet: false } as any } // Handling potential MongoDB oddity if needed
      ]
    },
    data: {
      unidadeId: ditelId,
    },
  });

  // Alternative: update ALL as requested "Todos os rádios atuais, coloque que pertence a unidade DITEL"
  const allResult = await prisma.equipamento.updateMany({
    data: {
      unidadeId: ditelId,
    },
  });

  console.log(`Sucesso! ${allResult.count} equipamentos atualizados para DITEL.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
