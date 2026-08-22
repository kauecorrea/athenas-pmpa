import { Router, Request, Response } from 'express';
import { adminMiddleware } from '../middlewares/admin.middleware';
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
        unidade: true,
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
      // 1. Criar o registro de Extravio
      const extr = await tx.extravio.create({
        data: {
          equipamentoId: equipamentoId,
          militarId: null,
          dataExtravio: dataRegistro ? new Date(dataRegistro) : new Date(),
          boNumero,
          local,
          descricao,
          status: 'INVESTIGACAO',
          militarResponsavelNome,
          militarResponsavelGuerra,
          militarResponsavelRg,
          militarResponsavelPatente,
          militarResponsavelContato,
          unidadeId
        },
      });

      // 2. Atualizar status do Equipamento
      await tx.equipamento.update({
        where: { id: equipamentoId as string },
        data: { status: 'EXTRAVIADO' }
      });

      // 3. Arrancar da cautela original caso estivesse na rua
      const cautelasAtivas = await tx.cautela.findMany({
        where: { status: 'ATIVA', equipamentos: { some: { id: equipamentoId } } },
        include: { equipamentos: true }
      });

      for (const c of cautelasAtivas) {
        await tx.cautela.update({
          where: { id: c.id },
          data: { equipamentos: { disconnect: { id: equipamentoId } } }
        });

        // Se era o último rádio e vazou da cautela, a gente fecha ela
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

// Marcar Rádio como Encontrado
// @ts-ignore
router.put('/:id/encontrado', async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const ext = await tx.extravio.findUnique({ where: { id: id as string } });
      if (!ext) throw new Error('Extravio não localizado.');

      // Muda o status do Extravio para Histórico
      const updatedExt = await tx.extravio.update({
        where: { id: id as string },
        data: { status: 'RECUPERADO' }
      });

      // Volta a máquina p/ base
      await tx.equipamento.update({
        where: { id: ext.equipamentoId },
        data: { status: 'OPERACIONAL' }
      });

      return updatedExt;
    });

    registrarAuditoria(req, 'Rádio Extraviado foi Encontrado', `O Extravio ID ${id} foi resolvido e o rádio voltou para Operacional.`);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao assinalar reencontro do rádio.' });
  }
});

// Marcar Rádio como Baixado Descartado
// @ts-ignore
router.put('/:id/baixar', async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const ext = await tx.extravio.findUnique({ where: { id: id as string } });
      if (!ext) throw new Error('Extravio não localizado.');

      // Finaliza documentação de perda
      const updatedExt = await tx.extravio.update({
        where: { id: id as string },
        data: { status: 'BAIXADO' }
      });

      // Corta o rádio do sistema
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

// Excluir Registro de Extravio
// @ts-ignore
router.delete('/:id', adminMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const ext = await tx.extravio.findUnique({ where: { id: id as string } });
      if (!ext) throw new Error('Extravio não localizado.');

      // Solta Rádio novamente caso tenha sido clicado extraviado por acidente
      await tx.equipamento.update({
        where: { id: ext.equipamentoId },
        data: { status: 'OPERACIONAL' }
      });

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
