// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function test() {
  try {
    console.log("Tentando buscar manutenções...");
    const counts = await (prisma as any).manutencaoVTR.count();
    console.log(`Total de manutenções no banco: ${counts}`);

    const data = await (prisma as any).manutencaoVTR.findMany({
      include: { unidade: true },
      take: 5
    });

    console.log("Busca realizada com sucesso!");
    console.log(JSON.stringify(data[0], null, 2));
  } catch (err) {
    console.error("ERRO DETECTADO:");
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
