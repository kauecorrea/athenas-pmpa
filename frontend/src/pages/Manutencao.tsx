import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Wrench, Edit2, FileText, ChevronDown } from 'lucide-react';

interface MockManutencao {
  id: number;
  idRadio: string;
  rp: string;
  problema: string;
  dataEntrada: string;
  previsaoRetorno: string;
  status: string;
}

interface EquipamentoDisponivel {
  id: number;
  rp: string;
  numSerie: string;
  idRadio: string;
}

const Manutencao: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [radiosDisponiveis, setRadiosDisponiveis] = useState<EquipamentoDisponivel[]>([]);

  // Tabela Vazia como no Print
  const manutencoesPlaceholder: MockManutencao[] = [];

  useEffect(() => {
    // Buscar equipamentos quando o formulário for aberto (para listar no select)
    if (isFormOpen) {
      fetchEquipamentosParaManutencao();
    }
  }, [isFormOpen]);

  const fetchEquipamentosParaManutencao = async () => {
    try {
      const res = await axios.get('http://localhost:3333/api/equipamentos');
      // Filtra Rádios que não estão extraviados ou transferidos para outras unidades permanentemente, 
      // embora rádios cautelados não devessem ir direto para manutenção sem baixa, por segurança exibimos todos operacionais.
      const disponiveis = res.data.filter((eq: any) => eq.status !== 'MANUTENCAO' && eq.status !== 'EXTRAVIADO');
      setRadiosDisponiveis(disponiveis);
    } catch (error) {
      console.error("Erro ao buscar equipamentos para manutenção", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in text-gray-900 dark:text-white h-full flex flex-col transition-colors duration-200">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
             Manutenção
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gerenciamento de equipamentos em manutenção</p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus size={18} />
            Nova Manutenção
          </button>
        )}
      </div>

      {/* INLINE FORM: REGISTRAR MANUTENÇÃO */}
      {isFormOpen && (
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-shrink-0 transition-colors">
          <div className="p-6 border-b border-gray-200 dark:border-[#1f2937]">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Registrar Manutenção</h2>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Equipamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Equipamento</label>
              <div className="relative">
                <select 
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                  defaultValue=""
                >
                  <option value="" disabled>Selecione o rádio</option>
                  {radiosDisponiveis.map(radio => (
                    <option key={radio.id} value={radio.id}>
                      {radio.rp} - {radio.numSerie} {radio.idRadio ? `(${radio.idRadio})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
              </div>
            </div>

            {/* Descrição do Problema */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descrição do Problema</label>
              <textarea 
                rows={3}
                placeholder="Descreva o problema do equipamento"
                className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
              />
            </div>

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Data de Entrada</label>
                <input 
                  type="date"
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Previsão de Retorno</label>
                <input 
                  type="date" 
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>
          </div>

          <div className="p-6 pt-2 flex items-center gap-3">
            <button 
              onClick={() => setIsFormOpen(false)}
              className="px-6 py-2.5 text-sm font-medium text-white bg-primary hover:bg-blue-600 rounded-lg transition-colors shadow-lg shadow-blue-600/20"
            >
              Registrar
            </button>
            <button 
              onClick={() => setIsFormOpen(false)}
              className="px-6 py-2.5 text-sm font-medium text-gray-400 border border-[#374151] hover:text-white dark:hover:bg-[#1f2937] hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* TABELA DE EQUIPAMENTOS EM MANUTENÇÃO */}
      <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col overflow-hidden transition-colors">
        
        <div className="p-5 border-b border-gray-200 dark:border-[#1f2937] flex items-center gap-2">
          <Wrench className="text-gray-400 dark:text-gray-500" size={20} />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Equipamentos em Manutenção</h2>
        </div>
        
        <div className="flex-1 overflow-auto z-0">
          <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-[#0b101a] text-gray-500 dark:text-gray-400 font-medium text-xs sticky top-0 z-0">
              <tr>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">ID do Rádio</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Patrimônio</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Problema</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Entrada</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Previsão Retorno</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Status</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1f2937]">
              {manutencoesPlaceholder.length === 0 ? (
                <tr>
                   <td colSpan={7} className="px-6 py-12 text-center text-gray-500 bg-transparent">
                     Nenhum equipamento em manutenção no momento.
                   </td>
                </tr>
              ) : (
                manutencoesPlaceholder.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2937]/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{m.idRadio}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{m.rp}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{m.problema}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{m.dataEntrada}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{m.previsaoRetorno}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-[11px] font-bold text-orange-500 bg-orange-500/10 border border-orange-500/20 rounded-full uppercase tracking-wider">
                        {m.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 text-gray-400 dark:text-gray-500">
                        <button className="hover:text-gray-900 dark:hover:text-white p-1.5 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-white/5">
                          <FileText size={16} />
                        </button>
                        <button className="hover:text-gray-900 dark:hover:text-white p-1.5 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-white/5">
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Manutencao;
