const { MongoClient } = require('mongodb')

async function main() {
  const url = 'mongodb://localhost:27017'
  const client = new MongoClient(url, { directConnection: true })

  try {
    await client.connect()
    const adminDb = client.db('admin')
    const result = await adminDb.command({
      replSetInitiate: {
        _id: 'rs0',
        members: [{ _id: 0, host: 'localhost:27017' }]
      }
    })
    console.log('Replica Set inicializado na porta 27017:', result.ok === 1 ? 'OK' : result)
  } catch (err) {
    if (err.message && err.message.includes('already initialized')) {
      console.log('Replica Set ja esta inicializado.')
    } else {
      console.error('Erro:', err.message)
    }
  } finally {
    await client.close()
  }
}

main()
