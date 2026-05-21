import { Request } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const registrarAuditoria = async (req: any, acao: string, detalhes?: string) => {
  let usuarioNome = 'Operador Local / Indefinido';

  if (req.usuario) {
    const posto = req.usuario.posto ? `${req.usuario.posto} ` : '';
    const nomeGuerra = req.usuario.nomeGuerra || '';
    if (posto || nomeGuerra) {
      usuarioNome = `${posto}${nomeGuerra}`.trim();
    } else if (req.usuario.email) {
      usuarioNome = req.usuario.email;
    }
  } else {
    usuarioNome = req.headers['x-usuario-nome'] as string || 'Operador Local / Indefinido';
  }
  
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
