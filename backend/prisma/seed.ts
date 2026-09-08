import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Criar uma Unidade inicial
  const unidade = await prisma.unidade.upsert({
    where: { nome: 'DITEL' },
    update: {},
    create: {
      nome: 'DITEL',
      sigla: 'DITEL',
      localizacao: 'Quartel General',
    }
  });
  console.log('Seed: Unidade inicial criada/atualizada:', unidade.nome);

  const existingAdmin = await prisma.usuario.findFirst({
    where: { permissao: 'Administrador' }
  });

  if (existingAdmin) {
    console.log('Seed: Administrador ja existente. Pulo da criacao do admin de bootstrap.');
    return;
  }

  const rawAdminLogin = process.env.ADMIN_LOGIN;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!rawAdminLogin || !adminPassword) {
    console.error('ERRO CRITICO: Variaveis ADMIN_LOGIN e ADMIN_PASSWORD nao fornecidas no ambiente.');
    console.error('Por medidas de seguranca, o bootstrap foi abortado.');
    process.exit(1);
  }

  const adminLogin = rawAdminLogin.trim().toLowerCase();

  if (adminPassword.length < 10) {
    console.error('ERRO CRITICO: A senha do administrador deve ter pelo menos 10 caracteres.');
    process.exit(1);
  }



  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Criar Usuário Admin Inicial
  const admin = await prisma.usuario.create({
    data: {
      login: adminLogin,
      senha: hashedPassword,
      nomeCompleto: 'Administrador Bootstrap',
      nomeGuerra: 'ADMIN',
      posto: 'Não Informado',
      unidade: 'DITEL',
      permissao: 'Administrador'
    },
  })

  console.log('Seed: Usuário Admin Bootstrap criado com sucesso.');


}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
