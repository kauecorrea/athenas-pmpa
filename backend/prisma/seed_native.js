const { MongoClient } = require('mongodb')
const bcrypt = require('bcryptjs')
require('dotenv').config()

async function main() {
  const url = process.env.DATABASE_URL
  const client = new MongoClient(url)

  try {
    await client.connect()
    console.log('Seed Native: Conectado ao MongoDB')

    const db = client.db() // Pega o banco da URL
    const usuarios = db.collection('Usuario')
    const unidades = db.collection('Unidade')

    const hashedPassword = await bcrypt.hash('admin123', 10)

    // Criar Usuário Admin
    const existingUser = await usuarios.findOne({ email: 'admin@pmpa.pa.gov.br' })
    if (!existingUser) {
      const result = await usuarios.insertOne({
        email: 'admin@pmpa.pa.gov.br',
        senha: hashedPassword,
        nomeCompleto: 'Administrador do Sistema',
        nomeGuerra: 'ADMIN',
        posto: 'Maj QOPM',
        unidade: 'DITEL',
        permissao: 'Administrador',
        dataCadastro: new Date()
      })
      console.log('Seed Native: Usuário Admin criado:', result.insertedId)
    } else {
      console.log('Seed Native: Usuário Admin já existe')
    }

    // Criar Unidade inicial
    const existingUnidade = await unidades.findOne({ nome: 'DITEL' })
    if (!existingUnidade) {
      const result = await unidades.insertOne({
        nome: 'DITEL',
        sigla: 'DITEL',
        localizacao: 'Quartel General'
      })
      console.log('Seed Native: Unidade inicial criada:', result.insertedId)
    } else {
      console.log('Seed Native: Unidade já existe')
    }

  } catch (err) {
    console.error('Seed Native Erro:', err)
  } finally {
    await client.close()
  }
}

main()
