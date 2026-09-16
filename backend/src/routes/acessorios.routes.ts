import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /api/acessorios
// @ts-ignore
router.get('/', async (req: Request, res: Response) => {
  try {
    const acessorios = await prisma.acessorio.findMany({
      include: {
        unidade: true
      },
      orderBy: {
        modelo: 'asc'
      }
    });
    res.json(acessorios);
  } catch (error) {
    console.error("Erro ao buscar acessórios:", error);
    res.status(500).json({ error: 'Erro interno ao buscar acessórios.' });
  }
});

// POST /api/acessorios
// @ts-ignore
router.post('/', async (req: Request, res: Response) => {
  const { marca, modelo, quantidade, unidadeId } = req.body;

  if (!marca || !modelo || quantidade === undefined || quantidade === null) {
    return res.status(400).json({ error: 'Marca, Modelo e Quantidade são obrigatórios.' });
  }

  try {
    const acessorio = await prisma.acessorio.create({
      data: {
        marca,
        modelo,
        quantidade: Number(quantidade),
        unidadeId: unidadeId || null
      }
    });

    res.status(201).json(acessorio);
  } catch (error) {
    console.error("Erro ao criar acessório:", error);
    res.status(500).json({ error: 'Erro interno ao criar acessório.' });
  }
});

// PUT /api/acessorios/:id
// @ts-ignore
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { marca, modelo, quantidade, unidadeId } = req.body;

  try {
    const data: any = {};
    if (marca !== undefined) data.marca = marca;
    if (modelo !== undefined) data.modelo = modelo;
    if (quantidade !== undefined) data.quantidade = Number(quantidade);
    if (unidadeId !== undefined) data.unidadeId = unidadeId || null;

    const acessorio = await prisma.acessorio.update({
      where: { id: id as string },
      data
    });
    res.json(acessorio);
  } catch (error) {
    console.error("Erro ao atualizar acessório:", error);
    res.status(500).json({ error: 'Erro interno ao atualizar acessório.' });
  }
});

// DELETE /api/acessorios/:id
// @ts-ignore
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.acessorio.delete({
      where: { id: id as string }
    });
    res.json({ message: 'Acessório removido com sucesso' });
  } catch (error) {
    console.error("Erro ao excluir acessório:", error);
    res.status(500).json({ error: 'Erro interno ao excluir acessório.' });
  }
});

export default router;
