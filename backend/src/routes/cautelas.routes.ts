/**
 * @file cautelas.routes.ts
 * @description Rotas de Cautelas (Empréstimos de Equipamentos).
 * Gerencia o ciclo de vida do empréstimo de rádios e outros equipamentos para os militares ou unidades.
 * Uma cautela pode conter múltiplos equipamentos (Lote).
 */

import prisma from '../prisma';
import { Router, Request, Response } from 'express';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { registrarAuditoria } from '../utils/auditoria';

const router = Router();


/**
 * @route GET /api/cautelas
 * @description Lista todas as cautelas do sistema.
 * Antes de retornar, realiza uma checagem varrendo o banco de dados para verificar se alguma
 * Cautela ATIVA ultrapassou a `dataPrevista` e, se sim, altera seu status para VENCIDA.
 */
// @ts-ignore
router.get('/', async (req: Request, res: Response) => {
  try {
    const now = new Date();

    // 1. Job Interno: Atualizar automaticamente para VENCIDA itens que passaram do prazo de devolução
    await prisma.cautela.updateMany({
      where: {
        status: 'ATIVA',
        dataPrevista: {
          lt: now // lt = less than (menor que agora)
        }
      },
      data: {
        status: 'VENCIDA'
      }
    });

    // 2. Job Interno: Sincronização de segurança
    // Garante que todos os equipamentos atrelados a uma Cautela ATIVA estejam com o status de CAUTELADO.
    // Isso previne que um rádio "fuja" do status cautelado por alguma inconsistência.
    const cautelasAtivas = await prisma.cautela.findMany({
      where: { status: 'ATIVA' },
      select: { equipamentoIds: true }
    });
    
    for (const c of cautelasAtivas) {
      await prisma.equipamento.updateMany({
        where: { id: { in: (c.equipamentoIds as string[]) } },
        data: { status: 'CAUTELADO' }
      });
    }

    // 3. Busca das cautelas com seus relacionamentos (Populate / JOIN)
    const cautelas = await prisma.cautela.findMany({
      include: {
        equipamentos: true,
        militar: { include: { unidade: true } },
        unidade: true,
      },
      orderBy: { dataRetirada: 'desc' }
    });
    
    res.json(cautelas);
  } catch (error) {
    console.error('Erro na Busca de Cautela:', (error as Error).message);
    res.status(500).json({ error: 'Erro ao buscar cautelas' });
  }
});

/**
 * @route POST /api/cautelas
 * @description Registra uma nova Cautela (Empréstimo). 
 * Pode incluir múltiplos equipamentos na mesma requisição.
 * @body { equipamentosIds, militarId, unidadeId, dataPrevista, missao, ... }
 */
// @ts-ignore
router.post('/', async (req: Request, res: Response) => {
  const { equipamentosIds, militarId, unidadeId, dataPrevista, missao, dataInicio, recebedorPosto, recebedorRgPM, recebedorNome, recebedorGuerra, recebedorContato, observacao } = req.body;
  
  // Validação: Exige pelo menos um equipamento para criar a Cautela
  if (!equipamentosIds || !Array.isArray(equipamentosIds) || equipamentosIds.length === 0) {
    return res.status(400).json({ error: 'Nenhum equipamento fornecido. Cautela abortada.' });
  }

  try {
    // Usando $transaction (Transação de Banco de Dados)
    // Garante que a Cautela e o Status dos Rádios sejam salvos JUNTOS. Se um falhar, o outro desfaz (Rollback).
    const cautelaRealizada = await prisma.$transaction(async (tx) => {
      
      // Busca o último número sequencial para gerar o novo número (Ex: Cautela Nº 15)
      const ultimaCautela = await (tx.cautela as any).findFirst({
        orderBy: { numeroSequencial: 'desc' },
        select: { numeroSequencial: true }
      });
      
      const proximoNumero = (ultimaCautela?.numeroSequencial || 0) + 1;

      // 1. Cria o registro principal da Cautela amarrando (connect) aos IDs dos equipamentos (M:N)
      const cautela = await (tx.cautela as any).create({
        data: {
          numeroSequencial: proximoNumero,
          militarId: militarId ? militarId : null,
          unidadeId: unidadeId ? unidadeId : null,
          missao: missao || null,
          dataRetirada: dataInicio ? new Date(dataInicio) : new Date(),
          dataPrevista: dataPrevista ? new Date(dataPrevista) : null,
          recebedorPosto: recebedorPosto || null,
          recebedorRgPM: recebedorRgPM || null,
          recebedorNome: recebedorNome || null,
          recebedorGuerra: recebedorGuerra || null,
          recebedorContato: recebedorContato || null,
          observacao: observacao || null,
          status: 'ATIVA',
          equipamentos: {
            connect: equipamentosIds.map((id: any) => ({ id: id }))
          }
        },
        include: { equipamentos: true }
      });

      // 2. Altera imediatamente o status de todos os equipamentos para CAUTELADO
      await tx.equipamento.updateMany({
        where: { id: { in: equipamentosIds as string[] } },
        data: { status: 'CAUTELADO' }
      });

      return cautela;
    });

    // Registra a ação no Livro de Auditoria para transparência institucional
    registrarAuditoria(req, `Criou Lote de Cautela`, `Cautelou ${equipamentosIds.length} equipamento(s).`);

    res.status(201).json(cautelaRealizada);
  } catch (error) {
    console.error('Erro ao Criar Cautela:', (error as Error).message);
    res.status(500).json({ error: 'Erro ao criar as cautelas em lote. O banco desfez a ação.' });
  }
});

