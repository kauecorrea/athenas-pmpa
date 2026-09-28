/**
 * @file prisma.ts
 * @description Singleton para o Prisma Client.
 * Evita a exaustão de conexões com o banco de dados (Connection Pool Exhaustion)
 * ao reutilizar uma única instância do Prisma Client em toda a aplicação.
 */

import { PrismaClient } from '@prisma/client';

let config: any = {};
if (process.env.NODE_ENV === 'test') {
  if (!process.env.TEST_DATABASE_URL) {
    console.error("FATAL: TEST_DATABASE_URL não configurada. Abortando testes para não afetar banco de produção.");
    process.exit(1);
  }
  config = {
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL
      }
    }
  };
}

const prisma = new PrismaClient(config);

export default prisma;
