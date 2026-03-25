import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { registrarAuditoria } from '../utils/auditoria';

const router = Router();
const prisma = new PrismaClient();

// Listar cautelas
// @ts-ignore
router.get('/', async (req: Request, res: Response) => {
  try {
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
      
      // 1. Criar a Cautela Única com Amarração M:N
      const cautela = await tx.cautela.create({
        data: {
          militarId: militarId ? Number(militarId) : null,
          unidadeId: unidadeId ? Number(unidadeId) : null,
          missao: missao || null,
          dataRetirada: dataInicio ? new Date(dataInicio) : new Date(),
          dataPrevista: dataPrevista ? new Date(dataPrevista) : null,
          status: 'ATIVA',
          equipamentos: {
            connect: equipamentosIds.map((id: any) => ({ id: Number(id) }))
          }
        },
        include: { equipamentos: true }
      });

      // 2. Atualizar todos os equipamentos para CAUTELADO de uma vez
      await tx.equipamento.updateMany({
        where: { id: { in: equipamentosIds.map(Number) } },
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
  const { id } = req.params;
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
      where: { id: Number(id) },
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
  const { id } = req.params;
  try {
    const cautela = await prisma.cautela.update({
      where: { id: Number(id) },
      data: {
        status: 'DEVOLVIDA',
        dataDevolucao: new Date()
      },
      include: { equipamentos: true }
    });

    const idsRadios = cautela.equipamentos.map(e => e.id);
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
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const cautela = await prisma.cautela.findUnique({ where: { id: Number(id) }, include: { equipamentos: true } });
    if(cautela) {
       await prisma.equipamento.updateMany({
         where: { id: { in: cautela.equipamentos.map(e => e.id) } },
         data: { status: 'OPERACIONAL' }
       });
       await prisma.cautela.delete({ where: { id: Number(id) }});
       registrarAuditoria(req, 'Apagou Cautela Definitivamente', `Cautela Apagada ID: ${id}`);
    }
    res.status(204).send();
  } catch(error) { 
    res.status(500).json({error: 'Erro'}); 
  }
});

export default router;
