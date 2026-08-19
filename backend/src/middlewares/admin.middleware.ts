import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.usuario || req.usuario.permissao !== 'ADM') {
    return res.status(403).json({ error: 'Acesso negado. Apenas usuários ADM podem realizar esta ação.' });
  }
  return next();
};
