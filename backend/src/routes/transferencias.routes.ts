import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { registrarAuditoria } from '../utils/auditoria';

const router = Router();
const prisma = new PrismaClient();

// Listar relatórios de Transferências
// @ts-ignore
router.get('/', async (req: Request, res: Response) => {
  try {
    const transferencias = await prisma.transferencia.findMany({
      include: {
        militar: {
          include: {
            unidade: true
          }
        }
      },
      orderBy: { dataTransferencia: 'desc' }
    });
    res.json(transferencias);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar transferências' });
  }
});

// Registrar Nova Transferência
// @ts-ignore
router.post('/', async (req: Request, res: Response) => {
  const { equipamentosIds, militarId, destino, dataTransferencia, observacoes } = req.body;
  
  if (!equipamentosIds || !Array.isArray(equipamentosIds) || equipamentosIds.length === 0) {
    return res.status(400).json({ error: 'Nenhum equipamento fornecido para transferência.' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      
      // 1. Criar o registro de Transferência (Histórico visual)
      const trans = await tx.transferencia.create({
        data: {
          militarId: Number(militarId),
          destino,
          dataTransferencia: dataTransferencia ? new Date(dataTransferencia) : new Date(),
          observacoes,
          qtdRadios: equipamentosIds.length,
          status: 'FINALIZADA'
        },
      });

      // 2. Encerrar cautela antiga e puxar uma Cautela Nova para o novo PM
      for (const equipId of equipamentosIds) {
        
        // Finaliza cautela(s) ativa(s) caso tenha
        const cautelasAtivas = await tx.cautela.findMany({
          where: { equipamentoId: Number(equipId), status: 'ATIVA' }
        });

        for (const c of cautelasAtivas) {
          await tx.cautela.update({
            where: { id: c.id },
            data: { status: 'DEVOLVIDA', dataDevolucao: new Date() }
          });
        }

        // Abre uma nova Cautela no nome do novo Substituto
        await tx.cautela.create({
          data: {
            equipamentoId: Number(equipId),
            militarId: Number(militarId),
            dataPrevista: null, // Sem volta estipulada a menos que informado
            status: 'ATIVA',
            dataRetirada: dataTransferencia ? new Date(dataTransferencia) : new Date()
          }
        });
        
        // 3. Atualizar status do Equipamento
        await tx.equipamento.update({
          where: { id: Number(equipId) },
          data: { status: 'CAUTELADO' }
        });

      }

      return trans;
    });

    registrarAuditoria(req, 'Transferiu carga de Cautela de Rádios', `Transferiu IDs [${equipamentosIds.join(', ')}] para o PM Banco ID: ${militarId} com Destino: ${destino}`);

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar transferência' });
  }
});

export default router;
