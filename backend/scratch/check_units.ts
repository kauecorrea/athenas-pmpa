import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const unidades = await prisma.unidade.findMany();
  console.log('Unidades existentes:', JSON.stringify(unidades, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
