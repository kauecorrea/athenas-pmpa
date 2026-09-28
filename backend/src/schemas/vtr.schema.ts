import { z } from 'zod';

export const updateVTRSchema = z.object({
  body: z.object({
    pae: z.string().optional().nullable(),
    unidadeId: z.string().optional().nullable(),
    solicitante: z.string().optional().nullable(),
    tecnico: z.string().optional().nullable(),
    placaVrt: z.string().optional().nullable(),
    prefixo: z.string().optional().nullable(),
    kmVrt: z.union([z.number(), z.string()]).optional().nullable().transform((v: any) => {
      if (v === undefined || v === null || v === '') return undefined;
      const parsed = typeof v === 'string' ? parseInt(v, 10) : v;
      if (isNaN(parsed)) throw new Error('kmVrt deve ser um número válido');
      return parsed;
    }),
    modeloRadio: z.string().optional().nullable(),
    numSerieRadio: z.string().optional().nullable(),
    defeitoReclamado: z.string().optional().nullable(),
    defeitoConstatado: z.string().optional().nullable(),
    solucao: z.string().optional().nullable(),
    servicos: z.array(z.string()).optional(),
    status: z.string().optional(),
    dataInicio: z.string().optional().transform((v: any) => {
      if (!v) return undefined;
      const d = new Date(v);
      if (isNaN(d.getTime())) throw new Error('dataInicio deve ser uma data válida');
      return d;
    }),
  }),
});
