/**
 * @file auth.middleware.ts
 * @description Middleware de Autenticação Global.
 * Responsável por interceptar requisições à API, verificar a presença e a validade de um Token JWT,
 * e injetar os dados do usuário autenticado dentro do objeto `req` do Express.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Chave secreta usada para assinar e verificar os tokens JWT.
// ATENÇÃO PMPA: Esta chave deve ser alterada no ambiente de produção usando a variável JWT_SECRET no arquivo .env
const JWT_SECRET = process.env.JWT_SECRET || 'super-senha-secreta-athenas-dev-local';

/**
 * Interface estendendo o Request padrão do Express para tipar a injeção do usuário logado.
 * Isso permite que qualquer rota que utilize este middleware acesse `req.usuario.id`, `req.usuario.permissao`, etc.
 */
export interface AuthRequest extends Request {
  usuario?: any;
}

/**
 * Função Middleware principal de autenticação.
 * Verifica o cabeçalho "Authorization: Bearer <token>".
 */
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  // 1. Verifica se o cabeçalho Authorization foi enviado pelo Frontend
  if (!authHeader) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido. Acesso Negado.' });
  }

  const parts = authHeader.split(' ');

  // 2. O formato esperado é estritamente "Bearer <hash_do_token>"
  if (parts.length !== 2) {
    return res.status(401).json({ error: 'Erro de formatação do token. Estrutura inválida.' });
  }

  const [scheme, token] = parts as [string, string];

  // 3. Verifica se a primeira palavra é "Bearer"
  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: 'Token mal formatado. Padrão Bearer ausente.' });
  }

  // 4. Validação criptográfica do Token usando a chave secreta
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      // Pode ocorrer se o token foi adulterado ou se o tempo de expiração (expiresIn) passou.
      return res.status(401).json({ error: 'Token inválido ou expirado. Faça login novamente.' });
    }

    // 5. Sucesso. Injeta os dados decodificados (id, permissao, etc) na requisição e passa para o próximo controlador
    req.usuario = decoded;
    return next();
  });
};
