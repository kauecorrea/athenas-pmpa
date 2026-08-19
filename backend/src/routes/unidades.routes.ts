import { Router } from 'express';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Listar todas as unidades
router.get('/', async (req, res) => {
  try {
    const unidades = await prisma.unidade.findMany({
      include: {
        _count: {
          select: { militares: true },
        },
      },
    });
    res.json(unidades);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar unidades' });
  }
});

// Criar nova unidade
router.post('/', async (req, res) => {
  const { nome, sigla, coint, localizacao, contato } = req.body;
  try {
    // Verifica duplicidade (nome é único)
    const unidadeExistente = await prisma.unidade.findUnique({
      where: { nome }
    });
    
    if (unidadeExistente) {
      return res.status(409).json({ error: `A unidade "${nome}" já está cadastrada no sistema.` });
    }

    const unidade = await prisma.unidade.create({
      data: { nome, sigla, coint, localizacao, contato },
    });
    res.status(201).json(unidade);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar unidade' });
  }
});

// Atualizar Unidade
router.put('/:id', async (req, res) => {
  const { id } = req.params as { id: string };
  const { nome, sigla, coint, localizacao, contato } = req.body;
  try {
    const unidade = await prisma.unidade.update({
      where: { id: id as string },
      data: { nome, sigla, coint, localizacao, contato },
    });
    res.json(unidade);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar unidade' });
  }
});

// Deletar Unidade
router.delete('/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params as { id: string };
  try {
    // Checar se existem militares vinculados
    const militares = await prisma.militar.findFirst({
      where: { unidadeId: id }
    });

    if (militares) {
      return res.status(400).json({ error: 'Não é possível excluir uma unidade que possui militares cadastrados.' });
    }

    await prisma.unidade.delete({
      where: { id: id as string }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar unidade' });
  }
});

export default router;
