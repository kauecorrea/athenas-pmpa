import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { registrarAuditoria } from '../utils/auditoria';

const router = Router();
const prisma = new PrismaClient();

// Listar todos os equipamentos (Rádios)
router.get('/', async (req, res) => {
  try {
    const equipamentos = await prisma.equipamento.findMany({
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
  const { rp, numSerie, idRadio, marca, modelo, status, unidadeId } = req.body;
  try {
    const equipamento = await prisma.equipamento.create({
      data: {
        rp,
        numSerie,
        idRadio,
        marca,
        modelo,
        status: status || 'OPERACIONAL',
        unidadeId: unidadeId ? Number(unidadeId) : null,
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
  const { id } = req.params;
  const { rp, numSerie, idRadio, marca, modelo, status, unidadeId } = req.body;
  try {
    const equipamento = await prisma.equipamento.update({
      where: { id: Number(id) },
      data: {
        rp,
        numSerie,
        idRadio,
        marca,
        modelo,
        status,
        unidadeId: unidadeId ? Number(unidadeId) : null,
      },
    });

    registrarAuditoria(req, 'Editou informações de um Rádio', `ID Banco: ${id} - Novo RP: ${rp || 'mantido'}`);

    res.json(equipamento);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar equipamento' });
  }
});

// Excluir Equipamento (Delete)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.equipamento.delete({
      where: { id: Number(id) }
    });

    registrarAuditoria(req, 'Excluiu um Rádio permanentemente do Banco', `ID Banco: ${id}`);

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar equipamento' });
  }
});

export default router;
