import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as any;
      req.body = parsed.body;
      req.query = parsed.query;
      req.params = parsed.params as any;
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Erro de validação',
          detalhes: error.format()
        });
      }
      return res.status(400).json({ error: 'Erro de validação desconhecido' });
    }
  };
};
