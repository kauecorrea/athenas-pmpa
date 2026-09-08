/**
 * @file auth.routes.ts
 * @description Rotas de Autenticação.
 * Lida com a validação de login (email/matrícula + senha), comparação de hashes (Bcrypt) e emissão de Tokens JWT.
 */

import prisma from '../prisma';
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();


// ATENÇÃO PMPA: Esta chave deve ser configurada obrigatoriamente no arquivo .env
const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error("FATAL ERROR: A variável de ambiente JWT_SECRET não está definida. O sistema não pode iniciar com segurança.");
}
/**
 * @route POST /api/auth/login
 * @description Realiza o login do usuário, gerando um token JWT caso as credenciais sejam válidas.
 * @access Público
 * @body { email, senha }
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, senha } = req.body;

    // 1. Busca o usuário no banco de dados através da matrícula/email
    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    // Se o usuário não existir, interrompe o fluxo com erro genérico por segurança
    if (!usuario) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    // 2. Compara a senha informada no frontend com o hash guardado no banco de dados
    const isPasswordValid = await bcrypt.compare(senha, usuario.senha);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    // 3. Gera o Token JWT contendo os metadados principais.
    // Expiração configurada para 24 horas (exigirá login novamente amanhã)
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

    // 4. Auditoria Obrigatória
    // Registra imediatamente no histórico geral do sistema que o usuário realizou o acesso
    await prisma.auditoria.create({
      data: {
        usuario: `${usuario.posto} ${usuario.nomeGuerra}`,
        acao: 'Realizou Login no Sistema',
        detalhes: `Sistema acessado com Nível: ${usuario.permissao}`
      }
    });

    // 5. Retorna o Token e as propriedades públicas do usuário para o Frontend montar a sessão
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
    console.error('Erro de Autenticação:', (error as Error).message);
    res.status(500).json({ error: 'Erro interno ao realizar login' });
  }
});

export default router;
