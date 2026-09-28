/**
 * @file manutencao.routes.ts
 * @description Rotas de Gerenciamento de Manutenções (Oficina).
 * Controla os fluxos de envio de equipamentos danificados para a DITEL ou empresas terceirizadas,
 * registrando datas de laudos, orçamentos, números de PAE e devolução.
 */

import prisma from '../prisma';
import { Router, Request, Response } from 'express';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { registrarAuditoria } from '../utils/auditoria';

const router = Router();


/**
 * @route GET /api/manutencoes
 * @description Retorna o histórico completo de manutenções (Ordens de Serviço).
 * Faz um JOIN (include) com a tabela de Equipamentos para exibir o Patrimônio/Série na listagem.
 */
// @ts-ignore
router.get('/', async (req: Request, res: Response) => {
  try {
    const manutencoes = await prisma.manutencao.findMany({
      include: {
        equipamento: true,
        unidade: true,
        tecnico: true,
      },
      orderBy: { dataEntrada: 'desc' }
    });
    res.json(manutencoes);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar manutenções' });
  }
});

/**
 * @route POST /api/manutencoes
 * @description Dá entrada em um ou mais equipamentos na Manutenção (Em Lote ou Único).
 * - Cria a OS de manutenção.
 * - Altera o status do equipamento para MANUTENCAO.
 * - Encerra automaticamente qualquer cautela ativa atrelada a este equipamento (pois se quebrou na rua, 
 *   a cautela é cortada para o equipamento vir para a oficina).
 */
// @ts-ignore
router.post('/', async (req: Request, res: Response) => {
  const { 
    equipamentoId, 
    equipamentoIds, 
    problema, 
    dataEntrada, 
    previsaoRetorno, 
    dataChegadaDitel, 
    dataSaidaEmpresa, 
    dataEnvioUnidade, 
    analiseTecnica, 
    laudoTecnico, 
    tecnicoId, 
    solicitante, 
    pae,
    tipoManutencao,
    unidadeId,
    documentoOrigem,
    documentoSaidaEmpresa,
    documentoEntregaUnidade
  } = req.body;
  
  // Normaliza o array de IDs (Suporta tanto envio único via equipamentoId quanto lote via equipamentoIds)
  const idsToProcess = equipamentoIds && equipamentoIds.length > 0 ? equipamentoIds : (equipamentoId ? [equipamentoId] : []);
  
  if (idsToProcess.length === 0) {
    return res.status(400).json({ error: 'Nenhum equipamento selecionado para manutenção.' });
  }
  
  try {
    // $transaction garante que, em caso de erro no loop, nada seja salvo pela metade.
    const result = await prisma.$transaction(async (tx) => {
      const created = [];
      
      let maxManutencao = await tx.manutencao.findFirst({
        orderBy: { numeroSequencial: 'desc' }
      });
      let currentSeq = maxManutencao?.numeroSequencial || 0;
      
      for (const eqId of idsToProcess) {
        currentSeq++;
        // 1. Criar o registro oficial (Ordem de Serviço)
        const manut = await tx.manutencao.create({
          data: {
            numeroSequencial: currentSeq,
            equipamentoId: eqId,
            problema,
            dataEntrada: dataEntrada ? new Date(dataEntrada) : new Date(),
            dataChegadaDitel: dataChegadaDitel ? new Date(dataChegadaDitel) : null,
            dataSaidaEmpresa: dataSaidaEmpresa ? new Date(dataSaidaEmpresa) : null,
            previsaoRetorno: previsaoRetorno ? new Date(previsaoRetorno) : null,
            dataEnvioUnidade: dataEnvioUnidade ? new Date(dataEnvioUnidade) : null,
            analiseTecnica,
            laudoTecnico,
            tecnicoId: tecnicoId || null,
            solicitante,
            pae,
            tipoManutencao: tipoManutencao || 'Externa',
            unidadeId: unidadeId || null,
            documentoOrigem,
            documentoSaidaEmpresa,
            documentoEntregaUnidade,
            status: 'EM ANDAMENTO'
          },
        });

        // 2. Trava o equipamento no inventário marcando como MANUTENCAO
        await tx.equipamento.update({
          where: { id: eqId as string },
          data: { status: 'MANUTENCAO' }
        });

        // 3. Regra de Limpeza de Cautelas Órfãs
        // Busca cautelas onde o rádio defeituoso ainda consta como ATIVO na rua.
        const cautelasAtivas = await tx.cautela.findMany({
          where: { equipamentoIds: { has: eqId as string }, status: 'ATIVA' }
        });

        for (const c of cautelasAtivas) {
          // A devolução é forçada, pois o rádio retornou fisicamente à DITEL para conserto.
          await tx.cautela.update({
            where: { id: c.id },
            data: { status: 'DEVOLVIDA', dataDevolucao: new Date() }
          });
        }
        
        created.push(manut);
      }

      return created;
    });

    registrarAuditoria(req, 'Registrou Rádio(s) na Oficina/Manutenção', `Foram enviados ${idsToProcess.length} equipamento(s). Problema relatado: ${problema}`);

    res.status(201).json(result);
  } catch (error: any) {
    console.error("ERRO DETALHADO NO POST MANUTENCAO:", error);
    res.status(500).json({ error: 'Erro ao registrar manutenção', details: error.message });
  }
});

