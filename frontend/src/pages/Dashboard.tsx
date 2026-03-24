import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Radio, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  ArrowUpRight, 
  Activity,
  Clock,
  Ban
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';

interface DashboardStats {
  total: number;
  operacional: number;
  cautelado: number;
  emManutencao: number;
  extraviados: number;
  cautelasVencidas: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://localhost:3333/api/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      }
    };
    fetchStats();
  }, []);

  // Dados Mockados para os Gráficos enquanto a API não fornece o histórico
  const historyData = [
    { name: 'Seg', cautelas: 4 },
    { name: 'Ter', cautelas: 7 },
    { name: 'Qua', cautelas: 3 },
    { name: 'Qui', cautelas: 8 },
    { name: 'Sex', cautelas: 12 },
    { name: 'Sáb', cautelas: 2 },
    { name: 'Dom', cautelas: 5 },
  ];

  const pieData = [
    { name: 'Operacionais', value: stats?.operacional || 0, color: '#3b82f6' }, // Azul
    { name: 'Cautelados', value: stats?.cautelado || 0, color: '#f59e0b' },    // Laranja/Amarelo
    { name: 'Manutenção', value: stats?.emManutencao || 0, color: '#ef4444' }, // Vermelho
    { name: 'Extraviados', value: stats?.extraviados || 0, color: '#1f2937' }, // Cinza Escuro
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in text-gray-900 dark:text-white pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Activity className="text-primary" size={28} />
            Visão Geral
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Resumo do patrimônio de radiocomunicação da PMPA
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] px-4 py-2 rounded-lg shadow-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sistema Conectado</span>
        </div>
      </div>

      {/* CARDS DE ESTATÍSTICAS PRINCIPAIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        
        {/* Total Operacional */}
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Operacionais</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats?.operacional || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400 relative z-10">
            <ArrowUpRight size={16} />
            <span>Saudável</span>
          </div>
        </div>

        {/* Cautelados - PRIMARY ACCENT (Laranja Ativo) */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-800 p-6 rounded-2xl shadow-lg shadow-orange-500/20 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-medium text-orange-100">Rádios em Cautela</p>
              <h3 className="text-3xl font-bold mt-2">{stats?.cautelado || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-sm">
              <Radio size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm font-medium text-orange-50 relative z-10">
            <TrendingUp size={16} />
            <span>Em uso nas ruas</span>
          </div>
        </div>

        {/* Em Manutenção */}
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Em Manutenção</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats?.emManutencao || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400">
              <Wrench size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400 relative z-10">
            <AlertTriangle size={16} />
            <span>Requer Atenção</span>
          </div>
        </div>

        {/* Cautelas Vencidas */}
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cautelas Vencidas</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats?.cautelasVencidas || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-yellow-50 dark:bg-yellow-500/10 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
              <Clock size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm font-medium text-yellow-600 dark:text-yellow-400 relative z-10">
            <AlertTriangle size={16} />
            <span>Retornos Atrasados</span>
          </div>
        </div>

        {/* Extraviados */}
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gray-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rádios Extraviados</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats?.extraviados || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-[#111827] flex items-center justify-center text-gray-600 dark:text-gray-400">
              <Ban size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-gray-400 relative z-10">
            <span>Perdas Registradas</span>
          </div>
        </div>

        {/* Total do Acervo */}
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gray-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total do Acervo</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats?.total || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300">
              <Radio size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-gray-400 relative z-10">
            <span>Volume Patrimonial</span>
          </div>
        </div>

      </div>

      {/* ÁREA DOS GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* Gráfico de Barras: Produtividade (Cautelas na semana) */}
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-2xl p-6 lg:col-span-2 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Fluxo de Cautelas na Semana</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Quantidade de rádios emprestados por dia</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(249, 115, 22, 0.1)' }}
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                  itemStyle={{ color: '#f97316' }}
                />
                <Bar 
                  dataKey="cautelas" 
                  fill="#f97316" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Pizza: Distribuição de Status */}
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="mb-2">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Capacidade Operativa</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Distribuição atual dos equipamentos</p>
          </div>
          <div className="flex-1 min-h-[250px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span style={{ color: '#9ca3af', fontSize: '13px' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
