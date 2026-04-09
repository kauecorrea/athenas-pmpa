// @ts-nocheck
import { MongoClient } from 'mongodb';

const url = "mongodb+srv://pmpa_admin:c3ntr0d3%21nf0rm%40t%21c%40@pmpa-cluster.wd0jmhs.mongodb.net/pmpa_radios?appName=pmpa-cluster";
const dbName = 'pmpa_radios';

async function fixDataCriacao() {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const manutencaoColl = db.collection('ManutencaoVTR');

    console.log("Corrigindo campo 'dataCriacao' nos registros...");
    
    // Atualiza todos os documentos que NÃO têm o campo dataCriacao ou onde ele é null
    const result = await manutencaoColl.updateMany(
      { $or: [ { dataCriacao: { $exists: false } }, { dataCriacao: null } ] },
      { $set: { dataCriacao: new Date() } }
    );

    console.log(`Sucesso! ${result.modifiedCount} registros foram corrigidos.`);
  } catch (err) {
    console.error("Erro durante a correção:", err);
  } finally {
    await client.close();
  }
}

fixDataCriacao();
