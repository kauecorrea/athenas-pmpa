/**
 * @file usuarios.routes.ts
 * @description Rotas de Gerenciamento de Usuários do Sistema (Controle de Acesso).
 * Lida com o cadastro, edição de perfis, alteração de senhas (criptografadas via Bcrypt) 
 * e exclusão de contas que operam o sistema Athenas.
 */

import prisma from '../prisma';
import { Router, Request, Response } from 'express';
import { adminMiddleware } from '../middlewares/admin.middleware';
import bcrypt from 'bcryptjs';

const router = Router();


/**
 * @route POST /api/usuarios
 * @description Cadastra um novo operador/administrador no sistema.
 * Antes de salvar no banco, a senha é criptografada usando Bcrypt com salt de 10 rounds.
 */
router.post('/', adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { nomeCompleto, nomeGuerra, login, email, senha, posto, unidade, permissao } = req.body;

    if (!login) {
      res.status(400).json({ error: 'O identificador de login é obrigatório.' });
      return;
    }
    const normalizedLogin = login.trim().toLowerCase();

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Formato de e-mail inválido.' });
      return;
    }

    // 1. Verifica se a matrícula/login já existe para evitar duplicidade
    const userExists = await prisma.usuario.findUnique({ where: { login: normalizedLogin } });
    if (userExists) {
      res.status(400).json({ error: 'Usuário/Matrícula já cadastrado no sistema.' });
      return;
    }

    if (!senha || senha.length < 10) {
      res.status(400).json({ error: 'A senha deve ter pelo menos 10 caracteres.' });
      return;
    }

    // 2. Criptografia Segura da Senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(senha, salt);

    // 3. Salva no Banco de Dados
    const usuario = await prisma.usuario.create({
      data: {
        nomeCompleto,
        nomeGuerra,
        login: normalizedLogin,
        ...(email !== undefined && { 
          email: typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null 
        }),
        senha: hashedPassword,
        posto,
        unidade,
        permissao: permissao || 'Operador', // Default fallback seguro (Princípio do Menor Privilégio)
      },
    });

    // Retorna os dados criados (nunca retornando a senha hash)
    res.status(201).json({ 
      id: usuario.id, 
      nomeCompleto: usuario.nomeCompleto, 
      nomeGuerra: usuario.nomeGuerra,
      login: usuario.login,
      email: usuario.email,
      permissao: usuario.permissao 
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Identificador de acesso já utilizado no sistema (Conflito).' });
      return;
    }
    res.status(500).json({ error: 'Erro interno ao criar usuário.' });
  }
});

/**
 * @route GET /api/usuarios
 * @description Lista todos os usuários cadastrados.
 * Oculta propositalmente a coluna `senha` usando a cláusula `select` do Prisma
 * para garantir que hashes não circulem na rede desnecessariamente.
 */
router.get('/', adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nomeCompleto: true,
        nomeGuerra: true,
        login: true,
        email: true,
        posto: true,
        unidade: true,
        permissao: true,
        dataCadastro: true,
      }
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar lista de usuários.' });
  }
});

/**
 * @route PUT /api/usuarios/me
 * @description Atualiza os dados do próprio usuário logado (Meu Perfil).
 * Essa rota NÃO exige adminMiddleware, pois o Operador pode atualizar a si mesmo.
 * Ela usa o req.usuario.id do token (blindado) e ignora a propriedade 'permissao'.
 */
router.put('/me', async (req: any, res: Response): Promise<void> => {
  try {
    const id = req.usuario.id;
    // Removido 'posto', 'unidade' e 'login'. O Operador só pode alterar seu nome e credenciais.
    const { nomeCompleto, nomeGuerra, senha, email } = req.body;

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Formato de e-mail inválido.' });
      return;
    }

    // Validação de senha
    let hashedPassword;
    if (senha) {
      if (senha.length < 10) {
        res.status(400).json({ error: 'A senha deve ter pelo menos 10 caracteres.' });
        return;
      }
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(senha, salt);
    }

    const usuario = await prisma.usuario.update({
      where: { id: id as string },
      data: {
        nomeCompleto,
        nomeGuerra,
        ...(email !== undefined && { 
          email: typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null 
        }),
        ...(hashedPassword && { senha: hashedPassword })
      },
      select: {
        id: true,
        nomeCompleto: true,
        nomeGuerra: true,
        login: true,
        email: true,
        posto: true,
        unidade: true,
        permissao: true,
        dataCadastro: true,
      }
    });

    res.json(usuario);
  } catch (error: any) {
    if (error.code === 'P2002' && (error.meta?.target?.includes('email') || error.meta?.target?.includes('login'))) {
      res.status(409).json({ error: 'Identificador de acesso já utilizado no sistema.' });
      return;
    }
    res.status(500).json({ error: 'Erro ao atualizar seu próprio perfil.' });
  }
});

/**
 * @route PUT /api/usuarios/:id
 * @description Atualiza os dados de um usuário (Perfil).
 * Se o campo "senha" for enviado preenchido, ele será criptografado antes de ser salvo.
 */
router.put('/:id', adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { nomeCompleto, nomeGuerra, posto, unidade, permissao, senha, login, email } = req.body;

    if (!login) {
      res.status(400).json({ error: 'O identificador de login é obrigatório.' });
      return;
    }
    const normalizedLogin = login.trim().toLowerCase();

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Formato de e-mail inválido.' });
      return;
    }

    // 1. Trata a troca de senha se solicitada
    let hashedPassword;
    if (senha) {
      if (senha.length < 10) {
        res.status(400).json({ error: 'A senha deve ter pelo menos 10 caracteres.' });
        return;
      }
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(senha, salt);
    }

    // 2. Atualiza os dados. Utiliza spread operator dinâmico para injetar a senha
    // apenas se a variável hashedPassword não for indefinida.
    const usuario = await prisma.usuario.update({
      where: { id: id as string },
      data: {
        nomeCompleto,
        nomeGuerra,
        login: normalizedLogin,
        ...(email !== undefined && { 
          email: typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null 
        }),
        posto,
        unidade,
        permissao,
        ...(hashedPassword && { senha: hashedPassword })
      },
      select: {
        id: true,
        nomeCompleto: true,
        nomeGuerra: true,
        login: true,
        email: true,
        posto: true,
        unidade: true,
        permissao: true,
        dataCadastro: true,
      }
    });

    res.json(usuario);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Identificador de acesso já utilizado no sistema (Conflito).' });
      return;
    }
    res.status(500).json({ error: 'Erro ao atualizar dados do usuário.' });
  }
});

/**
 * @route DELETE /api/usuarios/:id
 * @description Exclui uma conta de acesso do sistema (Revogação de Acesso).
 * Restrito pela middleware adminMiddleware.
 */
router.delete('/:id', adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    await prisma.usuario.delete({ where: { id: id as string } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao tentar excluir a conta do usuário.' });
  }
});

export default router;
