import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, FileText, ChevronDown, AlertTriangle } from 'lucide-react';

interface MockExtravio {
  id: number;
  idRadio: string;
  rp: string;
  responsavel: string;
  dataExtravio: string;
  local: string;
  descricao: string;
  status: string;
}

interface EquipamentoDisponivel {
  id: number;
  rp: string;
  numSerie: string;
  idRadio: string;
}

const Extraviados: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [radiosDisponiveis, setRadiosDisponiveis] = useState<EquipamentoDisponivel[]>([]);

  // Tabela Vazia como no Print
  const extraviosPlaceholder: MockExtravio[] = [];

  useEffect(() => {
    // Buscar equipamentos quando o formulário for aberto (para listar no select)
    if (isFormOpen) {
      fetchEquipamentosParaExtravio();
    }
  }, [isFormOpen]);

  const fetchEquipamentosParaExtravio = async () => {
    try {
      const res = await axios.get('http://localhost:3333/api/equipamentos');
      // Todos os rádios exceto os que JÁ ESTÃO extraviados podem ser declarados como extraviados.
      const disponiveis = res.data.filter((eq: any) => eq.status !== 'EXTRAVIADO');
      setRadiosDisponiveis(disponiveis);
    } catch (error) {
      console.error("Erro ao buscar equipamentos para extravio", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in text-gray-900 dark:text-white h-full flex flex-col transition-colors duration-200">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
             Extraviados
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Registro de equipamentos extraviados</p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus size={18} />
            Registrar Extravio
          </button>
        )}
      </div>

      {/* INLINE FORM: REGISTRAR EXTRAVIO */}
      {isFormOpen && (
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-shrink-0 transition-colors">
          <div className="p-6 border-b border-gray-200 dark:border-[#1f2937]">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Registrar Extravio</h2>
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

            {/* Militar Responsável */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Militar Responsável</label>
              <div className="relative">
                <select 
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                  defaultValue=""
                >
                  <option value="" disabled>Selecione o militar</option>
                  {/* Mocking for layout */}
                  <option value="1">Mario - CIEPAS</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
              </div>
            </div>

            {/* Data e Local */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Data do Extravio</label>
              <input 
                type="date"
                className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Local do Extravio</label>
              <input 
                type="text"
                placeholder="Local onde ocorreu o extravio"
                className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* Descrição do Ocorrido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descrição do Ocorrido</label>
              <textarea 
                rows={3}
                placeholder="Descreva as circunstâncias do extravio"
                className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
              />
            </div>

          </div>

          <div className="p-6 pt-2 flex items-center gap-3">
            <button 
              onClick={() => setIsFormOpen(false)}
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-lg shadow-blue-600/20"
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

      {/* TABELA DE EQUIPAMENTOS EXTRAVIADOS */}
      <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col overflow-hidden transition-colors">
        
        <div className="p-5 border-b border-gray-200 dark:border-[#1f2937] flex items-center gap-2">
          <AlertTriangle className="text-danger" size={20} />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Equipamentos Extraviados</h2>
        </div>
        
        <div className="flex-1 overflow-auto z-0">
          <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-[#0b101a] text-gray-500 dark:text-gray-400 font-medium text-xs sticky top-0 z-0">
              <tr>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">ID do Rádio</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Patrimônio</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Responsável</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Data</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Local</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Descrição</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Status</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1f2937]">
              {extraviosPlaceholder.length === 0 ? (
                <tr>
                   <td colSpan={8} className="px-6 py-12 text-center text-gray-500 bg-transparent">
                     Nenhum equipamento extraviado registrado.
                   </td>
                </tr>
              ) : (
                extraviosPlaceholder.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2937]/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{e.idRadio}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{e.rp}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{e.responsavel}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{e.dataExtravio}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{e.local}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{e.descricao}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-[11px] font-bold text-danger bg-danger/10 border border-danger/20 rounded-full uppercase tracking-wider">
                        {e.status}
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

export default Extraviados;
