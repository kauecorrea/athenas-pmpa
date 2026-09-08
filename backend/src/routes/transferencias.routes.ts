/**
 * @file transferencias.routes.ts
 * @description Rotas de Transferência de Equipamentos. Registra movimentações de patrimônio entre diferentes Unidades (OPMs).
 * Operações padrão de Criação, Leitura, Atualização e Exclusão (CRUD).
 */

import prisma from '../prisma';
import { Router, Request, Response } from 'express';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { registrarAuditoria } from '../utils/auditoria';

const router = Router();


// Listar relatórios de Transferências
// @ts-ignore
// Listar relatórios de Transferências
// @ts-ignore
router.get('/', async (req: Request, res: Response) => {
  try {
    // Lógica de exclusão definitiva após 30 dias (Lazy Delete)
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

    const transferenciasVencidas = await prisma.transferencia.findMany({
      where: { dataTransferencia: { lte: trintaDiasAtras } },
      select: { equipamentoIds: true }
    });
    
    if (transferenciasVencidas.length > 0) {
      const idsParaDeletar = transferenciasVencidas.flatMap(t => t.equipamentoIds);
      if (idsParaDeletar.length > 0) {
        // Exclui definitivamente do sistema apenas se ainda estiverem como TRANSFERIDO
        await prisma.equipamento.deleteMany({
          where: { 
            id: { in: idsParaDeletar },
            status: 'TRANSFERIDO'
          }
        });
      }
    }

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
      // Pequemos o primeiro rádio para saber a unidade de origem
      if (!equipamentosIds || equipamentosIds.length === 0) {
        throw new Error('Nenhum rádio selecionado.');
      }

      const primeiroEquip = await tx.equipamento.findUnique({
        where: { id: equipamentosIds[0] },
        select: { unidadeId: true }
      });

      const unidadeOrigemId = primeiroEquip?.unidadeId || null;

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

          // Se a cautela ficou vazia, encerra ela
          if (c.equipamentos.length <= 1) {
            await tx.cautela.update({
              where: { id: c.id },
              data: { 
                status: 'DEVOLVIDA', 
                dataDevolucao: new Date(), 
                missao: 'ENCERRADA POR TRANSFERÊNCIA DE CARGA' 
              }
            });
          }
        }

        // 2. Atualizar a Unidade do Rádio Definitivamente e mudar para TRANSFERIDO
        await tx.equipamento.update({
          where: { id: equipId },
          data: { 
            unidadeId: unidadeDestinoId,
            status: 'TRANSFERIDO' 
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
          equipamentoIds: equipamentosIds // Usar o campo escalar diretamente para evitar problemas no MongoDB
        },
        include: { unidadeDestino: true }
      });

      return trans;
    });

    registrarAuditoria(req, 'Transferência de Carga Definitiva', `Transferiu IDs [${equipamentosIds.join(', ')}] para Unidade ID: ${unidadeDestinoId}`);
    res.status(201).json(result);
  } catch (error: any) {
    console.error('ERRO TRANSFERENCIA:', error);
    res.status(500).json({ 
      error: 'Erro ao processar transferência de carga'
    });
  }
});

// Atualizar Transferência (Permite mudar destino e equipamentos)
// @ts-ignore
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { dataTransferencia, observacoes, unidadeDestinoId, equipamentosIds } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.transferencia.findUnique({
        where: { id },
        include: { equipamentos: true }
      });

      if (!existing) throw new Error('Transferência não encontrada');

      // Se mudou equipamentos ou destino, precisamos reverter e reaplicar
      if (unidadeDestinoId || equipamentosIds) {
        // 1. Reverter estados atuais (Rádios voltam para origem)
        const origemId = existing.unidadeOrigemId;
        if (origemId) {
          for (const eq of existing.equipamentos) {
            await tx.equipamento.update({
              where: { id: eq.id },
              data: { unidadeId: origemId, status: 'OPERACIONAL' }
            });
          }
        }

        // 2. Aplicar novos estados
        const finalDestinoId = unidadeDestinoId || existing.unidadeDestinoId;
        const finalEquipIds = equipamentosIds || existing.equipamentoIds;

        for (const eqId of finalEquipIds) {
          await tx.equipamento.update({
            where: { id: eqId },
            data: { unidadeId: finalDestinoId, status: 'TRANSFERIDO' }
          });
        }
        
        // 3. Atualizar o registro
        const updateData: any = {
          unidadeDestinoId: finalDestinoId,
          equipamentoIds: finalEquipIds,
          qtdRadios: finalEquipIds.length,
          observacoes: observacoes !== undefined ? observacoes : undefined
        };
        if (dataTransferencia) updateData.dataTransferencia = new Date(dataTransferencia);

        return await tx.transferencia.update({
          where: { id },
          data: updateData
        });
      } else {
        // Apenas meta-dados
        const updateData: any = {
          observacoes: observacoes !== undefined ? observacoes : undefined
        };
        if (dataTransferencia) updateData.dataTransferencia = new Date(dataTransferencia);

        return await tx.transferencia.update({
          where: { id },
          data: updateData
        });
      }
    });

    registrarAuditoria(req, 'Editou Transferência', `Transferência ID ${id} atualizada.`);
    res.json(result);
  } catch (error: any) {
    console.error('ERRO ATUALIZAR TRANSFERENCIA:', error);
    res.status(500).json({ error: 'Erro ao atualizar transferência' });
  }
});

// Excluir e Reverter Transferência (Rádio volta para Unidade de Origem)
// @ts-ignore
router.delete('/:id', adminMiddleware, async (req: Request, res: Response) => {
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
    console.error('Erro em Transferências:', (error as Error).message);
    res.status(500).json({ error: 'Erro ao estornar transferência' });
  }
});

export default router;
