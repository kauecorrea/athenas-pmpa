import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, FileText, ChevronDown, AlertTriangle } from 'lucide-react';

interface ExtravioRecord {
  id: number;
  equipamento: { rp: string; numSerie: string; idRadio: string };
  militar: { nome: string; posto: string } | null;
  dataExtravio: string;
  local: string | null;
  descricao: string;
  status: string;
}

interface EquipamentoDisponivel {
  id: number;
  rp: string;
  numSerie: string;
  idRadio: string;
}

interface Militar {
  id: number;
  nome: string;
  posto: string;
}

const Extraviados: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [radiosDisponiveis, setRadiosDisponiveis] = useState<EquipamentoDisponivel[]>([]);
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [extravios, setExtravios] = useState<ExtravioRecord[]>([]);

  // Form states
  const [equipamentoId, setEquipamentoId] = useState('');
  const [militarId, setMilitarId] = useState('');
  const [dataExtravio, setDataExtravio] = useState('');
  const [local, setLocal] = useState('');
  const [descricao, setDescricao] = useState('');

  useEffect(() => {
    fetchExtravios();
  }, []);

  useEffect(() => {
    if (isFormOpen) {
      fetchEquipamentosParaExtravio();
      fetchMilitares();
    }
  }, [isFormOpen]);

  const fetchExtravios = async () => {
    try {
      const res = await axios.get('http://localhost:3333/api/extravios');
      setExtravios(res.data);
    } catch (error) {
      console.error("Erro ao buscar extravios", error);
    }
  };

  const fetchMilitares = async () => {
    try {
      const res = await axios.get('http://localhost:3333/api/militares');
      setMilitares(res.data);
    } catch (error) {
      console.error("Erro ao buscar militares", error);
    }
  };

  const fetchEquipamentosParaExtravio = async () => {
    try {
      const res = await axios.get('http://localhost:3333/api/equipamentos');
      // Qualquer rádio pode ser extraviado (até os operacionais), exceto os que JÁ ESTÃO extraviados
      const disponiveis = res.data.filter((eq: any) => eq.status !== 'EXTRAVIADO');
      setRadiosDisponiveis(disponiveis);
    } catch (error) {
      console.error("Erro ao buscar equipamentos para extravio", error);
    }
  };

  const handleCreateExtravio = async () => {
    if (!equipamentoId || !descricao) {
      alert("Preencha o Rádio e a Descrição/B.O obrigatoriamente.");
      return;
    }

    try {
      await axios.post('http://localhost:3333/api/extravios', {
        equipamentoId: Number(equipamentoId),
        militarId: militarId ? Number(militarId) : null,
        dataExtravio: dataExtravio ? new Date(dataExtravio).toISOString() : new Date().toISOString(),
        local,
        descricao
      });
      setIsFormOpen(false);
      setEquipamentoId('');
      setMilitarId('');
      setDataExtravio('');
      setLocal('');
      setDescricao('');
      fetchExtravios(); // Atualiza a tabela
    } catch (error) {
      console.error("Erro ao registrar extravio", error);
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
          <p className="text-gray-500 dark:text-gray-400 mt-1">Acervo oficial de Furtos, Perdas e Danos Irrecuperáveis</p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus size={18} />
            Registrar B.O de Extravio
          </button>
        )}
      </div>

      {/* INLINE FORM: REGISTRAR EXTRAVIO */}
      {isFormOpen && (
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-shrink-0 transition-colors">
          <div className="p-6 border-b border-gray-200 dark:border-[#1f2937]">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Registrar Perda / Extravio</h2>
            <p className="text-sm text-gray-500 mt-1">Ao registrar o rádio sai definitivamente do controle de "Operacionais".</p>
          </div>
          
          <div className="p-6 space-y-4">
            
            {/* Equipamento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Equipamento Ausente</label>
                <div className="relative">
                  <select 
                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                    value={equipamentoId}
                    onChange={(e) => setEquipamentoId(e.target.value)}
                  >
                    <option value="" disabled>Selecione a máquina perdida</option>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Quem estava responsável?</label>
                <div className="relative">
                  <select 
                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                    value={militarId}
                    onChange={(e) => setMilitarId(e.target.value)}
                  >
                    <option value="">Não informado (ou do Batalhão)</option>
                    {militares.map(m => (
                      <option key={m.id} value={m.id}>{m.posto} {m.nome}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                </div>
              </div>
            </div>

            {/* Data e Local */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Data Crítica (quando ocorreu?)</label>
                <input 
                  type="date"
                  value={dataExtravio}
                  onChange={(e) => setDataExtravio(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Local (Cidade / Rua / Evento)</label>
                <input 
                  type="text"
                  placeholder="Ex: Praça Batista Campos"
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>

            {/* Descrição do Ocorrido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Resumo / Número do B.O / Sindicância</label>
              <textarea 
                rows={3}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Exemplo: Rádio foi subtraído do armário do aloja e a parte confeccionada foi a Num. 3432/2026."
                className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
              />
            </div>

          </div>

          <div className="p-6 pt-2 flex items-center gap-3">
            <button 
              onClick={handleCreateExtravio}
              className="px-6 py-2.5 text-sm font-medium text-white bg-danger hover:bg-red-700 rounded-lg transition-colors shadow-lg shadow-red-600/20"
            >
              Registrar Perda
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
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Relação de Documentos Físicos de Extravio</h2>
        </div>
        
        <div className="flex-1 overflow-auto z-0">
          <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-[#0b101a] text-gray-500 dark:text-gray-400 font-medium text-xs sticky top-0 z-0">
              <tr>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">RP / Série</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Oficial Acompanhando</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Data do Evento</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Localização</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Resumo / B.O</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Andamento IPD</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937] text-right">Documentos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1f2937]">
              {extravios.length === 0 ? (
                <tr>
                   <td colSpan={7} className="px-6 py-12 text-center text-gray-500 bg-transparent">
                     Excelente operação! Nenhum equipamento extraviado histórico registrado.
                   </td>
                </tr>
              ) : (
                extravios.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2937]/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                      {e.equipamento?.rp} <br/><span className="text-xs font-normal text-gray-500">{e.equipamento?.numSerie}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {e.militar ? `${e.militar.posto} ${e.militar.nome}` : 'Apurar'}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {new Date(e.dataExtravio).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 truncate max-w-[150px]" title={e.local || ''}>{e.local || '-'}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 truncate max-w-[200px]" title={e.descricao}>{e.descricao}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-[11px] font-bold text-danger bg-danger/10 border border-danger/20 rounded-full uppercase tracking-wider">
                        {e.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 text-gray-400 dark:text-gray-500">
                        <button className="hover:text-gray-900 dark:hover:text-white p-1.5 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-white/5" title="Baixar Boletim Relatório">
                          <FileText size={16} />
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
