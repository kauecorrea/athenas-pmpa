import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, FileText, Edit2, Download, ChevronDown } from 'lucide-react';

interface MockCautela {
  id: number;
  militar: string;
  unidade: string;
  quantidade: number;
  dataInicio: string;
  dataRetorno: string;
  missao: string;
  status: string;
}

interface EquipamentoDisponivel {
  id: number;
  rp: string;
  numSerie: string;
  idRadio: string;
}

const Cautelas: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [buscaTratada, setBuscaTratada] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos - Status');
  const [radiosDisponiveis, setRadiosDisponiveis] = useState<EquipamentoDisponivel[]>([]);
  const [radiosSelecionados, setRadiosSelecionados] = useState<number[]>([]);

  useEffect(() => {
    // Buscar equipamentos apenas quando o modal for aberto
    if (isModalOpen) {
      fetchEquipamentosOperacionais();
    }
  }, [isModalOpen]);

  const fetchEquipamentosOperacionais = async () => {
    try {
      const res = await axios.get('http://localhost:3333/api/equipamentos');
      // Filtrar apenas os Rádios que estão com status OPERACIONAL (livres para cautela)
      const operacionais = res.data.filter((eq: any) => eq.status === 'OPERACIONAL');
      setRadiosDisponiveis(operacionais);
    } catch (error) {
      console.error("Erro ao buscar equipamentos operacionais", error);
    }
  };

  const toggleRadioSelection = (id: number) => {
    if (radiosSelecionados.includes(id)) {
      setRadiosSelecionados(radiosSelecionados.filter(selectedId => selectedId !== id));
    } else {
      setRadiosSelecionados([...radiosSelecionados, id]);
    }
  };

  // Hardcoded mock data exactly as requested in the print to construct the UI skeleton
  const cautelasPlaceholder: MockCautela[] = [
    {
      id: 1,
      militar: 'Mario',
      unidade: 'CIEPAS',
      quantidade: 3,
      dataInicio: '26/11/2025',
      dataRetorno: '28/11/2025',
      missao: '',
      status: 'Devolvida'
    },
    {
      id: 2,
      militar: 'Mario',
      unidade: 'CIEPAS',
      quantidade: 2,
      dataInicio: '23/11/2025',
      dataRetorno: '26/11/2025',
      missao: '',
      status: 'Devolvida'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in text-gray-900 dark:text-white h-full flex flex-col transition-colors duration-200">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
             Cautelas
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gerenciamento de cautelas de rádios</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-gray-100 dark:bg-surface border border-gray-300 dark:border-[#374151] hover:bg-gray-200 dark:hover:bg-[#1f2937] text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors">
            <Download size={16} />
            Gerar Relatório
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus size={18} />
            Nova Cautela
          </button>
        </div>
      </div>

      {/* FILTROS E TABELA */}
      <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col overflow-hidden transition-colors">
        
        {/* FILTER BAR */}
        <div className="p-4 border-b border-gray-200 dark:border-[#1f2937] flex items-center justify-between gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[300px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por militar, unidade, missão..." 
              value={buscaTratada}
              onChange={(e) => setBuscaTratada(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer z-50">
              <div className="bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] hover:border-gray-400 dark:hover:border-gray-500 rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between gap-3 min-w-[160px] transition-colors">
                <span className="truncate">{filtroStatus}</span>
                <ChevronDown size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
              </div>
              <div className="absolute top-full mt-1 w-full right-0 bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#374151] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-1">
                <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer" onClick={() => setFiltroStatus('Todos - Status')}>Todos - Status</div>
                <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer" onClick={() => setFiltroStatus('Ativa')}>Ativa</div>
                <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer" onClick={() => setFiltroStatus('Devolvida')}>Devolvida</div>
                <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer" onClick={() => setFiltroStatus('Vencida')}>Vencida</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* TABLE CONTENT */}
        <div className="flex-1 overflow-auto z-0">
          <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-[#0b101a] text-gray-500 dark:text-gray-400 font-medium text-xs sticky top-0 z-0">
              <tr>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Militar</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Unidade</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Quantidade</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Data Início</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Data Retorno</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Missão</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Status</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1f2937]">
              {cautelasPlaceholder.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2937]/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{c.militar}</td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{c.unidade}</td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{c.quantidade}</td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{c.dataInicio}</td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{c.dataRetorno}</td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{c.missao}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 text-[11px] font-bold text-success bg-success/10 border border-success/20 rounded-full lowercase tracking-wider">
                      {c.status}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NOVA CAUTELA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl w-full max-w-[600px] shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-200 dark:border-[#1f2937] flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nova Cautela</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Preencha as informações da cautela</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              
              {/* Militar Responsável */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Militar Responsável</label>
                <div className="relative">
                  <select 
                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                    defaultValue=""
                  >
                    <option value="" disabled>Selecione um militar</option>
                    <option value="1">Mario - CIEPAS</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                </div>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Data de Início</label>
                  <input 
                    type="date"
                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Data de Retorno</label>
                  <input 
                    type="date" 
                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              {/* Missão */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Missão</label>
                <textarea 
                  rows={3}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                />
              </div>

              {/* Rádios Disponíveis Component */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Rádios Disponíveis</label>
                <div className="border border-gray-300 dark:border-[#374151] bg-gray-50 dark:bg-[#111827] rounded-lg overflow-hidden flex flex-col">
                  {/* List of checkboxes */}
                  <div className="max-h-48 overflow-y-auto p-4 space-y-3">
                    {radiosDisponiveis.length === 0 ? (
                      <p className="text-sm text-gray-500 italic text-center py-2">Nenhum rádio operacional disponível.</p>
                    ) : (
                      radiosDisponiveis.map((radio) => (
                        <label key={radio.id} className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative flex items-center justify-center w-4 h-4 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface group-hover:border-primary transition-colors">
                            <input 
                              type="checkbox" 
                              className="peer w-full h-full opacity-0 cursor-pointer absolute" 
                              checked={radiosSelecionados.includes(radio.id)}
                              onChange={() => toggleRadioSelection(radio.id)}
                            />
                            <div className="hidden peer-checked:block pointer-events-none text-white absolute left-[-1px] top-[-1px] bg-primary rounded w-[18px] h-[18px] flex items-center justify-center">
                              <svg className="w-3 h-3 mx-auto mt-[2.5px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300 select-none font-medium">
                            {radio.rp} - {radio.numSerie} {radio.idRadio ? `(${radio.idRadio})` : ''}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
                {/* Selection Count Label */}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium ml-1">
                  {radiosSelecionados.length} rádio(s) selecionado(s)
                </p>
              </div>

            </div>

            {/* MODAL FOOTER */}
            <div className="p-6 border-t border-gray-200 dark:border-[#1f2937] flex items-center justify-end gap-3 flex-shrink-0">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#1f2937] rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-blue-600 rounded-lg transition-colors shadow-lg shadow-blue-600/20"
              >
                Criar Cautela
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Cautelas;
