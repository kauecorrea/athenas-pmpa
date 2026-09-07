/**
 * @file extravios.routes.ts
 * @description Rotas de Gerenciamento de Extravios (Perda/Furto/Roubo).
 * Controla os trâmites quando um equipamento desaparece, registrando os militares envolvidos,
 * boletins de ocorrência e mudando o status da máquina.
 */

import { Router, Request, Response } from 'express';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { PrismaClient } from '@prisma/client';
import { registrarAuditoria } from '../utils/auditoria';

const router = Router();
const prisma = new PrismaClient();

/**
 * @route GET /api/extravios
 * @description Retorna a listagem completa de extravios cadastrados no sistema,
 * preenchendo os dados do equipamento, militar e unidade envolvidos.
 */
// @ts-ignore
router.get('/', async (req: Request, res: Response) => {
  try {
    const extravios = await prisma.extravio.findMany({
      include: {
        equipamento: true,
        militar: true,
        unidade: true,
      },
      orderBy: { dataExtravio: 'desc' }
    });
    res.json(extravios);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar extravios' });
  }
});

/**
 * @route POST /api/extravios
 * @description Registra o extravio de um equipamento. 
 * Realiza um fluxo transacional que inclui criar o processo de extravio, 
 * alterar o equipamento para EXTRAVIADO e cortar vínculos com Cautelas ATIVAS.
 */
// @ts-ignore
router.post('/', async (req: Request, res: Response) => {
  const { 
    equipamentoId, 
    dataRegistro, 
    local, 
    descricao, 
    boNumero,
    militarResponsavelNome,
    militarResponsavelGuerra,
    militarResponsavelRg,
    militarResponsavelPatente,
    militarResponsavelContato,
    unidadeId
  } = req.body;
  
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar o registro oficial de Extravio (Inquérito Técnico)
      const extr = await tx.extravio.create({
        data: {
          equipamentoId: equipamentoId,
          militarId: null, // Pode ser null caso a responsabilidade direta seja repassada aos campos textuais (nome, guerra)
          dataExtravio: dataRegistro ? new Date(dataRegistro) : new Date(),
          boNumero,
          local,
          descricao,
          status: 'INVESTIGACAO', // Começa pendente
          militarResponsavelNome,
          militarResponsavelGuerra,
          militarResponsavelRg,
          militarResponsavelPatente,
          militarResponsavelContato,
          unidadeId
        },
      });

      // 2. Atualizar status do Equipamento no Inventário Global
      await tx.equipamento.update({
        where: { id: equipamentoId as string },
        data: { status: 'EXTRAVIADO' }
      });

      // 3. Regra de Limpeza de Cautela
      // Se o equipamento estava cautelado, ele deve ser extraído do Lote de Cautela.
      const cautelasAtivas = await tx.cautela.findMany({
        where: { status: 'ATIVA', equipamentos: { some: { id: equipamentoId } } },
        include: { equipamentos: true }
      });

      for (const c of cautelasAtivas) {
        // Corta a amarração M:N
        await tx.cautela.update({
          where: { id: c.id },
          data: { equipamentos: { disconnect: { id: equipamentoId } } }
        });

        // 4. Verificação de Fechamento de Lote
        // Se este equipamento era o último (ou único) item da Cautela, a Cautela deve ser encerrada
        // com uma missão explicativa ("TÉRMINO POR EXTRAVIO").
        if (c.equipamentos.length <= 1) {
          await tx.cautela.update({
            where: { id: c.id },
            data: { status: 'DEVOLVIDA', dataDevolucao: new Date(), missao: 'TÉRMINO POR EXTRAVIO' } 
          });
        }
      }

      return extr;
    });

    registrarAuditoria(req, 'Registrou Perda/Furto de Rádio na Tropa', `Rádio ID Banco perdido: ${equipamentoId} | B.O: ${boNumero} | Desc: ${descricao.substring(0, 30)}...`);

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar extravio' });
  }
});

/**
 * @route PUT /api/extravios/:id/encontrado
 * @description Arquiva o processo de extravio com sucesso.
 * O equipamento foi encontrado e retorna à base (OPERACIONAL).
 */
// @ts-ignore
router.put('/:id/encontrado', async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const ext = await tx.extravio.findUnique({ where: { id: id as string } });
      if (!ext) throw new Error('Extravio não localizado no banco.');

      // 1. Marca o inquérito como RECUPERADO
      const updatedExt = await tx.extravio.update({
        where: { id: id as string },
        data: { status: 'RECUPERADO' }
      });

      // 2. Libera a máquina de volta para a prateleira
      await tx.equipamento.update({
        where: { id: ext.equipamentoId },
        data: { status: 'OPERACIONAL' }
      });

      return updatedExt;
    });

    registrarAuditoria(req, 'Rádio Extraviado foi Encontrado', `O Extravio ID ${id} foi resolvido e o equipamento voltou a ser Operacional.`);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao assinalar reencontro do rádio.' });
  }
});

/**
 * @route PUT /api/extravios/:id/baixar
 * @description O processo de extravio encerrou com falha (Equipamento não será recuperado).
 * Gera a baixa definitiva do inventário (Descarte Contábil).
 */
// @ts-ignore
router.put('/:id/baixar', async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const ext = await tx.extravio.findUnique({ where: { id: id as string } });
      if (!ext) throw new Error('Extravio não localizado.');

      // 1. Marca o processo como encerrado na força (BAIXADO)
      const updatedExt = await tx.extravio.update({
        where: { id: id as string },
        data: { status: 'BAIXADO' }
      });

      // 2. Transfere a baixa para a máquina (Será filtrada nos dashboards como lixo contábil)
      await tx.equipamento.update({
        where: { id: ext.equipamentoId },
        data: { status: 'BAIXADO' }
      });

      return updatedExt;
    });

    registrarAuditoria(req, 'Rádio Configurado como Baixado', `A perda ID ${id} resultou na Baixa (Inutilização) do rádio do inventário ativo.`);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao descarregar rádio em Baixa.' });
  }
});

/**
 * @route DELETE /api/extravios/:id
 * @description Reverte um erro material. Apenas Administradores podem apagar
 * o documento de extravio, forçando o equipamento a voltar ao status OPERACIONAL.
 */
// @ts-ignore
router.delete('/:id', adminMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const ext = await tx.extravio.findUnique({ where: { id: id as string } });
      if (!ext) throw new Error('Extravio não localizado.');

      // 1. Desfaz a trava do equipamento
      await tx.equipamento.update({
        where: { id: ext.equipamentoId },
        data: { status: 'OPERACIONAL' }
      });

      // 2. Destrói o registro
      const deletado = await tx.extravio.delete({
        where: { id: id as string }
      });

      return deletado;
    });

    registrarAuditoria(req, 'Excluiu Registro de Extravio', `Rádio desvinculado do protocolo de sumiço por cancelamento de ordem ID ${id}.`);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao reverter e extinguir o extravio.' });
  }
});

export default router;
