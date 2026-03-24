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
        equipamento: true,
        militar: true,
        unidade: true,
      },
      orderBy: { dataRetirada: 'desc' }
    });
    res.json(cautelas);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cautelas' });
  }
});

// Emprestar Rádi(os) (Criar Cautelas em Lote)
// @ts-ignore
router.post('/', async (req: Request, res: Response) => {
  const { equipamentosIds, militarId, unidadeId, dataPrevista } = req.body;
  
  if (!equipamentosIds || !Array.isArray(equipamentosIds) || equipamentosIds.length === 0) {
    return res.status(400).json({ error: 'Nenhum equipamento fornecido.' });
  }

  try {
    const cautelasCriadas: any[] = [];

    // Usando transaction para garantir a consistência de múltiplos empréstimos
    await prisma.$transaction(async (tx) => {
      for (const equipId of equipamentosIds) {
        // 1. Criar a Cautela para cada rádio
        const cautela = await tx.cautela.create({
          data: {
            equipamentoId: Number(equipId),
            militarId: militarId ? Number(militarId) : null,
            unidadeId: unidadeId ? Number(unidadeId) : null,
            dataPrevista: dataPrevista ? new Date(dataPrevista) : null,
            status: 'ATIVA'
          },
        });
        
        cautelasCriadas.push(cautela);

        // 2. Atualizar status do Equipamento
        await tx.equipamento.update({
          where: { id: Number(equipId) },
          data: { status: 'CAUTELADO' }
        });
      }
    });

    // Auditoria disparada em background (Fire and Forget)
    registrarAuditoria(req, `Emprestou ${equipamentosIds.length} rádio(s) (Cautela)`, `IDs dos Rádios: ${equipamentosIds.join(', ')}`);

    res.status(201).json(cautelasCriadas);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar as cautelas em lote' });
  }
});

// Devolver um rádio (Baixa na Cautela específica)
// @ts-ignore
router.put('/:id/devolver', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const cautela = await prisma.cautela.update({
      where: { id: Number(id) },
      data: {
        status: 'DEVOLVIDA',
        dataDevolucao: new Date()
      }
    });

    await prisma.equipamento.update({
      where: { id: cautela.equipamentoId },
      data: { status: 'OPERACIONAL' }
    });

    registrarAuditoria(req, 'Devolveu rádio', `Recebeu Rádio ID Banco: ${cautela.equipamentoId}`);

    res.json(cautela);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao devolver equipamento' });
  }
});

export default router;
