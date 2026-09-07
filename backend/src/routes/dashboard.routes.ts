/**
 * @file dashboard.routes.ts
 * @description Rotas para alimentação dos gráficos e contadores da Tela Inicial (Dashboard).
 * Realiza agregações e contagens em tempo real no banco de dados.
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * @route GET /api/dashboard/stats
 * @description Fornece a contagem numérica de todos os estados dos equipamentos para os cards superiores.
 * Inclui uma trigger lógica para atualizar o status de cautelas atrasadas no ato da consulta.
 */
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();

    // 1. Atualizar automaticamente para VENCIDA itens que passaram do prazo antes de contar
    // Isso garante que o card de "Cautelas Vencidas" sempre reflita o exato momento atual.
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

    // 2. Contagens massivas do MongoDB utilizando aggregação nativa do Prisma (.count)
    const totalEquipamentos = await prisma.equipamento.count();
    const operacional = await prisma.equipamento.count({ where: { status: 'OPERACIONAL' } });
    const cautelado = await prisma.equipamento.count({ where: { status: 'CAUTELADO' } });
    const emManutencao = await prisma.equipamento.count({ where: { status: 'MANUTENCAO' } });
    const extraviados = await prisma.equipamento.count({ where: { status: 'EXTRAVIADO' } });

    // Contagem apenas das cautelas pendentes/atrasadas
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

/**
 * @route GET /api/dashboard/flow
 * @description Retorna o volume de movimentação de Cautelas nos últimos 7 dias.
 * Usado para desenhar o gráfico de barras/linhas de "Fluxo Semanal".
 */
router.get('/flow', async (req, res) => {
  try {
    const today = new Date();
    const history = [];

    // Nomes curtos dos dias da semana em PT-BR para exibição direta no gráfico (Eixo X)
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // Loop que viaja no tempo do dia (Hoje - 6 dias) até Hoje.
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0); // Zera o relógio para o inicio do dia (00:00:00)

      const nextDay = new Date(d);
      nextDay.setDate(d.getDate() + 1); // Fim da janela do dia atual

      // Buscar Cautelas cuja Data de Retirada aconteceu neste intervalo de 24h
      const cautelasDoDia = await prisma.cautela.findMany({
        where: {
          dataRetirada: {
            gte: d,     // Maior ou igual às 00h
            lt: nextDay // Menor que o dia seguinte (23:59:59)
          }
        },
        include: {
          _count: {
            select: { equipamentos: true } // Puxa quantos rádios saíram em cada Cautela
          }
        }
      });

      // Soma o total de rádios cautelados no dia
      const totalRadiosNoDia = cautelasDoDia.reduce((acc, curr) => acc + curr._count.equipamentos, 0);

      history.push({
        name: dayNames[d.getDay()], // Qual dia da semana caiu (Dom, Seg...)
        cautelas: totalRadiosNoDia  // Quantidade (Eixo Y)
      });
    }

    res.json(history);
  } catch (error) {
    console.error('Erro no Dashboard:', (error as Error).message);
    res.status(500).json({ error: 'Erro ao buscar fluxo semanal' });
  }
});

export default router;
