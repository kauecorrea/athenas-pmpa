import { Router, Request, Response } from 'express';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { PrismaClient } from '@prisma/client';
import { registrarAuditoria } from '../utils/auditoria';

const router = Router();
const prisma = new PrismaClient();

// Listar cautelas
// @ts-ignore
router.get('/', async (req: Request, res: Response) => {
  try {
    const now = new Date();

    // 1. Atualizar automaticamente para VENCIDA itens que passaram do prazo
    await prisma.cautela.updateMany({
      where: {
        status: 'ATIVA',
        dataPrevista: {
          lt: now
        }
      },
      data: {
        status: 'VENCIDA'
      }
    });

    // 2. Sincronizar Status dos Equipamentos (Garantir que os rádios fiquem como CAUTELADOS)
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

    // 3. Buscar cautelas (agora com status atualizados no banco)
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
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar cautelas' });
  }
});

// Emprestar Rádi(os) (Criar Cautelas em Lote M:N)
// @ts-ignore
router.post('/', async (req: Request, res: Response) => {
  const { equipamentosIds, militarId, unidadeId, dataPrevista, missao, dataInicio } = req.body;
  
  if (!equipamentosIds || !Array.isArray(equipamentosIds) || equipamentosIds.length === 0) {
    return res.status(400).json({ error: 'Nenhum equipamento fornecido.' });
  }

  try {
    // Usando transaction para garantir a consistência
    const cautelaRealizada = await prisma.$transaction(async (tx) => {
      
      // Pegar o último número sequencial para incrementar
      const ultimaCautela = await (tx.cautela as any).findFirst({
        orderBy: { numeroSequencial: 'desc' },
        select: { numeroSequencial: true }
      });
      
      const proximoNumero = (ultimaCautela?.numeroSequencial || 0) + 1;

      // 1. Criar a Cautela Única com Amarração M:N
      const cautela = await (tx.cautela as any).create({
        data: {
          numeroSequencial: proximoNumero,
          militarId: militarId ? militarId : null,
          unidadeId: unidadeId ? unidadeId : null,
          missao: missao || null,
          dataRetirada: dataInicio ? new Date(dataInicio) : new Date(),
          dataPrevista: dataPrevista ? new Date(dataPrevista) : null,
          status: 'ATIVA',
          equipamentos: {
            connect: equipamentosIds.map((id: any) => ({ id: id }))
          }
        },
        include: { equipamentos: true }
      });

      // 2. Atualizar todos os equipamentos para CAUTELADO de uma vez
      await tx.equipamento.updateMany({
        where: { id: { in: equipamentosIds as string[] } },
        data: { status: 'CAUTELADO' }
      });

      return cautela;
    });

    registrarAuditoria(req, `Criou Lote de Cautela`, `Cautelou ${equipamentosIds.length} rádio(s).`);

    res.status(201).json(cautelaRealizada);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar as cautelas em lote' });
  }
});

// Editar Cautela Base
// @ts-ignore
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { missao, dataInicio, dataPrevista } = req.body;
  
  try {
    const updateData: any = {
      missao: missao || null,
      dataPrevista: dataPrevista ? new Date(dataPrevista) : null,
    };
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

// Devolver Lote (Baixa Total)
// @ts-ignore
router.put('/:id/devolver', async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  try {
    const cautela = await prisma.cautela.update({
      where: { id: id as string },
      data: {
        status: 'DEVOLVIDA',
        dataDevolucao: new Date()
      },
      include: { equipamentos: true }
    });

    const idsRadios = cautela.equipamentoIds as string[];
    await prisma.equipamento.updateMany({
      where: { id: { in: idsRadios } },
      data: { status: 'OPERACIONAL' }
    });

    registrarAuditoria(req, 'Devolveu Cautela Completa', `Lote Devolvido ID: ${id}`);

    res.json(cautela);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao devolver equipamento' });
  }
});

// Excluir Lote
// @ts-ignore
router.delete('/:id', adminMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  try {
    const cautela = await prisma.cautela.findUnique({ where: { id: id as string }, include: { equipamentos: true } });
    if(cautela) {
       await prisma.equipamento.updateMany({
         where: { id: { in: cautela.equipamentos.map(e => e.id) } },
         data: { status: 'OPERACIONAL' }
       });
       await prisma.cautela.delete({ where: { id: id as string }});
       registrarAuditoria(req, 'Apagou Cautela Definitivamente', `Cautela Apagada ID: ${id}`);
    }
    res.status(204).send();
  } catch(error) { 
    res.status(500).json({error: 'Erro'}); 
  }
});

export default router;
