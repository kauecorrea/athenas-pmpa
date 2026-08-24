import { Router, Request, Response } from 'express';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { PrismaClient, StatusEquipamento } from '@prisma/client';
import { registrarAuditoria } from '../utils/auditoria';

const router = Router();
const prisma = new PrismaClient();

// Listar todos os equipamentos (Rádios) com filtro opcional por status
router.get('/', async (req: Request, res: Response) => {
  const { status } = req.query;
  try {
    const equipamentos = await prisma.equipamento.findMany({
      where: status ? {
        status: status as StatusEquipamento
      } : {},
      include: {
        unidade: true,
      }
    });
    res.json(equipamentos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar equipamentos' });
  }
});

// Criar equipamento
router.post('/', async (req, res) => {
  const { rp, numSerie, idRadio, marca, modelo, status, garantia, unidadeId } = req.body;
  try {
    const equipamento = await prisma.equipamento.create({
      data: {
        rp,
        numSerie,
        idRadio,
        marca,
        modelo,
        status: status || 'OPERACIONAL',
        garantia: garantia || 'Não',
        unidadeId: unidadeId ? unidadeId : null,
      },
      include: {
        unidade: true,
      },
    });

    registrarAuditoria(req, 'Cadastrou novo Rádio / Equipamento', `RP: ${rp} - Série: ${numSerie} - ID Virtual: ${idRadio}`);

    res.status(201).json(equipamento);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar equipamento' });
  }
});

// Atualizar Equipamento (Edit)
router.put('/:id', async (req, res) => {
  const { id } = req.params as { id: string };
  const { rp, numSerie, idRadio, marca, modelo, status, garantia, unidadeId } = req.body;
  try {
    const equipamento = await prisma.equipamento.update({
      where: { id: id as string },
      data: {
        rp,
        numSerie,
        idRadio,
        marca,
        modelo,
        status,
        garantia,
        unidadeId: unidadeId ? unidadeId : null,
      },
      include: {
        unidade: true,
      },
    });

    registrarAuditoria(req, 'Editou informações de um Rádio', `ID Banco: ${id} - Novo RP: ${rp || 'mantido'}`);

    res.json(equipamento);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar equipamento' });
  }
});

// Excluir Equipamento (Delete)
router.delete('/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params as { id: string };
  try {
    await prisma.equipamento.delete({
      where: { id: id as string }
    });

    registrarAuditoria(req, 'Excluiu um Rádio permanentemente do Banco', `ID Banco: ${id}`);

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar equipamento' });
  }
});

export default router;
