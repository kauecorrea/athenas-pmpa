// @ts-nocheck
import { MongoClient } from 'mongodb';

const url = "mongodb+srv://pmpa_admin:c3ntr0d3%21nf0rm%40t%21c%40@pmpa-cluster.wd0jmhs.mongodb.net/?appName=pmpa-cluster";

async function scanDatabases() {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const adminDb = client.db().admin();
    const dbs = await adminDb.listDatabases();
    
    console.log("Bancos de dados encontrados:");
    for (const dbInfo of dbs.databases) {
      const db = client.db(dbInfo.name);
      const collections = await db.listCollections().toArray();
      const colNames = collections.map(c => c.name);
      
      console.log(`- ${dbInfo.name} (${colNames.join(', ')})`);
      
      // Se encontrar a coleção 'Militar', vamos ver quantos tem
      if (colNames.includes('Militar')) {
          const count = await db.collection('Militar').countDocuments();
          console.log(`  >>> ESTE PARECE O BANCO CORRETO! Militares: ${count}`);
      }
    }
  } catch (err) {
    console.error("Erro ao escanear:", err);
  } finally {
    await client.close();
  }
}

scanDatabases();
