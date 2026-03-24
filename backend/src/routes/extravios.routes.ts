import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { registrarAuditoria } from '../utils/auditoria';

const router = Router();
const prisma = new PrismaClient();

// Listar relatórios de extravio
// @ts-ignore
router.get('/', async (req: Request, res: Response) => {
  try {
    const extravios = await prisma.extravio.findMany({
      include: {
        equipamento: true,
        militar: true,
      },
      orderBy: { dataExtravio: 'desc' }
    });
    res.json(extravios);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar extravios' });
  }
});

// Registrar Extravio
// @ts-ignore
router.post('/', async (req: Request, res: Response) => {
  const { equipamentoId, militarId, dataExtravio, local, descricao } = req.body;
  
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar o registro de Extravio
      const extr = await tx.extravio.create({
        data: {
          equipamentoId: Number(equipamentoId),
          militarId: militarId ? Number(militarId) : null,
          dataExtravio: dataExtravio ? new Date(dataExtravio) : new Date(),
          local,
          descricao,
          status: 'INVESTIGACAO'
        },
      });

      // 2. Atualizar status do Equipamento
      await tx.equipamento.update({
        where: { id: Number(equipamentoId) },
        data: { status: 'EXTRAVIADO' }
      });

      // 3. Baixar cautela se o rádio estava cautelado com alguém
      const cautelasAtivas = await tx.cautela.findMany({
        where: { equipamentoId: Number(equipamentoId), status: 'ATIVA' }
      });

      for (const c of cautelasAtivas) {
        await tx.cautela.update({
          where: { id: c.id },
          data: { status: 'DEVOLVIDA', dataDevolucao: new Date() } // Poderia ser status EXTRAVIADA, mas mantemos fluxo
        });
      }

      return extr;
    });

    registrarAuditoria(req, 'Registrou Perda/Furto de Rádio na Tropa', `Rádio ID Banco perdido: ${equipamentoId} | Sumiu com B.O: ${descricao.substring(0, 30)}...`);

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar extravio' });
  }
});

export default router;
