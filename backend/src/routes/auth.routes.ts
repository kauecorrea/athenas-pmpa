import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-senha-secreta-athenas-dev-local';

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, senha } = req.body;

    // Procura o usuário
    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    // Verifica a senha
    const isPasswordValid = await bcrypt.compare(senha, usuario.senha);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    // Gera o token JWT
    const token = jwt.sign(
      { 
        id: usuario.id, 
        email: usuario.email, 
        permissao: usuario.permissao,
        nomeGuerra: usuario.nomeGuerra
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Retorna Token + Informações do Sessão do Usuário
    res.json({
      token,
      usuario: {
        id: usuario.id,
        nomeCompleto: usuario.nomeCompleto,
        nomeGuerra: usuario.nomeGuerra,
        email: usuario.email,
        posto: usuario.posto,
        unidade: usuario.unidade,
        permissao: usuario.permissao
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno ao realizar login' });
  }
});

export default router;
