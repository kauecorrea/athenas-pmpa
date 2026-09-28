/**
 * @file index.ts
 * @description Arquivo principal de inicialização do Backend do Sistema Athenas (PMPA).
 * Configura o servidor Express, middlewares de segurança, limites de requisição e rotas da API.
 */

import 'dotenv/config';
import prisma from './prisma';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';

import { authMiddleware } from './middlewares/auth.middleware';

// Importação das rotas
import unidadesRoutes from './routes/unidades.routes';
import equipamentosRoutes from './routes/equipamentos.routes';
import cautelasRoutes from './routes/cautelas.routes';
import dashboardRoutes from './routes/dashboard.routes';
import militaresRoutes from './routes/militares.routes';
import usuariosRoutes from './routes/usuarios.routes';
import authRoutes from './routes/auth.routes';
import manutencaoRoutes from './routes/manutencao.routes';
import extraviosRoutes from './routes/extravios.routes';
import transferenciasRoutes from './routes/transferencias.routes';
import auditoriaRoutes from './routes/auditoria.routes';
import vtrRoutes from './routes/vtr.routes';
import acessoriosRoutes from './routes/acessorios.routes';
const app = express();

const port = process.env.PORT || 3333;

/**
 * Lista de origens permitidas (CORS).
 * Evita que domínios não autorizados façam requisições para nossa API.
 */
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL || 'http://localhost:3000'
];

/**
 * Middleware: CORS (Cross-Origin Resource Sharing)
 * Configurado restritamente para permitir apenas os domínios mapeados em allowedOrigins.
 */
app.use(cors({
  origin: (origin, callback) => {
    // Permite conexões locais (sem origin) ou de domínios explicitamente na lista
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado pelo CORS do Athenas!'));
    }
  }
}));

/**
 * Middleware: Helmet
 * Proteção de Headers HTTP (Configuração explícita focada em conformidade com SAST e boas práticas).
 * Previne XSS, Clickjacking, MIME sniffing, entre outras vulnerabilidades comuns.
 */
app.use(helmet.dnsPrefetchControl());
app.use(helmet.hidePoweredBy());
app.use(helmet.hsts());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.frameguard());

/**
 * Middleware: Body Parser com limite restrito
 * Limita o payload JSON a 100kb para proteger o servidor contra ataques de negação de serviço (DoS).
 */
app.use(express.json({ limit: '100kb' }));

/**
 * Middleware: Mongo Sanitize
 * Remove chaves que contêm '$' ou '.' das requisições para evitar injeções NoSQL maliciosas.
 */
app.use((req, res, next) => {
  ['body', 'params', 'headers', 'query'].forEach((k) => {
    if ((req as any)[k]) {
      mongoSanitize.sanitize((req as any)[k]);
    }
  });
  next();
});

/**
 * Middleware: HPP (HTTP Parameter Pollution)
 * Impede a manipulação maliciosa de URLs que duplicam parâmetros (ex: ?status=A&status=B).
 */
app.use(hpp());

// O limiter global de API foi removido.
// Usamos um limiter focado em auth.routes.ts para evitar bloqueio por IP numa rede institucional.

// ==========================================
// REGISTRO DE ROTAS
// ==========================================

/**
 * Rota de Autenticação
 * Rota pública onde ocorre a verificação de credenciais e geração do JWT.
 */
app.use('/api/auth', authRoutes);

/**
 * Rotas da API (Protegidas)
 * Todas estas rotas exigem a presença de um token JWT válido verificado pelo authMiddleware.
 */
app.use('/api/unidades', authMiddleware, unidadesRoutes);
app.use('/api/equipamentos', authMiddleware, equipamentosRoutes);
app.use('/api/cautelas', authMiddleware, cautelasRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/militares', authMiddleware, militaresRoutes);
app.use('/api/usuarios', authMiddleware, usuariosRoutes);
app.use('/api/manutencoes', authMiddleware, manutencaoRoutes);
app.use('/api/extravios', authMiddleware, extraviosRoutes);
app.use('/api/transferencias', authMiddleware, transferenciasRoutes);
app.use('/api/auditoria', authMiddleware, auditoriaRoutes);
app.use('/api/vtr', authMiddleware, vtrRoutes);
app.use('/api/acessorios', authMiddleware, acessoriosRoutes);

/**
 * Endpoint raiz / Status
 * Fornece uma rápida confirmação no navegador se a API base está operante.
 */
app.get('/', (req: express.Request, res: express.Response) => {
  res.send('API Controle Patrimonial PMPA v1.0.0 está online!');
});

/**
 * Endpoint: Keep-Alive / Health Check
 * Usado internamente ou por plataformas de monitoramento para garantir a estabilidade do container.
 */
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    res.status(200).json({ status: 'UP', database: 'CONNECTED', timestamp: new Date() });
  } catch (error) {
    res.status(503).json({ status: 'DOWN', database: 'DISCONNECTED', timestamp: new Date() });
  }
});

/**
 * Inicialização do Servidor
 * Inicia a escuta da porta e o loop de pings internos (se hospedado em infraestruturas serverless que "dormem").
 */
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);

  // Lógica de Keep-Alive (Ping a cada 10 minutos para evitar cold-start)
  const URL_SISTEMA = process.env.RENDER_EXTERNAL_URL;
  if (URL_SISTEMA) {
    const https = require('https');
    console.log(`Auto-ping configurado para: ${URL_SISTEMA}`);
    setInterval(() => {
      https.get(`${URL_SISTEMA}/api/health`, (res: any) => {
        console.log(`Ping de atividade: ${res.statusCode}`);
      }).on('error', (err: any) => {
        console.error('Erro no auto-ping:', err.message);
      });
    }, 10 * 60 * 1000); // 10 minutos
  }
});
