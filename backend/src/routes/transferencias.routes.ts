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
        militar: { include: { unidade: true } },
        equipamentos: true
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
      // 1. Desconectar das cautelas de ORIGEM
      for (const equipId of equipamentosIds) {
        // Acha todas as cautelas ATIVAS que seguram ESSE rádio
        const cautelasAtivas = await tx.cautela.findMany({
          where: { status: 'ATIVA', equipamentos: { some: { id: Number(equipId) } } },
          include: { equipamentos: true }
        });

        for (const c of cautelasAtivas) {
          // Desconecta o rádio da Cautela Originária
          await tx.cautela.update({
            where: { id: c.id },
            data: { equipamentos: { disconnect: { id: Number(equipId) } } }
          });

          // Se a cautela original agora esvaziou (tinha só esse rádio), nós a damos como devolvida
          if (c.equipamentos.length <= 1) {
            await tx.cautela.update({
              where: { id: c.id },
              data: { status: 'DEVOLVIDA', dataDevolucao: new Date() }
            });
          }
        }
      }

      // 2. Criar UMA única Nova Cautela em Lote para agrupar esses rádios que chegaram
      const novaCautela = await tx.cautela.create({
        data: {
          militarId: Number(militarId),
          status: 'ATIVA',
          dataRetirada: dataTransferencia ? new Date(dataTransferencia) : new Date(),
          missao: `REPASSE TÁTICO: ${destino}`,
          equipamentos: {
            connect: equipamentosIds.map((id: number) => ({ id: Number(id) }))
          }
        }
      });

      // 3. Criar a Transferência Histórica no Banco com o Array de Equipamentos
      const trans = await tx.transferencia.create({
        data: {
          militarId: Number(militarId),
          destino,
          dataTransferencia: dataTransferencia ? new Date(dataTransferencia) : new Date(),
          observacoes,
          qtdRadios: equipamentosIds.length,
          status: 'FINALIZADA',
          equipamentos: {
            connect: equipamentosIds.map((id: number) => ({ id: Number(id) }))
          }
        },
      });

      // 4. Garantir que o Rádio continue como CAUTELADO
      for (const equipId of equipamentosIds) {
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
    console.error(error);
    res.status(500).json({ error: 'Erro ao processar transferência' });
  }
});

// Editar dados de texto da Transferência
// @ts-ignore
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { destino, observacoes } = req.body;

  try {
    const updated = await prisma.transferencia.update({
      where: { id: Number(id) },
      data: { destino, observacoes }
    });
    registrarAuditoria(req, 'Editou Destino de Transferência', `Transferência ID: ${id} editada para Destino: ${destino}`);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao editar transferência' });
  }
});

// Excluir e Reverter Transferência (Radio para OPERACIONAL)
// @ts-ignore
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Pega a transferência antes de excluir pra saber quais eram os rádios e o destino
      const trans = await tx.transferencia.findUnique({
        where: { id: Number(id) },
        include: { equipamentos: true }
      });

      if (!trans) throw new Error('Transferência não encontrada');

      // Pega a Cautela que foi gerada na hora do repasse (Mesmo PM, Rádios idênticos e mesma Data e Missão parecida)
      // Como não salvamos o CautelaID na transferência (para manter solto), 
      // achamos simplesmente devolvendo/liberando os rádios para a base.
      
      for (const equip of trans.equipamentos) {
        // Deleta os rádios da cautela ATIVA do Militar Receptor
        const cautelasReceptor = await tx.cautela.findMany({
          where: { status: 'ATIVA', militarId: trans.militarId, equipamentos: { some: { id: equip.id } } },
          include: { equipamentos: true }
        });

        for (const c of cautelasReceptor) {
          await tx.cautela.update({
            where: { id: c.id },
            data: { equipamentos: { disconnect: { id: equip.id } } }
          });
          if (c.equipamentos.length <= 1) {
            await tx.cautela.update({
              where: { id: c.id },
              data: { status: 'DEVOLVIDA', dataDevolucao: new Date(), missao: 'CANCELADA VIA EXCLUSÃO' }
            });
          }
        }

        // Volta os rádios para Status livre OPERACIONAL na corporação
        await tx.equipamento.update({
          where: { id: equip.id },
          data: { status: 'OPERACIONAL' }
        });
      }

      // E finalmente exlcui a transferência do sistema
      const deletedTrans = await tx.transferencia.delete({
        where: { id: Number(id) }
      });

      return deletedTrans;
    });

    registrarAuditoria(req, 'Excluiu Transferência', `A Transferência ID ${id} foi revertida e ejetada do sistema.`);
    res.json({ message: 'Transferência revertida e rádios marcados como operacionais.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar e reverter transferência', details: error });
  }
});

export default router;
