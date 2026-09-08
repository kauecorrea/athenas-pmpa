import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find users where email is null, undefined, empty string, or only whitespace
  const users = await prisma.usuario.findMany({
    where: {
      OR: [
        { email: null },
        { email: '' },
        { email: { equals: ' ', mode: 'insensitive' } },
      ],
    },
  });

  if (users.length === 0) {
    console.log('Nenhum usuário sem e‑mail encontrado.');
    return;
  }

  console.log(`Encontrados ${users.length} usuários sem e‑mail. Atualizando...`);

  for (const user of users) {
    // Normalizar removendo eventuais espaços
    const cleanedEmail = (user.email ?? '').trim();
    if (cleanedEmail) {
      // Caso o e‑mail contenha apenas espaços, atualiza para null
      await prisma.usuario.update({
        where: { id: user.id },
        data: { email: null },
      });
      console.log(`Usuário ${user.id}: e‑mail definido como null.`);
    } else {
      // Já está null ou vazio, garantir null explicitamente
      await prisma.usuario.update({
        where: { id: user.id },
        data: { email: null },
      });
      console.log(`Usuário ${user.id}: e‑mail garantido como null.`);
    }
  }

  console.log('Migração de e‑mail concluída.');
}

main()
  .catch((e) => {
    console.error('Erro durante a migração de e‑mail:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
