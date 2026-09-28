/**
 * @file vtr.routes.ts
 * @description Rotas de Gerenciamento de Viaturas (VTR). Lida com a vinculação de rádios móveis instalados nos carros da corporação.
 * Operações padrão de Criação, Leitura, Atualização e Exclusão (CRUD).
 */

import prisma from '../prisma';
import { Router, Request, Response } from 'express';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { registrarAuditoria } from '../utils/auditoria';

const router = Router();


// Listar manutenções VTR
// @ts-ignore
router.get('/', async (req: Request, res: Response) => {
  try {
    const manutencoes = await (prisma as any).manutencaoVTR.findMany({
      include: {
        unidade: true,
      },
      orderBy: { dataServico: 'desc' }
    });
    
    res.json(manutencoes);
  } catch (error) {
    console.error('Erro VTR:', (error as Error).message);
    res.status(500).json({ error: 'Erro ao buscar manutenções VTR' });
  }
});

// Criar nova manutenção VTR
// @ts-ignore
router.post('/', async (req: Request, res: Response) => {
  const { 
    pae, 
    unidadeId, 
    solicitante, 
    tecnico, 
    placaVrt, 
    prefixo, 
    kmVrt, 
    modeloRadio, 
    numSerieRadio, 
    defeitoReclamado, 
    defeitoConstatado, 
    solucao, 
    servicos,
    status,
    dataInicio 
  } = req.body;
  
  // Validação estrita removida para tornar todos os campos opcionais

  try {
    const manutencaoRealizada = await prisma.$transaction(async (tx) => {
      
      const contador = await tx.contador.upsert({
        where: { id: 'vtr' },
        update: { valor: { increment: 1 } },
        create: { id: 'vtr', valor: 1 }
      });
      
      const proximoNumero = contador.valor;

      const novaManut = await (tx as any).manutencaoVTR.create({
        data: {
          osNumero: proximoNumero,
          pae,
          unidadeId,
          solicitante,
          tecnico,
          placaVrt,
          prefixo,
          kmVrt: kmVrt ? parseInt(kmVrt) : null,
          modeloRadio,
          numSerieRadio,
          defeitoReclamado,
          defeitoConstatado,
          solucao,
          status: status || 'Pendente',
          servicos: Array.isArray(servicos) ? servicos : [],
          dataServico: dataInicio ? new Date(dataInicio) : new Date(),
        },
        include: { unidade: true }
      });

      return novaManut;
    });

    await registrarAuditoria(req, 'Criou Manutenção VTR', `OS nº ${manutencaoRealizada.osNumero} - VTR ${placaVrt}`);

    res.status(201).json(manutencaoRealizada);
  } catch (error) {
    console.error('Erro VTR:', (error as Error).message);
    res.status(500).json({ error: 'Erro ao criar manutenção VTR' });
  }
});

// Editar manutenção VTR
// @ts-ignore
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Zod schema to restrict allowed fields
  const { z } = require('zod');
  const updateSchema = z.object({
    pae: z.string().optional().nullable(),
    unidadeId: z.string().optional().nullable(),
    solicitante: z.string().optional().nullable(),
    tecnico: z.string().optional().nullable(),
    placaVrt: z.string().optional().nullable(),
    prefixo: z.string().optional().nullable(),
    kmVrt: z.union([z.number(), z.string()]).optional().nullable().transform((v: any) => (v ? parseInt(v as string) : undefined)),
    modeloRadio: z.string().optional().nullable(),
    numSerieRadio: z.string().optional().nullable(),
    defeitoReclamado: z.string().optional().nullable(),
    defeitoConstatado: z.string().optional().nullable(),
    solucao: z.string().optional().nullable(),
    servicos: z.array(z.string()).optional(),
    status: z.string().optional(),
    dataInicio: z.string().optional().transform((v: any) => (v ? new Date(v) : undefined)),
  });

  try {
    const validatedData = updateSchema.parse(req.body);
    // Remover chaves undefined para não sobescrever com vazio sem querer
    Object.keys(validatedData).forEach(key => validatedData[key] === undefined && delete validatedData[key]);
    // Mapping specific names
    if (validatedData.dataInicio !== undefined) {
      validatedData.dataServico = validatedData.dataInicio;
      delete validatedData.dataInicio;
    }

    const manutencao = await (prisma as any).manutencaoVTR.update({
      where: { id },
      data: validatedData
    });
    await registrarAuditoria(req, 'Editou Manutenção VTR', `OS nº ${manutencao.osNumero}`);
    res.json(manutencao);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao editar manutenção VTR' });
  }
});

// Excluir manutenção VTR
// @ts-ignore
router.delete('/:id', adminMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const manut = await (prisma as any).manutencaoVTR.delete({ where: { id } });
    await registrarAuditoria(req, 'Excluiu Manutenção VTR', `OS nº ${manut.osNumero}`);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir manutenção VTR' });
  }
});

export default router;
