const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)

  // Criar Usuário Admin (Simples, sem upsert para evitar transações se possível)
  const existingUser = await prisma.usuario.findUnique({
    where: { email: 'admin@pmpa.pa.gov.br' }
  })

  if (!existingUser) {
    const admin = await prisma.usuario.create({
      data: {
        email: 'admin@pmpa.pa.gov.br',
        senha: hashedPassword,
        nomeCompleto: 'Administrador do Sistema',
        nomeGuerra: 'ADMIN',
        posto: 'Maj QOPM',
        unidade: 'DITEL',
        permissao: 'Administrador'
      }
    })
    console.log('Seed JS: Usuário Admin criado:', admin.email)
  } else {
    console.log('Seed JS: Usuário Admin já existe:', existingUser.email)
  }

  // Criar uma Unidade inicial
  const existingUnidade = await prisma.unidade.findFirst({
    where: { nome: 'DITEL' }
  })

  if (!existingUnidade) {
    const unidade = await prisma.unidade.create({
      data: {
        nome: 'DITEL',
        sigla: 'DITEL',
        localizacao: 'Quartel General',
      }
    })
    console.log('Seed JS: Unidade inicial criada:', unidade.nome)
  } else {
    console.log('Seed JS: Unidade já existe:', existingUnidade.nome)
  }
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
