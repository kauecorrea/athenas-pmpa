import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { registrarAuditoria } from '../utils/auditoria';

const router = Router();
const prisma = new PrismaClient();

// Listar manutenções VTR
// @ts-ignore
router.get('/', async (req: Request, res: Response) => {
  try {
    const manutencoes = await prisma.manutencaoVTR.findMany({
      include: {
        unidade: true,
      },
      orderBy: { dataServico: 'desc' }
    });
    
    res.json(manutencoes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar manutenções VTR' });
  }
});

// Criar nova manutenção VTR
// @ts-ignore
router.post('/', async (req: Request, res: Response) => {
  const { 
    paeNumero, 
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
    dataInicio 
  } = req.body;
  
  if (!unidadeId || !placaVrt || !prefixo) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
  }

  try {
    const manutencaoRealizada = await prisma.$transaction(async (tx) => {
      
      // Pegar o último número de OS para incrementar
      const ultimaManut = await (tx.manutencaoVTR as any).findFirst({
        orderBy: { osNumero: 'desc' },
        select: { osNumero: true }
      });
      
      // Começar do 1 se não houver registros, ou o próximo
      const proximoNumero = (ultimaManut?.osNumero || 0) + 1;

      const novaManut = await (tx.manutencaoVTR as any).create({
        data: {
          osNumero: proximoNumero,
          paeNumero,
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
          servicos: Array.isArray(servicos) ? servicos : [],
          dataServico: dataInicio ? new Date(dataInicio) : new Date(),
        },
        include: { unidade: true }
      });

      return novaManut;
    });

    registrarAuditoria(req, 'Criou Manutenção VTR', `OS nº ${manutencaoRealizada.osNumero} - VTR ${placaVrt}`);

    res.status(201).json(manutencaoRealizada);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar manutenção VTR' });
  }
});

// Editar manutenção VTR
// @ts-ignore
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  
  try {
    const manutencao = await prisma.manutencaoVTR.update({
      where: { id },
      data: {
        ...data,
        kmVrt: data.kmVrt ? parseInt(data.kmVrt) : undefined,
        dataServico: data.dataInicio ? new Date(data.dataInicio) : undefined,
      }
    });
    registrarAuditoria(req, 'Editou Manutenção VTR', `OS nº ${manutencao.osNumero}`);
    res.json(manutencao);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao editar manutenção VTR' });
  }
});

// Excluir manutenção VTR
// @ts-ignore
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const manut = await prisma.manutencaoVTR.delete({ where: { id } });
    registrarAuditoria(req, 'Excluiu Manutenção VTR', `OS nº ${manut.osNumero}`);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir manutenção VTR' });
  }
});

export default router;
