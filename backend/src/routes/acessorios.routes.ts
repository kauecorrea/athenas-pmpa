import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createAcessorioSchema, updateAcessorioSchema } from '../schemas/acessorio.schema';
import { registrarAuditoria } from '../utils/auditoria';

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
router.post('/', adminMiddleware, validate(createAcessorioSchema), async (req: Request, res: Response) => {
  const { marca, modelo, quantidade, unidadeId } = req.body;

  try {
    const acessorio = await prisma.acessorio.create({
      data: {
        marca,
        modelo,
        quantidade,
        unidadeId: unidadeId || null
      }
    });

    await registrarAuditoria(req, 'Criou Acessório', `Marca: ${marca}, Modelo: ${modelo}, Quantidade: ${quantidade}`);

    res.status(201).json(acessorio);
  } catch (error) {
    console.error("Erro ao criar acessório:", error);
    res.status(500).json({ error: 'Erro interno ao criar acessório.' });
  }
});

// PUT /api/acessorios/:id
// @ts-ignore
router.put('/:id', adminMiddleware, validate(updateAcessorioSchema), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { marca, modelo, quantidade, unidadeId } = req.body;

  try {
    const data: any = {};
    if (marca !== undefined) data.marca = marca;
    if (modelo !== undefined) data.modelo = modelo;
    if (quantidade !== undefined) data.quantidade = quantidade;
    if (unidadeId !== undefined) data.unidadeId = unidadeId || null;

    const acessorio = await prisma.acessorio.update({
      where: { id: id as string },
      data
    });
    
    await registrarAuditoria(req, 'Editou Acessório', `ID: ${id}`);
    
    res.json(acessorio);
  } catch (error) {
    console.error("Erro ao atualizar acessório:", error);
    res.status(500).json({ error: 'Erro interno ao atualizar acessório.' });
  }
});

// DELETE /api/acessorios/:id
// @ts-ignore
router.delete('/:id', adminMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.acessorio.delete({
      where: { id: id as string }
    });
    
    await registrarAuditoria(req, 'Excluiu Acessório', `ID: ${id}`);
    
    res.json({ message: 'Acessório removido com sucesso' });
  } catch (error) {
    console.error("Erro ao excluir acessório:", error);
    res.status(500).json({ error: 'Erro interno ao excluir acessório.' });
  }
});

export default router;
