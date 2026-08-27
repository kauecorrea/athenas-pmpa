import { Router, Request, Response } from 'express';
import { adminMiddleware } from '../middlewares/admin.middleware';
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
  const { equipamentoId, equipamentoIds, problema, dataEntrada, previsaoRetorno, dataChegadaDitel, dataSaidaEmpresa, dataEnvioUnidade, analiseTecnica, laudoTecnico, tecnicoResp, solicitante, paeNumero } = req.body;
  const idsToProcess = equipamentoIds && equipamentoIds.length > 0 ? equipamentoIds : (equipamentoId ? [equipamentoId] : []);
  
  if (idsToProcess.length === 0) {
    return res.status(400).json({ error: 'Nenhum equipamento selecionado' });
  }
  
  try {
    // Usando transaction para garantir a consistência
    const result = await prisma.$transaction(async (tx) => {
      const created = [];
      
      for (const eqId of idsToProcess) {
        // 1. Criar o registro de Manutenção
        const manut = await tx.manutencao.create({
          data: {
            equipamentoId: eqId,
            problema,
            dataEntrada: dataEntrada ? new Date(dataEntrada) : new Date(),
            dataChegadaDitel: dataChegadaDitel ? new Date(dataChegadaDitel) : null,
            dataSaidaEmpresa: dataSaidaEmpresa ? new Date(dataSaidaEmpresa) : null,
            previsaoRetorno: previsaoRetorno ? new Date(previsaoRetorno) : null,
            dataEnvioUnidade: dataEnvioUnidade ? new Date(dataEnvioUnidade) : null,
            analiseTecnica,
            laudoTecnico,
            tecnicoResp,
            solicitante,
            paeNumero,
            status: 'EM ANDAMENTO'
          },
        });

        // 2. Atualizar status do Equipamento para MANUTENCAO
        await tx.equipamento.update({
          where: { id: eqId as string },
          data: { status: 'MANUTENCAO' }
        });

        // 3. Dar baixa na cautela se houver
        const cautelasAtivas = await tx.cautela.findMany({
          where: { equipamentoIds: { has: eqId as string }, status: 'ATIVA' }
        });

        for (const c of cautelasAtivas) {
          await tx.cautela.update({
            where: { id: c.id },
            data: { status: 'DEVOLVIDA', dataDevolucao: new Date() }
          });
        }
        
        created.push(manut);
      }

      return created;
    });

    registrarAuditoria(req, 'Registrou Rádio(s) na Oficina/Manutenção', `Foram enviados ${idsToProcess.length} rádio(s). Problema relatado: ${problema}`);

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar manutenção' });
  }
});

// Finalizar manutenção e devolver a operacional
// @ts-ignore
router.put('/:id/concluir', async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  try {
    const manutencao = await prisma.manutencao.update({
      where: { id: id as string },
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

// Editar registro de manutenção
// @ts-ignore
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { problema, dataEntrada, previsaoRetorno, dataChegadaDitel, dataSaidaEmpresa, dataEnvioUnidade, analiseTecnica, laudoTecnico, tecnicoResp, solicitante, paeNumero } = req.body;
  
  try {
    const updateData: any = { problema };
    if (dataEntrada) updateData.dataEntrada = new Date(dataEntrada);
    if (previsaoRetorno !== undefined) updateData.previsaoRetorno = previsaoRetorno ? new Date(previsaoRetorno) : null;
    if (dataChegadaDitel !== undefined) updateData.dataChegadaDitel = dataChegadaDitel ? new Date(dataChegadaDitel) : null;
    if (dataSaidaEmpresa !== undefined) updateData.dataSaidaEmpresa = dataSaidaEmpresa ? new Date(dataSaidaEmpresa) : null;
    if (dataEnvioUnidade !== undefined) updateData.dataEnvioUnidade = dataEnvioUnidade ? new Date(dataEnvioUnidade) : null;
    if (analiseTecnica !== undefined) updateData.analiseTecnica = analiseTecnica;
    if (laudoTecnico !== undefined) updateData.laudoTecnico = laudoTecnico;
    if (tecnicoResp !== undefined) updateData.tecnicoResp = tecnicoResp;
    if (solicitante !== undefined) updateData.solicitante = solicitante;
    if (paeNumero !== undefined) updateData.paeNumero = paeNumero;

    const updated = await prisma.manutencao.update({
      where: { id: id as string },
      data: updateData
    });
    
    registrarAuditoria(req, 'Editou Manutenção', `Editou Ordem de Serviço ID Banco: ${id}`);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao editar manutenção' });
  }
});

// Excluir registro de manutenção (Estornar)
// @ts-ignore
router.delete('/:id', adminMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  
  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.manutencao.findUnique({ where: { id: id as string } });
      if (!existing) throw new Error('Manutenção não encontrada');

      // 1. Deletar a manutenção
      await tx.manutencao.delete({ where: { id: id as string } });

      // 2. Voltar o rádio para operacional se ele ainda estiver marcado como em manutenção
      const equip = await tx.equipamento.findUnique({ where: { id: existing.equipamentoId } });
      if (equip && equip.status === 'MANUTENCAO') {
        await tx.equipamento.update({
          where: { id: existing.equipamentoId },
          data: { status: 'OPERACIONAL' }
        });
      }
      
      return { success: true };
    });

    registrarAuditoria(req, 'Excluiu/Estornou Manutenção', `Removeu Ordem de Serviço ID Banco: ${id}`);
    res.json(result);
  } catch (error: any) {
    console.error('ERRO EXCLUIR MANUTENCAO:', error);
    res.status(500).json({ error: 'Erro ao excluir manutenção' });
  }
});

export default router;
