import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, CheckCircle, MapPin, PenTool, AlertTriangle, TrendingUp } from 'lucide-react';

interface DashboardStats {
  total: number;
  operacional: number;
  cautelado: number;
  emManutencao: number;
  extraviados: number;
  cautelasVencidas: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    operacional: 0,
    cautelado: 0,
    emManutencao: 0,
    extraviados: 0,
    cautelasVencidas: 0
  });

  useEffect(() => {
    // Busca dados reais do backend
    axios.get('http://localhost:3333/api/dashboard/stats')
      .then(response => {
        setStats(response.data);
      })
      .catch(error => {
        console.error("Erro ao buscar estatísticas.", error);
        // Reseta para 0 ao invés de usar mocks para não confundir o usuário
        setStats({
          total: 0,
          operacional: 0,
          cautelado: 0,
          emManutencao: 0,
          extraviados: 0,
          cautelasVencidas: 0
        });
      });
  }, []);

  const cards = [
    { title: 'TOTAL DE EQUIPAMENTOS', value: stats.total, icon: Activity, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    { title: 'OPERACIONAL', value: stats.operacional, icon: CheckCircle, color: 'text-success', bg: 'bg-success/10 border-success/20' },
    { title: 'CAUTELADO', value: stats.cautelado, icon: MapPin, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
    { title: 'EM MANUTENÇÃO', value: stats.emManutencao, icon: PenTool, color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
    { title: 'EXTRAVIADOS', value: stats.extraviados, icon: AlertTriangle, color: 'text-danger', bg: 'bg-danger/10 border-danger/20' },
    { title: 'CAUTELAS VENCIDAS', value: stats.cautelasVencidas, icon: TrendingUp, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in text-gray-900 dark:text-white transition-colors duration-200">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Visão geral e análise do sistema de equipamentos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card, index) => (
          <div key={index} className={`rounded-xl border border-gray-200 dark:border-[#1f2937] bg-white dark:bg-surface p-5 flex flex-col justify-between h-32 relative overflow-hidden group hover:border-gray-300 dark:hover:border-[#374151] transition-colors`}>
            <div className={`absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity ${card.bg.split(' ')[0]}`} />
            
            <div className="flex justify-between items-start">
              <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                {card.title}
              </h3>
              <card.icon size={16} className={`${card.color} opacity-80`} />
            </div>
            
            <div className="text-4xl font-bold mt-2">
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        {/* Equipamentos por Estado */}
        <div className="bg-white dark:bg-surface rounded-xl border border-gray-200 dark:border-[#1f2937] p-6 shadow-sm flex flex-col h-[400px]">
          <h2 className="text-lg font-bold mb-6">Equipamentos por Estado</h2>
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-[#1f2937]">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="font-medium text-sm">Operacional</span>
              </div>
              <span className="text-success font-bold text-xl">{stats.operacional}</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-[#1f2937]">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="font-medium text-sm">Cautelado</span>
              </div>
              <span className="text-blue-400 font-bold text-xl">{stats.cautelado}</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-[#1f2937]">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <span className="font-medium text-sm">Manutenção</span>
              </div>
              <span className="text-warning font-bold text-xl">{stats.emManutencao}</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-[#1f2937]">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-danger" />
                <span className="font-medium text-sm">Extraviado</span>
              </div>
              <span className="text-danger font-bold text-xl">{stats.extraviados}</span>
            </div>
          </div>
        </div>

        {/* Guia Rápido */}
        <div className="bg-white dark:bg-surface rounded-xl border border-gray-200 dark:border-[#1f2937] p-6 shadow-sm flex flex-col h-[400px]">
          <h2 className="text-lg font-bold mb-6">Guia Rápido</h2>
          
          <div className="bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-[#1f2937] p-4 rounded-lg text-sm text-gray-700 dark:text-gray-300 mb-4">
            Sistema inicializado com sucesso. Utilize o menu lateral para navegar entre as funcionalidades disponíveis.
          </div>

          <div className="border border-primary/30 bg-primary/5 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <TrendingUp size={16} />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Primeiros Passos</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 ml-11 leading-relaxed">
              Comece cadastrando unidades militares, depois registre os militares e por fim cadastre os equipamentos individuais.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
