import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Dados para os Widgets do Dashboard
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();

    // 1. Atualizar automaticamente para VENCIDA itens que passaram do prazo antes de contar
    await prisma.cautela.updateMany({
      where: {
        status: 'ATIVA',
        dataPrevista: {
          lt: now
        }
      },
      data: {
        status: 'VENCIDA'
      }
    });

    const totalEquipamentos = await prisma.equipamento.count();
    const operacional = await prisma.equipamento.count({ where: { status: 'OPERACIONAL' } });
    const cautelado = await prisma.equipamento.count({ where: { status: 'CAUTELADO' } });
    const emManutencao = await prisma.equipamento.count({ where: { status: 'MANUTENCAO' } });
    const extraviados = await prisma.equipamento.count({ where: { status: 'EXTRAVIADO' } });

    // Cautelas Vencidas: status VENCIDA agora que atualizamos o banco
    const cautelasVencidas = await prisma.cautela.count({
      where: {
        status: 'VENCIDA'
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

// Fluxo de Cautelas na Semana (Real)
router.get('/flow', async (req, res) => {
  try {
    const today = new Date();
    const history = [];

    // Nomes curtos dos dias da semana em PT-BR
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // Pegar os últimos 7 dias
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const nextDay = new Date(d);
      nextDay.setDate(d.getDate() + 1);

      // Contar quantas cautelas (ou melhor, quantos rádios cautelados) foram criadas nesse dia
      const cautelasDoDia = await prisma.cautela.findMany({
        where: {
          dataRetirada: {
            gte: d,
            lt: nextDay
          }
        },
        include: {
          _count: {
            select: { equipamentos: true }
          }
        }
      });

      // Somar a quantidade de equipamentos de todas as cautelas do dia
      const totalRadiosNoDia = cautelasDoDia.reduce((acc, curr) => acc + curr._count.equipamentos, 0);

      history.push({
        name: dayNames[d.getDay()],
        cautelas: totalRadiosNoDia
      });
    }

    res.json(history);
  } catch (error) {
    console.error('Erro no Dashboard:', error.message);
    res.status(500).json({ error: 'Erro ao buscar fluxo semanal' });
  }
});

export default router;
