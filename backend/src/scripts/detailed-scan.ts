// @ts-nocheck
import { MongoClient } from 'mongodb';

const url = "mongodb+srv://pmpa_admin:c3ntr0d3%21nf0rm%40t%21c%40@pmpa-cluster.wd0jmhs.mongodb.net/?appName=pmpa-cluster";

async function detailedScan() {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const adminDb = client.db().admin();
    const dbs = await adminDb.listDatabases();
    
    for (const dbInfo of dbs.databases) {
      if (['admin', 'local', 'config'].includes(dbInfo.name)) continue;
      
      const db = client.db(dbInfo.name);
      const collections = await db.listCollections().toArray();
      console.log(`\nBanco: ${dbInfo.name}`);
      
      for (const col of collections) {
          const count = await db.collection(col.name).countDocuments();
          console.log(`  - ${col.name}: ${count} registros`);
      }
    }
  } catch (err) {
    console.error("Erro no escaneamento detatalhado:", err);
  } finally {
    await client.close();
  }
}

detailedScan();
