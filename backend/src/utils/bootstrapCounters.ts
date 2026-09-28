import prisma from '../prisma';

export const bootstrapCounters = async () => {
  try {
    // Cautelas
    const maxCautela = await prisma.cautela.aggregate({
      _max: { numeroSequencial: true }
    });
    const valorCautela = maxCautela._max.numeroSequencial || 0;
    if (valorCautela > 0) {
      const existingCautela = await prisma.contador.findUnique({ where: { id: 'cautela' } });
      const currentCautela = existingCautela ? existingCautela.valor : 0;
      await prisma.contador.upsert({
        where: { id: 'cautela' },
        update: { valor: Math.max(valorCautela, currentCautela) }, // Mantém o maior absoluto
        create: { id: 'cautela', valor: valorCautela }
      });
      console.log(`[Bootstrap] Contador de Cautela atualizado para ${valorCautela}`);
    }

    // Manutenções
    const maxManutencao = await prisma.manutencao.aggregate({
      _max: { numeroSequencial: true }
    });
    const valorManutencao = maxManutencao._max.numeroSequencial || 0;
    if (valorManutencao > 0) {
      const existingMan = await prisma.contador.findUnique({ where: { id: 'manutencao' } });
      const currentMan = existingMan ? existingMan.valor : 0;
      await prisma.contador.upsert({
        where: { id: 'manutencao' },
        update: { valor: Math.max(valorManutencao, currentMan) },
        create: { id: 'manutencao', valor: valorManutencao }
      });
      console.log(`[Bootstrap] Contador de Manutencao atualizado para ${valorManutencao}`);
    }

    // VTRs
    const maxVTR = await (prisma as any).manutencaoVTR.aggregate({
      _max: { osNumero: true }
    });
    const valorVTR = maxVTR._max.osNumero || 0;
    if (valorVTR > 0) {
      const existingVTR = await prisma.contador.findUnique({ where: { id: 'vtr' } });
      const currentVTR = existingVTR ? existingVTR.valor : 0;
      await prisma.contador.upsert({
        where: { id: 'vtr' },
        update: { valor: Math.max(valorVTR, currentVTR) },
        create: { id: 'vtr', valor: valorVTR }
      });
      console.log(`[Bootstrap] Contador de VTR atualizado para ${valorVTR}`);
    }

  } catch (error) {
    console.error('[Bootstrap] Erro ao inicializar contadores:', error);
  }
};
