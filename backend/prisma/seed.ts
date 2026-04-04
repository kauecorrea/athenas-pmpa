import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)

  // Criar Usuário Admin
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@pmpa.pa.gov.br' },
    update: {},
    create: {
      email: 'admin@pmpa.pa.gov.br',
      senha: hashedPassword,
      nomeCompleto: 'Administrador do Sistema',
      nomeGuerra: 'ADMIN',
      posto: 'Maj QOPM',
      unidade: 'DITEL',
      permissao: 'Administrador'
    },
  })

  console.log('Seed: Usuário Admin criado/atualizado:', admin.email)

  // Criar uma Unidade inicial
  const unidade = await prisma.unidade.upsert({
    where: { nome: 'DITEL' },
    update: {},
    create: {
      nome: 'DITEL',
      sigla: 'DITEL',
      localizacao: 'Quartel General',
    }
  })

  console.log('Seed: Unidade inicial criada/atualizada:', unidade.nome)
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
