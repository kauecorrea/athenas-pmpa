// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

function decodeUTF7(text: string): string {
  if (!text) return '';
  return text
    .replace(/\+AHw-/g, '|')
    .replace(/\+ALo-/g, 'º')
    .replace(/\+AKo-/g, 'º')
    .replace(/\+ALA-/g, 'º')
    .replace(/\+AOcA4w-/g, 'ção')
    .replace(/\+AOc-/g, 'ç')
    .replace(/\+AOM-/g, 'ã')
    .trim();
}

async function cleanAndMigrate() {
  try {
    console.log("Conectando ao banco de produção...");
    
    // 1. Limpar manutenções antigas para evitar duplicidade e erros de tipo
    console.log("Limpando registros antigos de VTR...");
    await (prisma as any).manutencaoVTR.deleteMany({});

    const filePath = path.join('C:', 'Users', 'Kauê', 'Desktop', 'Tab_VTR.txt');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    console.log(`Iniciando migração limpa de ${lines.length} linhas via PRISMA...`);

    const unidadesCache: Record<string, string> = {};
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

    for (const line of lines) {
      if (line.includes('-----') || line.includes('Orden') || !line.trim()) continue;

      const parts = line.split('+AHw-').map(p => decodeUTF7(p));
      const osNumero = parseInt(parts[1]);
      if (isNaN(osNumero)) continue;

      const unidadeNome = parts[2] || 'Sede';
      
      // Resolver Unidade via Prisma (mais robusto)
      let unidadeId = unidadesCache[unidadeNome];
      if (!unidadeId) {
        let uni = await prisma.unidade.findFirst({
           where: { nome: { equals: unidadeNome, mode: 'insensitive' } }
        });
        
        if (!uni) {
          try {
            uni = await prisma.unidade.create({ data: { nome: unidadeNome } });
          } catch (e) {
            // Se falhou ao criar, provavelmente outra linha criou agora mesmo
            uni = await prisma.unidade.findFirst({
              where: { nome: { equals: unidadeNome, mode: 'insensitive' } }
            });
          }
        }
        
        if (!uni) throw new Error(`Não foi possível resolver a unidade: ${unidadeNome}`);
        
        unidadeId = uni.id;
        unidadesCache[unidadeNome] = unidadeId;
      }

      const dataStr = parts[12];
      let dataServico = new Date();
      if (dataStr) {
        const [d, m, y] = dataStr.split('/');
        if (d && m && y) {
           dataServico = new Date(`${y}-${m}-${d}T12:00:00Z`);
        }
      }

      const servicosRealizados: string[] = [];
      for (let i = 0; i < 12; i++) {
        const val = parts[17 + i];
        if (val && val.toLowerCase().includes('sim')) {
          servicosRealizados.push(servicosChecklist[i]);
        }
      }

      await (prisma as any).manutencaoVTR.create({
        data: {
          osNumero,
          paeNumero: parts[9] || '',
          dataServico,
          unidadeId,
          solicitante: parts[5] || '',
          tecnico: parts[3] || '',
          placaVrt: parts[6] || '',
          prefixo: parts[7] || '',
          kmVrt: parseInt(parts[13]) || 0,
          modeloRadio: parts[8] || '',
          numSerieRadio: parts[14] || '',
          defeitoReclamado: parts[4] || '',
          defeitoConstatado: parts[15] || '',
          solucao: parts[16] || '',
          servicos: servicosRealizados
        }
      });

      sucessos++;
      if (sucessos % 50 === 0) console.log(`Progresso: ${sucessos} migrados...`);
    }

    console.log(`\nMigração FINAL concluída com sucesso! Total: ${sucessos}`);

  } catch (err) {
    console.error("Erro crítico na migração:", err);
  } finally {
    await prisma.$disconnect();
  }
}

cleanAndMigrate();
