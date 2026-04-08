import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';

import { authMiddleware } from './middlewares/auth.middleware';

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

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3333;

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL || 'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado pelo CORS do Athenas!'));
    }
  }
}));
app.use(express.json());

// Rate Limiter Global contra DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300, // limite original restaurado após importação massiva
  message: { error: 'Muitas requisições. Tente novamente mais tarde.' },
});
app.use('/api', limiter);

// Rota de Autenticação (Aberta)
app.use('/api/auth', authRoutes);

// Rotas da API (Protegidas)
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

// Rota inicial / Teste
app.get('/', (req: express.Request, res: express.Response) => {
  res.send('API Controle Patrimonial PMPA v1.0.0 está online!');
});

// Endpoint de Keep-Alive para monitoramento externo
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);

  // Lógica de Keep-Alive (Ping a cada 10 minutos)
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