/**
 * @route PUT /api/manutencoes/:id/concluir
 * @description Conclui a Ordem de Serviço (Consertado).
 * O equipamento é marcado como OPERACIONAL e liberado para novas Cautelas.
 */
// @ts-ignore
router.put('/:id/concluir', async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { statusDestino } = req.body;
  
  try {
    const equipStatus = statusDestino === 'BAIXADO' ? 'BAIXADO' : 'OPERACIONAL';
    
    const manutencao = await prisma.$transaction(async (tx) => {
      const man = await tx.manutencao.update({
        where: { id: id as string },
        data: {
          status: 'CONCLUIDA',
          dataConclusao: new Date()
        }
      });

      await tx.equipamento.update({
        where: { id: man.equipamentoId },
        data: { status: equipStatus }
      });

      return man;
    });

    registrarAuditoria(req, 'Concluiu e retirou rádio da Manutenção', `Concluiu a Ordem de Serviço ID Banco: ${id}. Destino: ${equipStatus}`);

    res.json(manutencao);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao concluir manutenção' });
  }
});

/**
 * @route PUT /api/manutencoes/:id
 * @description Atualiza os campos de texto e datas de uma Ordem de Serviço em andamento
 * (Ex: adicionar número do PAE, informar que foi enviado à empresa, preencher Laudo Técnico).
 */
// @ts-ignore
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { problema, dataEntrada, previsaoRetorno, dataChegadaDitel, dataSaidaEmpresa, dataEnvioUnidade, analiseTecnica, laudoTecnico, tecnicoId, solicitante, pae, tipoManutencao, unidadeId, documentoOrigem, documentoSaidaEmpresa, documentoEntregaUnidade } = req.body;
  
  try {
    const updateData: any = { problema };
    
    // Tratamento rigoroso de datas (Verificando null/undefined para não quebrar o banco)
    if (dataEntrada) updateData.dataEntrada = new Date(dataEntrada);
    if (previsaoRetorno !== undefined) updateData.previsaoRetorno = previsaoRetorno ? new Date(previsaoRetorno) : null;
    if (dataChegadaDitel !== undefined) updateData.dataChegadaDitel = dataChegadaDitel ? new Date(dataChegadaDitel) : null;
    if (dataSaidaEmpresa !== undefined) updateData.dataSaidaEmpresa = dataSaidaEmpresa ? new Date(dataSaidaEmpresa) : null;
    if (dataEnvioUnidade !== undefined) updateData.dataEnvioUnidade = dataEnvioUnidade ? new Date(dataEnvioUnidade) : null;
    
    // Tratamento de campos de texto opcionais
    if (analiseTecnica !== undefined) updateData.analiseTecnica = analiseTecnica;
    if (laudoTecnico !== undefined) updateData.laudoTecnico = laudoTecnico;
    if (tecnicoId !== undefined) updateData.tecnicoId = tecnicoId;
    if (solicitante !== undefined) updateData.solicitante = solicitante;
    if (pae !== undefined) updateData.pae = pae;
    if (tipoManutencao !== undefined) updateData.tipoManutencao = tipoManutencao;
    if (unidadeId !== undefined) updateData.unidadeId = unidadeId;
    if (documentoOrigem !== undefined) updateData.documentoOrigem = documentoOrigem;
    if (documentoSaidaEmpresa !== undefined) updateData.documentoSaidaEmpresa = documentoSaidaEmpresa;
    if (documentoEntregaUnidade !== undefined) updateData.documentoEntregaUnidade = documentoEntregaUnidade;

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

/**
 * @route DELETE /api/manutencoes/:id
 * @description Exclui/Estorna fisicamente uma Ordem de Serviço. Acesso restrito a Administradores.
 * Desfaz a operação, voltando o rádio ao status OPERACIONAL, contanto que não tenha tido outro evento posterior.
 */
// @ts-ignore
router.delete('/:id', adminMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  
  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.manutencao.findUnique({ where: { id: id as string } });
      if (!existing) throw new Error('Manutenção não encontrada');

      // 1. Destruir registro da OS
      await tx.manutencao.delete({ where: { id: id as string } });

      // 2. Restabelecer equipamento para Operacional (Apenas se ainda estivesse listado como em Manutenção)
      const equip = await tx.equipamento.findUnique({ where: { id: existing.equipamentoId } });
      if (equip && equip.status === 'MANUTENCAO') {
        await tx.equipamento.update({
          where: { id: existing.equipamentoId },
          data: { status: 'OPERACIONAL' }
        });
      }
      
      return { success: true };
    });

    registrarAuditoria(req, 'Excluiu/Estornou Manutenção', `Removeu fisicamente a Ordem de Serviço ID Banco: ${id}`);
    res.json(result);
  } catch (error: any) {
    console.error('ERRO EXCLUIR MANUTENCAO:', error);
    res.status(500).json({ error: 'Erro ao excluir manutenção' });
  }
});

export default router;
