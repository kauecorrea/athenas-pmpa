import { Request } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const registrarAuditoria = async (req: Request, acao: string, detalhes?: string) => {
  const usuarioNome = req.headers['x-usuario-nome'] as string || 'Operador Local / Indefinido';
  
  try {
    await prisma.auditoria.create({
      data: {
        usuario: usuarioNome,
        acao,
        detalhes: detalhes || null
      }
    });
  } catch (err) {
    console.error('Falha ao registrar log de auditoria:', err);
  }
};
