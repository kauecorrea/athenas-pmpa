import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { registrarAuditoria } from '../utils/auditoria';

const router = Router();
const prisma = new PrismaClient();

// Listar histórico de manutenção
// @ts-ignore
router.get('/', async (req: Request, res: Response) => {
  try {
    const manutencoes = await prisma.manutencao.findMany({
      include: {
        equipamento: true,
      },
      orderBy: { dataEntrada: 'desc' }
    });
    res.json(manutencoes);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar manutenções' });
  }
});

// Registrar entrada em manutenção
// @ts-ignore
router.post('/', async (req: Request, res: Response) => {
  const { equipamentoId, problema, dataEntrada, previsaoRetorno } = req.body;
  
  try {
    // Usando transaction para garantir a consistência
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar o registro de Manutenção
      const manut = await tx.manutencao.create({
        data: {
          equipamentoId: Number(equipamentoId),
          problema,
          dataEntrada: dataEntrada ? new Date(dataEntrada) : new Date(),
          previsaoRetorno: previsaoRetorno ? new Date(previsaoRetorno) : null,
          status: 'EM ANDAMENTO'
        },
      });

      // 2. Atualizar status do Equipamento para MANUTENCAO
      await tx.equipamento.update({
        where: { id: Number(equipamentoId) },
        data: { status: 'MANUTENCAO' }
      });

      // 3. Opcional: Se ele estava cautelado, poderíamos dar baixa na cautela aqui.
      // O sistema assume que apenas o adm manda para manutenção após devolução,
      // mas podemos forçar a baixa de cautelas ativas se existirem.
      const cautelasAtivas = await tx.cautela.findMany({
        where: { equipamentoId: Number(equipamentoId), status: 'ATIVA' }
      });

      for (const c of cautelasAtivas) {
        await tx.cautela.update({
          where: { id: c.id },
          data: { status: 'DEVOLVIDA', dataDevolucao: new Date() }
        });
      }

      return manut;
    });

    registrarAuditoria(req, 'Registrou Rádio na Oficina/Manutenção', `Rádio ID Banco: ${equipamentoId} | Problema relatado: ${problema}`);

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar manutenção' });
  }
});

// Finalizar manutenção e devolver a operacional
// @ts-ignore
router.put('/:id/concluir', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const manutencao = await prisma.manutencao.update({
      where: { id: Number(id) },
      data: {
        status: 'CONCLUIDA',
        dataConclusao: new Date()
      }
    });

    await prisma.equipamento.update({
      where: { id: manutencao.equipamentoId },
      data: { status: 'OPERACIONAL' }
    });

    registrarAuditoria(req, 'Concluiu e retirou rádio da Manutenção', `Concluiu a Ordem de Serviço ID Banco: ${id}`);

    res.json(manutencao);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao concluir manutenção' });
  }
});

export default router;
