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

// Rota inicial / Teste
app.get('/', (req: express.Request, res: express.Response) => {
  res.send('API Controle Patrimonial PMPA v1.0.0 está online!');
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
