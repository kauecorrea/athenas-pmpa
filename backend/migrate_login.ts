import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando migração de e-mail para login...');
  const usuarios = await prisma.usuario.findMany();

  let migrados = 0;
  for (const user of usuarios) {
    if (!user.login && user.email) {
      await prisma.usuario.update({
        where: { id: user.id },
        data: { login: user.email }
      });
      console.log(`Usuário ${user.nomeCompleto} migrado. Login: ${user.email}`);
      migrados++;
    }
  }
  
  console.log(`Migração concluída com sucesso. ${migrados} usuários atualizados.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
