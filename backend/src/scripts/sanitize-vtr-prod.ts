// @ts-nocheck
import { MongoClient, ObjectId } from 'mongodb';

const url = "mongodb+srv://pmpa_admin:c3ntr0d3%21nf0rm%40t%21c%40@pmpa-cluster.wd0jmhs.mongodb.net/pmpa_radios?appName=pmpa-cluster";
const dbName = 'pmpa_radios';

async function sanitizeAll() {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const manutencaoColl = db.collection('ManutencaoVTR');

    const agora = new Date();

    console.log("Iniciando saneamento total dos dados de VTR...");

    // 1. Corrigir dataServico nula (Prisma exige DateTime obrigatório)
    const resData = await manutencaoColl.updateMany(
      { $or: [ { dataServico: null }, { dataServico: { $exists: false } } ] },
      { $set: { dataServico: agora } }
    );
    console.log(`- Datas de Serviço corrigidas: ${resData.modifiedCount}`);

    // 2. Corrigir dataCriacao nula
    const resCriacao = await manutencaoColl.updateMany(
      { $or: [ { dataCriacao: null }, { dataCriacao: { $exists: false } } ] },
      { $set: { dataCriacao: agora } }
    );
    console.log(`- Datas de Criação corrigidas: ${resCriacao.modifiedCount}`);

    // 3. Garantir que unidadeId seja ObjectId
    const cursor = manutencaoColl.find({ unidadeId: { $type: "string" } });
    const docs = await cursor.toArray();
    let idsCorrigidos = 0;
    for (const doc of docs) {
      if (ObjectId.isValid(doc.unidadeId)) {
        await manutencaoColl.updateOne(
          { _id: doc._id },
          { $set: { unidadeId: new ObjectId(doc.unidadeId) } }
        );
        idsCorrigidos++;
      }
    }
    console.log(`- IDs de Unidade convertidos para ObjectId: ${idsCorrigidos}`);

    console.log("Saneamento concluído! O Erro 500 deve sumir agora.");

  } catch (err) {
    console.error("Erro no saneamento:", err);
  } finally {
    await client.close();
  }
}

sanitizeAll();
