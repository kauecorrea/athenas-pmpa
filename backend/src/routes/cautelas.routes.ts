import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Listar cautelas
router.get('/', async (req, res) => {
  try {
    const cautelas = await prisma.cautela.findMany({
      include: {
        equipamento: true,
        militar: true,
        unidade: true,
      },
    });
    res.json(cautelas);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cautelas' });
  }
});

// Emprestar um rádio (Criar Cautela)
router.post('/', async (req, res) => {
  const { equipamentoId, militarId, unidadeId, dataPrevista } = req.body;
  try {
    // 1. Criar a Cautela
    const cautela = await prisma.cautela.create({
      data: {
        equipamentoId: Number(equipamentoId),
        militarId: militarId ? Number(militarId) : null,
        unidadeId: unidadeId ? Number(unidadeId) : null,
        dataPrevista: dataPrevista ? new Date(dataPrevista) : null,
        status: 'ATIVA'
      },
    });

    // 2. Atualizar status do Equipamento
    await prisma.equipamento.update({
      where: { id: Number(equipamentoId) },
      data: { status: 'CAUTELADO' }
    });

    res.status(201).json(cautela);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar cautela' });
  }
});

// Devolver um rádio (Baixa na Cautela)
router.put('/:id/devolver', async (req, res) => {
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

    res.json(cautela);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao devolver equipamento' });
  }
});

export default router;
