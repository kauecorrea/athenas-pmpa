/**
 * @file prisma.ts
 * @description Singleton para o Prisma Client.
 * Evita a exaustão de conexões com o banco de dados (Connection Pool Exhaustion)
 * ao reutilizar uma única instância do Prisma Client em toda a aplicação.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
