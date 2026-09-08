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
    const { nomeCompleto, nomeGuerra, email, senha, posto, unidade, permissao } = req.body;

    // 1. Verifica se a matrícula/email de login já existe para evitar duplicidade
    const userExists = await prisma.usuario.findUnique({ where: { email } });
    if (userExists) {
      res.status(400).json({ error: 'Usuário/Matrícula já cadastrado no sistema.' });
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
        email,
        senha: hashedPassword,
        posto,
        unidade,
        permissao: permissao || 'Administrador', // Default fallback para contingência
      },
    });

    // Retorna os dados criados (nunca retornando a senha hash)
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
    const { nomeCompleto, nomeGuerra, posto, unidade, senha, email } = req.body;

    let hashedPassword;
    if (senha) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(senha, salt);
    }

    const usuario = await prisma.usuario.update({
      where: { id: id as string },
      data: {
        nomeCompleto,
        nomeGuerra,
        email,
        posto,
        unidade,
        // NÃO recebe 'permissao'
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
    const { nomeCompleto, nomeGuerra, posto, unidade, permissao, senha, email } = req.body;

    // 1. Trata a troca de senha se solicitada
    let hashedPassword;
    if (senha) {
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
        email,
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
