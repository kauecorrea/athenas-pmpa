const { MongoClient } = require('mongodb')

async function main() {
  const url = 'mongodb://localhost:27018'
  const client = new MongoClient(url, { directConnection: true })

  try {
    await client.connect()
    console.log('Conectado ao MongoDB para inicialização do Replica Set')

    const adminDb = client.db('admin')
    const result = await adminDb.command({ replSetInitiate: { _id: 'rs0', members: [{ _id: 0, host: 'localhost:27018' }] } })
    console.log('Replica Set inicializado:', result)

  } catch (err) {
    if (err.message && err.message.includes('already initialized')) {
        console.log('Replica Set já está inicializado.')
    } else {
        console.error('Erro ao inicializar Replica Set:', err)
    }
  } finally {
    await client.close()
  }
}

main()