/**
 * @route PUT /api/cautelas/:id
 * @description Atualiza os dados textuais de uma cautela já existente (como missão, recebedor, nova data prevista).
 */
// @ts-ignore
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { missao, dataInicio, dataPrevista, recebedorPosto, recebedorRgPM, recebedorNome, recebedorGuerra, recebedorContato, observacao } = req.body;
  
  try {
    const updateData: any = {
      missao: missao || null,
      dataPrevista: dataPrevista ? new Date(dataPrevista) : null,
      recebedorPosto: recebedorPosto || null,
      recebedorRgPM: recebedorRgPM || null,
      recebedorNome: recebedorNome || null,
      recebedorGuerra: recebedorGuerra || null,
      recebedorContato: recebedorContato || null,
      observacao: observacao || null,
    };
    
    // Regra de Negócio: Se a cautela estava VENCIDA, mas o usuário editou empurrando a data prevista para o futuro, 
    // a cautela volta ao status de ATIVA.
    const cautelaExistente = await prisma.cautela.findUnique({ where: { id: id as string } });
    if (cautelaExistente && cautelaExistente.status === 'VENCIDA' && updateData.dataPrevista && updateData.dataPrevista > new Date()) {
      updateData.status = 'ATIVA';
    }
    
    if (dataInicio) {
      updateData.dataRetirada = new Date(dataInicio);
    }

    const cautela = await prisma.cautela.update({
      where: { id: id as string },
      data: updateData
    });
    
    registrarAuditoria(req, 'Editou Lote de Cautela', `Cautela ID: ${id}`);
    res.json(cautela);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao editar cautela' });
  }
});

/**
 * @route PUT /api/cautelas/:id/devolver
 * @description Encerra a cautela por completo (Devolução).
 * Muda o status da Cautela para DEVOLVIDA e devolve os equipamentos ao status OPERACIONAL.
 */
// @ts-ignore
router.put('/:id/devolver', async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { observacaoDevolucao } = req.body;
  try {
    // 1. Marca a Cautela como DEVOLVIDA e salva a data atual
    const cautela = await prisma.cautela.update({
      where: { id: id as string },
      data: {
        status: 'DEVOLVIDA',
        dataDevolucao: new Date(),
        observacaoDevolucao: observacaoDevolucao || null
      },
      include: { equipamentos: true }
    });

    // 2. Localiza os equipamentos no array (MongoDB suporta queries in arrays)
    const idsRadios = cautela.equipamentoIds as string[];
    
    // 3. Libera os rádios no estoque (Voltam a ser OPERACIONAL)
    await prisma.equipamento.updateMany({
      where: { id: { in: idsRadios } },
      data: { status: 'OPERACIONAL' }
    });

    registrarAuditoria(req, 'Devolveu Cautela Completa', `Lote Devolvido ID: ${id}`);

    res.json(cautela);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno ao processar a devolução.' });
  }
});

/**
 * @route DELETE /api/cautelas/:id
 * @description Exclusão Definitiva de uma cautela (Apenas Administradores).
 * Apaga o histórico da cautela e libera os equipamentos.
 */
// @ts-ignore
router.delete('/:id', adminMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  try {
    const cautela = await prisma.cautela.findUnique({ where: { id: id as string }, include: { equipamentos: true } });
    if (cautela) {
       // Libera os equipamentos antes de apagar a amarração
       await prisma.equipamento.updateMany({
         where: { id: { in: cautela.equipamentos.map(e => e.id) } },
         data: { status: 'OPERACIONAL' }
       });
       
       // Exclui a cautela do banco
       await prisma.cautela.delete({ where: { id: id as string }});
       registrarAuditoria(req, 'Apagou Cautela Definitivamente', `Registro de cautela destruído. ID: ${id}`);
    }
    res.status(204).send();
  } catch(error) { 
    res.status(500).json({error: 'Erro grave ao tentar excluir a Cautela.'}); 
  }
});

export default router;
