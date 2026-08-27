import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-senha-secreta-athenas-dev-local';

// Bloqueio de Força Bruta exclusivo para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Bloqueia após 5 tentativas de login erradas/sucesso do mesmo IP
  message: { error: 'Muitas tentativas de login. Sua conta foi temporariamente bloqueada. Tente novamente após 15 minutos.' }
});

router.post('/login', loginLimiter, async (req: Request, res: Response): Promise<void> => {
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
      { expiresIn: '24h' }
    );

    // Auditoria de Logon manual
    await prisma.auditoria.create({
      data: {
        usuario: `${usuario.posto} ${usuario.nomeGuerra}`,
        acao: 'Realizou Login no Sistema',
        detalhes: `Sistema acessado com Nível: ${usuario.permissao}`
      }
    });

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
    console.error('Erro de Autenticação:', error.message);
    res.status(500).json({ error: 'Erro interno ao realizar login' });
  }
});

export default router;
