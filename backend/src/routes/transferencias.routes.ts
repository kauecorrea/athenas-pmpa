import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { registrarAuditoria } from '../utils/auditoria';

const router = Router();
const prisma = new PrismaClient();

// Listar relatórios de Transferências
// @ts-ignore
// Listar relatórios de Transferências
// @ts-ignore
router.get('/', async (req: Request, res: Response) => {
  try {
    const transferencias = await prisma.transferencia.findMany({
      include: {
        unidadeOrigem: true,
        unidadeDestino: true,
        equipamentos: true
      },
      orderBy: { dataTransferencia: 'desc' }
    });
    res.json(transferencias);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar transferências' });
  }
});

// Registrar Nova Transferência (Definitiva entre Unidades)
// @ts-ignore
router.post('/', async (req: Request, res: Response) => {
  const { equipamentosIds, unidadeDestinoId, dataTransferencia, observacoes } = req.body;
  
  if (!equipamentosIds || !Array.isArray(equipamentosIds) || equipamentosIds.length === 0) {
    return res.status(400).json({ error: 'Nenhum equipamento fornecido para transferência.' });
  }

  if (!unidadeDestinoId) {
    return res.status(400).json({ error: 'Unidade de destino não informada.' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Pegamos o primeiro rádio para saber a unidade de origem (assumindo que todos vêm da mesma, o que é o comum)
      const primeiroEquip = await tx.equipamento.findUnique({
        where: { id: equipamentosIds[0] },
        select: { unidadeId: true }
      });

      const unidadeOrigemId = primeiroEquip?.unidadeId;

      for (const equipId of equipamentosIds) {
        // 1. Desconectar das cautelas de ORIGEM (se houver)
        const cautelasAtivas = await tx.cautela.findMany({
          where: { status: 'ATIVA', equipamentos: { some: { id: equipId } } },
          include: { equipamentos: true }
        });

        for (const c of cautelasAtivas) {
          await tx.cautela.update({
            where: { id: c.id },
            data: { equipamentos: { disconnect: { id: equipId } } }
          });

          if (c.equipamentos.length <= 1) {
            await tx.cautela.update({
              where: { id: c.id },
              data: { status: 'DEVOLVIDA', dataDevolucao: new Date(), missao: 'ENCERRADA POR TRANSFERÊNCIA DE CARGA' }
            });
          }
        }

        // 2. Atualizar a Unidade do Rádio Definitivamente e voltar para OPERACIONAL na nova casa
        await tx.equipamento.update({
          where: { id: equipId },
          data: { 
            unidadeId: unidadeDestinoId,
            status: 'OPERACIONAL' 
          }
        });
      }

      // 3. Criar a Transferência Histórica
      const trans = await tx.transferencia.create({
        data: {
          unidadeOrigemId,
          unidadeDestinoId,
          dataTransferencia: dataTransferencia ? new Date(dataTransferencia) : new Date(),
          observacoes,
          qtdRadios: equipamentosIds.length,
          status: 'FINALIZADA',
          equipamentos: {
            connect: equipamentosIds.map((id: string) => ({ id }))
          }
        },
        include: { unidadeDestino: true }
      });

      return trans;
    });

    registrarAuditoria(req, 'Transferência de Carga Definitiva', `Transferiu IDs [${equipamentosIds.join(', ')}] para Unidade ID: ${unidadeDestinoId}`);
    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao processar transferência de carga' });
  }
});

// Excluir e Reverter Transferência (Rádio volta para Unidade de Origem)
// @ts-ignore
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  try {
    await prisma.$transaction(async (tx) => {
      const trans = await tx.transferencia.findUnique({
        where: { id: id as string },
        include: { equipamentos: true }
      });

      if (!trans) throw new Error('Transferência não encontrada');

      // Se havia uma unidade de origem, devolvemos os rádios pra lá
      if (trans.unidadeOrigemId) {
        for (const equip of trans.equipamentos) {
          await tx.equipamento.update({
            where: { id: equip.id },
            data: { 
              unidadeId: trans.unidadeOrigemId,
              status: 'OPERACIONAL'
            }
          });
        }
      }

      await tx.transferencia.delete({
        where: { id: id as string }
      });
    });

    registrarAuditoria(req, 'Estornou Transferência de Carga', `A Transferência ID ${id} foi revertida.`);
    res.json({ message: 'Transferência estornada e carga devolvida à unidade de origem.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao estornar transferência' });
  }
});

export default router;
