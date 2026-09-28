import { z } from 'zod';

export const createAcessorioSchema = z.object({
  body: z.object({
    marca: z.string().min(1, 'A marca não pode ser vazia'),
    modelo: z.string().min(1, 'O modelo não pode ser vazio'),
    quantidade: z.number().min(0, 'A quantidade não pode ser negativa'),
    unidadeId: z.string().optional().nullable(),
  }),
});

export const updateAcessorioSchema = createAcessorioSchema;
