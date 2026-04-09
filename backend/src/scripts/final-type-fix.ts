// @ts-nocheck
import { MongoClient, ObjectId } from 'mongodb';

const url = "mongodb+srv://pmpa_admin:c3ntr0d3%21nf0rm%40t%21c%40@pmpa-cluster.wd0jmhs.mongodb.net/pmpa_radios?appName=pmpa-cluster";
const dbName = 'pmpa_radios';

async function finalTypeFix() {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const manutencaoColl = db.collection('ManutencaoVTR');

    console.log("Iniciando conversão de tipos (Texto -> BSON)...");
    const cursor = manutencaoColl.find({});
    const docs = await cursor.toArray();

    let corrigidos = 0;
    for (const doc of docs) {
      const updates = {};
      
      // Converter unidadeId para ObjectId
      if (typeof doc.unidadeId === 'string' && ObjectId.isValid(doc.unidadeId)) {
          updates.unidadeId = new ObjectId(doc.unidadeId);
      }
      
      // Converter dataServico para Date
      if (typeof doc.dataServico === 'string') {
          const d = new Date(doc.dataServico);
          if (!isNaN(d.getTime())) updates.dataServico = d;
      } else if (!doc.dataServico || isNaN(new Date(doc.dataServico).getTime())) {
          updates.dataServico = new Date();
      }

      // Converter dataCriacao para Date
      if (typeof doc.dataCriacao === 'string') {
          const d = new Date(doc.dataCriacao);
          if (!isNaN(d.getTime())) updates.dataCriacao = d;
      } else if (!doc.dataCriacao) {
          updates.dataCriacao = new Date();
      }

      // Limpar campos de sistema legados do driver se existirem
      if (typeof doc.createdAt === 'string') updates.createdAt = new Date(doc.createdAt);
      if (typeof doc.updatedAt === 'string') updates.updatedAt = new Date(doc.updatedAt);

      if (Object.keys(updates).length > 0) {
          await manutencaoColl.updateOne({ _id: doc._id }, { $set: updates });
          corrigidos++;
      }
    }

    console.log(`Sucesso! ${corrigidos} registros foram convertidos para os tipos corretos.`);
  } catch (err) {
    console.error("Erro na conversão:", err);
  } finally {
    await client.close();
  }
}

finalTypeFix();
