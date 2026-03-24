import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Wrench, Edit2, FileText, ChevronDown, CheckCircle } from 'lucide-react';

interface ManutencaoRecord {
  id: number;
  equipamento: { rp: string; numSerie: string; idRadio: string };
  problema: string;
  dataEntrada: string;
  previsaoRetorno: string | null;
  dataConclusao: string | null;
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
  const [manutencoes, setManutencoes] = useState<ManutencaoRecord[]>([]);

  // Form states
  const [equipamentoId, setEquipamentoId] = useState('');
  const [problema, setProblema] = useState('');
  const [dataEntrada, setDataEntrada] = useState('');
  const [previsaoRetorno, setPrevisaoRetorno] = useState('');

  useEffect(() => {
    fetchManutencoes();
  }, []);

  useEffect(() => {
    // Buscar equipamentos quando o formulário for aberto
    if (isFormOpen) {
      fetchEquipamentosParaManutencao();
    }
  }, [isFormOpen]);

  const fetchManutencoes = async () => {
    try {
      const res = await axios.get('http://localhost:3333/api/manutencoes');
      setManutencoes(res.data);
    } catch (error) {
      console.error("Erro ao buscar manutenções", error);
    }
  };

  const fetchEquipamentosParaManutencao = async () => {
    try {
      const res = await axios.get('http://localhost:3333/api/equipamentos');
      // Filtra Rádios que não estão em manutenção e nem extraviados permanentemente
      const disponiveis = res.data.filter((eq: any) => eq.status !== 'MANUTENCAO' && eq.status !== 'EXTRAVIADO');
      setRadiosDisponiveis(disponiveis);
    } catch (error) {
      console.error("Erro ao buscar equipamentos para manutenção", error);
    }
  };

  const handleCreateManutencao = async () => {
    if (!equipamentoId || !problema) {
      alert("Preencha o equipamento e o problema.");
      return;
    }

    try {
      await axios.post('http://localhost:3333/api/manutencoes', {
        equipamentoId: Number(equipamentoId),
        problema,
        dataEntrada: dataEntrada ? new Date(dataEntrada).toISOString() : new Date().toISOString(),
        previsaoRetorno: previsaoRetorno ? new Date(previsaoRetorno).toISOString() : null
      });
      setIsFormOpen(false);
      setEquipamentoId('');
      setProblema('');
      setDataEntrada('');
      setPrevisaoRetorno('');
      fetchManutencoes(); // reload list
    } catch (error) {
      console.error("Erro ao registrar manutenção", error);
    }
  };

  const handleConcluir = async (id: number) => {
    if (window.confirm('Confirma o término da manutenção e retorno ao status Operacional?')) {
      try {
        await axios.put(`http://localhost:3333/api/manutencoes/${id}/concluir`);
        fetchManutencoes();
      } catch (error) {
        console.error("Erro ao concluir", error);
      }
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
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gerenciamento de consertos ou reparos preventivos</p>
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
                  value={equipamentoId}
                  onChange={(e) => setEquipamentoId(e.target.value)}
                >
                  <option value="" disabled>Selecione o rádio com problema</option>
                  {radiosDisponiveis.map(radio => (
                    <option key={radio.id} value={radio.id}>
                      {radio.rp} - {radio.numSerie} {radio.idRadio ? `(${radio.idRadio})` : ''} - [{radio.idRadio || 'Sem ID'}]
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
                value={problema}
                onChange={(e) => setProblema(e.target.value)}
                placeholder="Exemplo: Antena trincada, botão PTT falhando, não carrega bateria..."
                className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
              />
            </div>

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Data de Entrada</label>
                <input 
                  type="date"
                  value={dataEntrada}
                  onChange={(e) => setDataEntrada(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Previsão de Retorno</label>
                <input 
                  type="date" 
                  value={previsaoRetorno}
                  onChange={(e) => setPrevisaoRetorno(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>
          </div>

          <div className="p-6 pt-2 flex items-center gap-3">
            <button 
              onClick={handleCreateManutencao}
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
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Patrimônio / Série</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Problema</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Datas</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Status</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1f2937]">
              {manutencoes.length === 0 ? (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-gray-500 bg-transparent">
                     Nenhum histórico de manutenção encontrado.
                   </td>
                </tr>
              ) : (
                manutencoes.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2937]/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{m.equipamento?.idRadio || '-'}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {m.equipamento?.rp} <span className="text-gray-400 font-normal">({m.equipamento?.numSerie})</span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 truncate max-w-[200px]" title={m.problema}>{m.problema}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      Entrada: {new Date(m.dataEntrada).toLocaleDateString('pt-BR')} <br/>
                      <span className="text-xs text-gray-400">Previsão: {m.previsaoRetorno ? new Date(m.previsaoRetorno).toLocaleDateString('pt-BR') : '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      {m.status === 'EM ANDAMENTO' ? (
                        <span className="px-2.5 py-1 text-[11px] font-bold text-orange-600 bg-orange-500/10 border border-orange-500/20 rounded-full lowercase tracking-wider">
                          Na Oficina
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-[11px] font-bold text-success bg-success/10 border border-success/20 rounded-full lowercase tracking-wider">
                          Concluída
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 text-gray-400 dark:text-gray-500">
                        <button className="hover:text-gray-900 dark:hover:text-white p-1.5 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-white/5" title="Emitir Ordem de Serviço">
                          <FileText size={16} />
                        </button>
                        {m.status === 'EM ANDAMENTO' && (
                          <button 
                            onClick={() => handleConcluir(m.id)}
                            className="hover:text-success dark:hover:text-success p-1.5 rounded-lg transition-colors hover:bg-success/10"
                            title="Finalizar Conserto"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
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
