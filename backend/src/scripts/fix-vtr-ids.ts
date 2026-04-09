// @ts-nocheck
import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

const url = "mongodb+srv://pmpa_admin:c3ntr0d3%21nf0rm%40t%21c%40@pmpa-cluster.wd0jmhs.mongodb.net/pmpa_radios?appName=pmpa-cluster";
const dbName = 'pmpa_radios';

async function fixData() {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const manutencaoColl = db.collection('ManutencaoVTR');

    console.log("Buscando registros para correção...");
    const cursor = manutencaoColl.find({ unidadeId: { $type: "string" } });
    const docs = await cursor.toArray();

    console.log(`Corrigindo ${docs.length} registros...`);

    for (const doc of docs) {
      if (doc.unidadeId && ObjectId.isValid(doc.unidadeId)) {
        await manutencaoColl.updateOne(
          { _id: doc._id },
          { $set: { unidadeId: new ObjectId(doc.unidadeId) } }
        );
      }
    }

    console.log("Correção concluída com sucesso!");
  } catch (err) {
    console.error("Erro durante a correção:", err);
  } finally {
    await client.close();
  }
}

fixData();
