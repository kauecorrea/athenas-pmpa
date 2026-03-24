import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Listar relatórios de Auditoria
// @ts-ignore
router.get('/', async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditoria.findMany({
      orderBy: { dataHora: 'desc' },
      take: 200 // Mostra os últimos 200 registros de segurança
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar Logs de Auditoria.' });
  }
});

export default router;
