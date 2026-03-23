import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Dados para os Widgets do Dashboard
router.get('/stats', async (req, res) => {
  try {
    const totalEquipamentos = await prisma.equipamento.count();
    const operacional = await prisma.equipamento.count({ where: { status: 'OPERACIONAL' } });
    const cautelado = await prisma.equipamento.count({ where: { status: 'CAUTELADO' } });
    const emManutencao = await prisma.equipamento.count({ where: { status: 'MANUTENCAO' } });
    const extraviados = await prisma.equipamento.count({ where: { status: 'EXTRAVIADO' } });

    // Cautelas Vencidas: status ATIVA e dataPrevista menor que agora
    const cautelasVencidas = await prisma.cautela.count({
      where: {
        status: 'ATIVA',
        dataPrevista: {
          lt: new Date()
        }
      }
    });

    res.json({
      total: totalEquipamentos,
      operacional,
      cautelado,
      emManutencao,
      extraviados,
      cautelasVencidas
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar estatísticas do dashboard' });
  }
});

export default router;
