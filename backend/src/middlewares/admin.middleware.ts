import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.usuario || req.usuario.permissao !== 'Administrador') {
    return res.status(403).json({ error: 'Acesso negado. Apenas usuários Administradores podem realizar esta ação.' });
  }
  return next();
};
