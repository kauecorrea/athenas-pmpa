/**
 * @file admin.middleware.ts
 * @description Middleware de Autorização Baseada em Regras (Role-Based Access Control).
 * Garante que apenas usuários com a permissão de "Administrador" acessem rotas críticas do sistema.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

/**
 * Função Middleware para checagem de privilégios.
 * DEVE ser colocada nas rotas APÓS o `authMiddleware`, pois depende do `req.usuario` ter sido preenchido.
 */
export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Se o usuário não estiver injetado (falha no authMiddleware) ou a permissão não for Administrador, bloqueia
  if (!req.usuario || req.usuario.permissao !== 'Administrador') {
    return res.status(403).json({ 
      error: 'Acesso negado. Apenas usuários Administradores podem realizar esta ação no sistema.' 
    });
  }
  
  // Usuário é administrador, o fluxo da API continua
  return next();
};
