import request from 'supertest';
import { app } from '../index';
import prisma from '../prisma';

describe('Testes de Concorrência', () => {
  let eqId: string;
  let authToken: string;

  let userId: string;

  beforeAll(async () => {
    // Criar equipamento de teste
    const eq = await prisma.equipamento.create({
      data: { numSerie: `TEST-${Date.now()}`, status: 'OPERACIONAL', tipo: 'RADIO' }
    });
    eqId = eq.id;

    // Criar usuario de teste e pegar token
    const user = await prisma.usuario.create({
      data: {
        login: `test-${Date.now()}`,
        senha: 'hash', // não importa, usaremos mock se possivel, ou autenticar de verdade
        nomeCompleto: 'Test User',
        nomeGuerra: 'TEST',
        permissao: 'Administrador'
      }
    });
    userId = user.id;

    const jwt = require('jsonwebtoken');
    authToken = jwt.sign({ id: user.id, permissao: user.permissao }, process.env.JWT_SECRET || 'secret');
  });

  afterAll(async () => {
    // Limpar dados
    await prisma.manutencao.deleteMany({ where: { equipamentoId: eqId } });
    await prisma.equipamento.delete({ where: { id: eqId } });
    await prisma.auditoria.deleteMany({ where: { usuario: { contains: 'test-' } } });
    await prisma.usuario.delete({ where: { id: userId } });
  });

  it('Não deve permitir que dois operadores criem manutenção simultaneamente para o mesmo rádio', async () => {
    // Tenta criar duas manutenções no mesmo exato momento
    const req1 = request(app)
      .post('/api/manutencoes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ equipamentoId: eqId, problema: 'Defeito 1' });
    
    const req2 = request(app)
      .post('/api/manutencoes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ equipamentoId: eqId, problema: 'Defeito 2' });

    const [res1, res2] = await Promise.all([req1, req2]);

    // Um deve passar (201) e o outro deve falhar (409)
    const successCount = [res1.status, res2.status].filter(s => s === 201).length;
    const conflictCount = [res1.status, res2.status].filter(s => s === 409).length;

    expect(successCount).toBe(1);
    expect(conflictCount).toBe(1);
  });
});
