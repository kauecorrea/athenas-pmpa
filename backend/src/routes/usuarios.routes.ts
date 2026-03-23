import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const router = Router();
const prisma = new PrismaClient();

// Criar Novo Usuário (Apenas Administradores - Na tela de Login Inicial podemos desabilitar o bloqueio temporariamente)
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { nomeCompleto, nomeGuerra, email, senha, posto, unidade, permissao } = req.body;

    const userExists = await prisma.usuario.findUnique({ where: { email } });
    if (userExists) {
      res.status(400).json({ error: 'Email já cadastrado.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(senha, salt);

    const usuario = await prisma.usuario.create({
      data: {
        nomeCompleto,
        nomeGuerra,
        email,
        senha: hashedPassword,
        posto,
        unidade,
        permissao: permissao || 'Administrador', // Default Administrador temporariamente
      },
    });

    res.status(201).json({ 
      id: usuario.id, 
      nomeCompleto: usuario.nomeCompleto, 
      nomeGuerra: usuario.nomeGuerra,
      email: usuario.email,
      permissao: usuario.permissao 
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno ao criar usuário.' });
  }
});

// Listar Usuários
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nomeCompleto: true,
        nomeGuerra: true,
        email: true,
        posto: true,
        unidade: true,
        permissao: true,
        dataCadastro: true,
      }
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuários.' });
  }
});

// Atualizar Usuário (ex: Remover Admin / Alterar Dados no Meu Perfil)
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nomeCompleto, nomeGuerra, posto, unidade, permissao, senha } = req.body;

    let hashedPassword;
    if (senha) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(senha, salt);
    }

    const usuario = await prisma.usuario.update({
      where: { id: Number(id) },
      data: {
        nomeCompleto,
        nomeGuerra,
        posto,
        unidade,
        permissao,
        ...(hashedPassword && { senha: hashedPassword })
      },
      select: {
        id: true,
        nomeCompleto: true,
        nomeGuerra: true,
        email: true,
        posto: true,
        unidade: true,
        permissao: true,
        dataCadastro: true,
      }
    });

    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
});

// Excluir Usuário
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.usuario.delete({ where: { id: Number(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir usuário.' });
  }
});

export default router;
