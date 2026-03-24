import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

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

app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/api/unidades', unidadesRoutes);
app.use('/api/equipamentos', equipamentosRoutes);
app.use('/api/cautelas', cautelasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/militares', militaresRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/manutencoes', manutencaoRoutes);
app.use('/api/extravios', extraviosRoutes);
app.use('/api/transferencias', transferenciasRoutes);
app.use('/api/auditoria', auditoriaRoutes);

// Rota inicial / Teste
app.get('/', (req: express.Request, res: express.Response) => {
  res.send('API Controle Patrimonial PMPA v1.0.0 está online!');
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
