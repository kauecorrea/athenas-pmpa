// @ts-nocheck
import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

// Extrair URL do banco sem os parâmetros do Prisma se necessário
const pass = encodeURIComponent("c3ntr0d3!nf0rm@t!c@");
const url = `mongodb+srv://pmpa_admin:${pass}@pmpa-cluster.wd0jmhs.mongodb.net/pmpa_radios?appName=pmpa-cluster`;
const dbName = 'pmpa_radios';

function decodeUTF7(text: string): string {
  if (!text) return '';
  return text
    .replace(/\+AHw-/g, '|')
    .replace(/\+ALo-/g, 'º')
    .replace(/\+ALA-/g, 'º')
    .replace(/\+AOcA4w-/g, 'ção')
    .replace(/\+AOc-/g, 'ç')
    .replace(/\+AOM-/g, 'ã')
    .replace(/\+AME-/g, 'Á')
    .replace(/\+AOE-/g, 'á')
    .replace(/\+AOo-/g, 'ê')
    .replace(/\+AOk-/g, 'é')
    .replace(/\+APM-/g, 'ó')
    .replace(/\+ANM-/g, 'ó')
    .replace(/\+AM0-/g, 'í')
    .replace(/\+APU-/g, 'õ')
    .replace(/\+AMc-/g, 'ç')
    .replace(/\+AOA-/g, 'à')
    .replace(/\+AOE-/g, 'á')
    .replace(/\+AOk-/g, 'é')
    .replace(/\+AOM-/g, 'ã')
    .replace(/\+AEM-/g, 'É')
    .replace(/\+AOM-/g, 'ã')
    .trim();
}

async function migrate() {
  const filePath = path.join('C:', 'Users', 'Kauê', 'Desktop', 'Tab_VTR.txt');
  
  if (!fs.existsSync(filePath)) {
    console.error('Arquivo não encontrado no Desktop!');
    return;
  }

  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const manutencaoColl = db.collection('ManutencaoVTR');
    const unidadesColl = db.collection('Unidade');

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    console.log(`Iniciando migração de ${lines.length} linhas via Native Driver...`);

    const unitsCache: Record<string, string> = {};
    const servicosChecklist = [
      'Prog. e padro. de Freq. Radio HTs',
      'Prog. e padro. de Freq. Radio Fixo',
      'Manut. Corret. Radio HT (Terceiros)',
      'Manut. Corret. Radio Movel (Terceir)',
      'Vist. Ánalise de Radio Moveis',
      'Prog. Padro. de Radio Movel',
      'Vist. Radio Fixos',
      'Vist. e Ánalise de Radio',
      'Vist. Radio Portateis',
      'Manut. Corret. Antena Base Fixa',
      'Manut. Corret. Antena VTR',
      'Levant. Situa. Rede Radio'
    ];

    let sucessos = 0;
    let erros = 0;

    for (const line of lines) {
      if (line.includes('-----') || line.includes('Orden') || !line.trim()) continue;

      const parts = line.split('+AHw-').map(p => decodeUTF7(p));
      const osNumero = parseInt(parts[1]);
      if (isNaN(osNumero)) continue;

      const unidadeNome = parts[2] || 'Sede';
      const tecnico = parts[3] || '';
      const defeitoReclamado = parts[4] || '';
      const solicitante = parts[5] || '';
      const placaVrt = parts[6] || '';
      const prefixo = parts[7] || '';
      const modeloRadio = parts[8] || '';
      const paeNumero = parts[9] || '';
      const dataStr = parts[12];
      const kmVrt = parseInt(parts[13]) || 0;
      const numSerieRadio = parts[14] || '';
      const defeitoConstatado = parts[15] || '';
      const solucao = parts[16] || '';

      const servicosRealizados: string[] = [];
      for (let i = 0; i < 12; i++) {
        const val = parts[17 + i];
        if (val && val.toLowerCase().includes('sim')) {
          servicosRealizados.push(servicosChecklist[i]);
        }
      }

      try {
        // Resolver Unidade
        let unidadeId = unitsCache[unidadeNome];
        if (!unidadeId) {
          let uni = await unidadesColl.findOne({ nome: { $regex: new RegExp(`^${unidadeNome}$`, 'i') } });
          if (!uni) {
            const res = await unidadesColl.insertOne({ nome: unidadeNome, createdAt: new Date(), updatedAt: new Date() });
            unidadeId = res.insertedId.toString();
          } else {
            unidadeId = uni._id.toString();
          }
          unitsCache[unidadeNome] = unidadeId;
        }

        // Formatar Data
        let dataServico: Date | null = null;
        if (dataStr) {
          const [d, m, y] = dataStr.split('/');
          if (d && m && y) {
            dataServico = new Date(`${y}-${m}-${d}T12:00:00Z`);
          }
        }

        // Upsert Manutenção
        await manutencaoColl.updateOne(
          { osNumero },
          {
            $set: {
              osNumero,
              paeNumero,
              dataServico,
              unidadeId,
              solicitante,
              tecnico,
              placaVrt,
              prefixo,
              kmVrt,
              modeloRadio,
              numSerieRadio,
              defeitoReclamado,
              defeitoConstatado,
              solucao,
              servicos: servicosRealizados,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          },
          { upsert: true }
        );

        sucessos++;
        if (sucessos % 50 === 0) console.log(`Progresso: ${sucessos} migrados...`);
      } catch (e) {
        console.error(`Erro na OS ${osNumero}:`, e.message);
        erros++;
      }
    }

    console.log(`\nMigração concluída!`);
    console.log(`Sucessos: ${sucessos}`);
    console.log(`Erros: ${erros}`);

  } finally {
    await client.close();
  }
}

migrate();
