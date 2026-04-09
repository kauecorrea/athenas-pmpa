// @ts-nocheck
import { MongoClient } from 'mongodb';

const url = "mongodb+srv://pmpa_admin:c3ntr0d3%21nf0rm%40t%21c%40@pmpa-cluster.wd0jmhs.mongodb.net/pmpa_radios?appName=pmpa-cluster";
const dbName = 'pmpa_radios';

async function biopsy() {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const manutencaoColl = db.collection('ManutencaoVTR');

    const doc = await manutencaoColl.findOne({ osNumero: 476 });
    
    console.log("Inspeção da OS 476:");
    console.log(JSON.stringify(doc, (key, value) => {
        if (value instanceof Date) return `Date(${value.toISOString()})`;
        return value;
    }, 2));
    
    console.log("\nLista de chaves encontradas no documento:");
    console.log(Object.keys(doc));

  } catch (err) {
    console.error("Erro na biópsia:", err);
  } finally {
    await client.close();
  }
}

biopsy();
