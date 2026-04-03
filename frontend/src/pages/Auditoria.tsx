import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Activity, CalendarDays, User } from 'lucide-react';

interface AuditoriaRecord {
  id: string;
  usuario: string;
  acao: string;
  detalhes: string | null;
  dataHora: string;
}

const Auditoria: React.FC = () => {
  const [logs, setLogs] = useState<AuditoriaRecord[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/auditoria');
      setLogs(res.data);
    } catch (error) {
      console.error("Erro ao carregar auditoria de sistema", error);
    } finally {
      setLoading(false);
    }
  };

  const logsFiltrados = logs.filter(log => 
    !busca || 
    log.usuario.toLowerCase().includes(busca.toLowerCase()) || 
    log.acao.toLowerCase().includes(busca.toLowerCase()) ||
    (log.detalhes && log.detalhes.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in text-gray-900 dark:text-white pb-10">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
             Registros de Auditoria (Sistema)
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Apenas usuários Administradores têm acesso a este livro de transações irrefutáveis.</p>
        </div>
      </div>

      {/* PAINEL DE BUSCA */}
      <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex items-center justify-between gap-4 p-4">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por PM, Ação ou Identificador..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-medium text-gray-500 bg-gray-100 dark:bg-[#111827] px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#374151] whitespace-nowrap">
            Logs: {logs.length}
          </span>
        </div>
      </div>
      
      {/* LISTA DE LOGS NO ESTILO TIMELINE RESPONSIVA */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-10 text-center text-primary font-medium animate-pulse">Consultando Diário Transacional...</div>
        ) : logsFiltrados.length === 0 ? (
          <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] p-10 rounded-xl text-center text-gray-500">
             Nenhuma movimentação encontrada com o termo "{busca}".
          </div>
        ) : (
          logsFiltrados.map((log) => (
            <div key={log.id} className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              {/* Dente visual lateral esquerdo */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-primary/30 opacity-70 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                
                {/* Ícone Ação */}
                <div className="hidden md:flex flex-shrink-0 mt-1">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-[#1a2333] border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-primary">
                    <Activity size={18} />
                  </div>
                </div>
                
                {/* Conteúdo Central */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">
                      {log.acao}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#111827] px-2.5 py-1 rounded-md">
                      <CalendarDays size={13} />
                      {new Date(log.dataHora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })}
                    </div>
                  </div>
                  
                  {log.detalhes && (
                    <div className="bg-gray-50 dark:bg-[#0b101a] border border-gray-200 dark:border-[#1f2937] rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300 font-mono">
                      <span className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-1 block">Detalhes do Evento</span>
                      {log.detalhes}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-2">
                    <User size={14} className="text-gray-400" />
                    <span className="font-medium">
                      Autor: <span className="text-gray-900 dark:text-white">{log.usuario}</span>
                    </span>
                  </div>
                  
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default Auditoria;
