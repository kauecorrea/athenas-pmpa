/**
 * @file militares.routes.ts
 * @description Rotas de Gerenciamento de Efetivo (Militares). Gerencia o cadastro do efetivo da PMPA apto a acautelar equipamentos.
 * Operações padrão de Criação, Leitura, Atualização e Exclusão (CRUD).
 */

import prisma from '../prisma';
import { Router } from 'express';
import { adminMiddleware } from '../middlewares/admin.middleware';
const router = Router();


// Listar todos os militares
router.get('/', async (req, res) => {
  try {
    const militares = await prisma.militar.findMany({
      include: {
        unidade: true,
      }
    });
    res.json(militares);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar militares' });
  }
});

// Criar militar
router.post('/', async (req, res) => {
  const { nome, rg, cpf, posto, unidadeId } = req.body;
  try {
    const militar = await prisma.militar.create({
      data: {
        nome,
        rg,
        cpf,
        contato: req.body.contato,
        posto,
        unidadeId: unidadeId,
      },
    });
    res.status(201).json(militar);
  } catch (error: any) {
    if (error.code === 'P2002') {
       res.status(400).json({ error: 'RG ou CPF já cadastrado' });
    } else {
       res.status(500).json({ error: 'Erro ao criar militar' });
    }
  }
});

// Atualizar Militar
router.put('/:id', async (req, res) => {
  const { id } = req.params as { id: string };
  const { nome, rg, cpf, contato, posto, unidadeId } = req.body;
  
  try {
    const militar = await prisma.militar.update({
      where: { id: id as string },
      data: {
        nome,
        rg,
        cpf,
        contato,
        posto,
        unidadeId: unidadeId,
      },
    });
    res.json(militar);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar militar' });
  }
});

// Excluir Militar
router.delete('/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params as { id: string };
  
  try {
    // Verifica se há cautelas ativas para este militar
    const activeCautelas = await prisma.cautela.findFirst({
      where: {
        militarId: id,
        status: 'ATIVA'
      }
    });

    if (activeCautelas) {
      return res.status(400).json({ error: 'Militar possui cautelas ativas.' });
    }

    await prisma.militar.delete({
      where: { id: id as string },
    });
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir militar' });
  }
});

export default router;
