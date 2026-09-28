import { z } from 'zod';

export const createAcessorioSchema = z.object({
  body: z.object({
    marca: z.string().trim().min(1, 'A marca não pode ser vazia'),
    modelo: z.string().trim().min(1, 'O modelo não pode ser vazio'),
    quantidade: z.number().int().min(0, 'A quantidade não pode ser negativa e deve ser inteira'),
    unidadeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'O ID da unidade deve ser um ObjectId válido').optional().nullable(),
  }),
});

export const updateAcessorioSchema = createAcessorioSchema;
