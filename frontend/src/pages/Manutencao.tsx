import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Wrench, FileText, CheckCircle, Search, List } from 'lucide-react';
import ModalConfirmacao from '../components/ModalConfirmacao';
import jsPDF from 'jspdf';

interface ManutencaoRecord {
  id: string;
  equipamento: { 
    rp: string; 
    numSerie: string; 
    idRadio: string;
    marca: string | null;
    modelo: string | null;
  };
  problema: string;
  dataEntrada: string;
  previsaoRetorno: string | null;
  dataConclusao: string | null;
  status: string;
}

interface EquipamentoDisponivel {
  id: string;
  rp: string;
  numSerie: string;
  idRadio: string;
}

const Manutencao: React.FC = () => {
  const [viewMode, setViewMode] = useState<'form' | 'list'>('form');
  const [radiosDisponiveis, setRadiosDisponiveis] = useState<EquipamentoDisponivel[]>([]);
  const [manutencoes, setManutencoes] = useState<ManutencaoRecord[]>([]);

  const [isModalConcluirOpen, setIsModalConcluirOpen] = useState(false);
  const [manutencaoConcluirId, setManutencaoConcluirId] = useState<string | null>(null);

  // Form states
  const [equipamentoId, setEquipamentoId] = useState('');
  const [problema, setProblema] = useState('');
  const [dataEntrada, setDataEntrada] = useState('');
  const [previsaoRetorno, setPrevisaoRetorno] = useState('');
  const [buscaRadioModal, setBuscaRadioModal] = useState('');

  useEffect(() => {
    fetchManutencoes();
  }, []);

  useEffect(() => {
    // Buscar equipamentos quando o formulário for aberto
    if (viewMode === 'form') {
      setBuscaRadioModal('');
      fetchEquipamentosParaManutencao();
    }
  }, [viewMode]);

  const fetchManutencoes = async () => {
    try {
      const res = await axios.get('/api/manutencoes');
      setManutencoes(res.data);
    } catch (error) {
      console.error("Erro ao buscar manutenções", error);
    }
  };

  const fetchEquipamentosParaManutencao = async () => {
    try {
      const res = await axios.get('/api/equipamentos');
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
      await axios.post('/api/manutencoes', {
        equipamentoId: equipamentoId,
        problema,
        dataEntrada: dataEntrada ? new Date(dataEntrada).toISOString() : new Date().toISOString(),
        previsaoRetorno: previsaoRetorno ? new Date(previsaoRetorno).toISOString() : null
      });
      alert("Registro de manutenção incluído!");
      setEquipamentoId('');
      setProblema('');
      setDataEntrada('');
      setPrevisaoRetorno('');
      fetchManutencoes(); // reload list
    } catch (error) {
      console.error("Erro ao registrar manutenção", error);
    }
  };

  const openConcluirModal = (id: string) => {
    setManutencaoConcluirId(id);
    setIsModalConcluirOpen(true);
  };

  const confirmConcluir = async () => {
    if (!manutencaoConcluirId) return;
    try {
      await axios.put(`/api/manutencoes/${manutencaoConcluirId}/concluir`);
      fetchManutencoes();
    } catch (error) {
      console.error("Erro ao concluir", error);
    } finally {
      setIsModalConcluirOpen(false);
      setManutencaoConcluirId(null);
    }
  };

  const getBase64ImageFromUrl = (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject('Erro ao carregar imagem');
      img.src = imageUrl;
    });
  };

  const gerarOrdemServicoPdf = async (m: ManutencaoRecord) => {
    const doc = new jsPDF();
    
    // 1. Brasões
    try {
      const base64Para = await getBase64ImageFromUrl('/brasao_para.png');
      doc.addImage(base64Para, 'PNG', 14, 10, 20, 22);
    } catch (err) { console.error('Sem brasao_para.png'); }
    
    try {
      const base64Pmpa = await getBase64ImageFromUrl('/brasao_pmpa.png');
      doc.addImage(base64Pmpa, 'PNG', 176, 10, 20, 22);
    } catch (err) { console.error('Sem brasao_pmpa.png'); }

    // 2. Título Geral e Timbre
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("GOVERNO DO ESTADO DO PARÁ", 105, 15, { align: "center" });
    doc.text("SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA E DEFESA SOCIAL", 105, 20, { align: "center" });
    doc.text("POLÍCIA MILITAR DO PARÁ", 105, 25, { align: "center" });
    doc.text("DEPARTAMENTO GERAL DE ADMINISTRAÇÃO", 105, 30, { align: "center" });
    doc.text("DIRETORIA DE TELEMÁTICA", 105, 35, { align: "center" });

    // 3. Título do Documento
    doc.setFontSize(14);
    doc.text("ORDEM DE SERVIÇO DE MANUTENÇÃO (OSM)", 105, 50, { align: "center" });
    doc.setFontSize(11);
    doc.text(`Nº ${m.id}/${new Date().getFullYear()} - ATHENAS SYSTEM`, 105, 56, { align: "center" });
    
    // Linha divisória
    doc.setLineWidth(0.5);
    doc.line(14, 62, 196, 62);

    // 4. Seção 1: Dados do Equipamento
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("1. IDENTIFICAÇÃO DO EQUIPAMENTO", 14, 67);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Patrimônio (RP): ${m.equipamento.rp}`, 14, 75);
    doc.text(`Nº de Série: ${m.equipamento.numSerie}`, 105, 75);
    doc.text(`Marca/Modelo: ${m.equipamento.marca || 'N/I'} / ${m.equipamento.modelo || 'N/I'}`, 14, 82);
    doc.text(`ID Lógico (Rádio): ${m.equipamento.idRadio || 'N/I'}`, 105, 82);

    // 5. Seção 2: Diagnóstico Inicial
    doc.setFont("helvetica", "bold");
    doc.text("2. DESCRIÇÃO DO PROBLEMA (RELATO DA UNIDADE)", 14, 95);
    doc.setFont("helvetica", "normal");
    const splitProblema = doc.splitTextToSize(m.problema, 180);
    doc.text(splitProblema, 14, 102);

    // 6. Seção 3: Campo Técnico (Espaço para Preenchimento Manual)
    const yCampoTecnico = 102 + (splitProblema.length * 6) + 10;
    doc.setFont("helvetica", "bold");
    doc.setDrawColor(200, 200, 200);
    doc.rect(14, yCampoTecnico, 182, 50); // Caixa para preenchimento
    doc.text("3. PARECER TÉCNICO / SERVIÇOS EXECUTADOS (USO DITEL)", 14, yCampoTecnico - 2);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("Espaço reservado para o técnico descrever peças trocadas, limpeza ou reparos efetuados.", 16, yCampoTecnico + 5);

    // 7. Datas
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const yDatas = yCampoTecnico + 60;
    doc.text(`Data de Entrada: ${new Date(m.dataEntrada).toLocaleDateString('pt-BR')}`, 14, yDatas);
    doc.text(`Previsão de Retorno: ${m.previsaoRetorno ? new Date(m.previsaoRetorno).toLocaleDateString('pt-BR') : 'N/A'}`, 105, yDatas);

    // 8. Assinaturas
    const finalY = yDatas + 40;
    doc.line(20, finalY, 90, finalY);
    doc.text("REQUISITANTE (UNIDADE)", 55, finalY + 5, { align: "center" });
    
    doc.line(120, finalY, 190, finalY);
    doc.text("RECEBIDO POR (DITEL)", 155, finalY + 5, { align: "center" });

    // Footer
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Rod. Augusto Montenegro, Km 9, n°8401, Bairro Parque Guajará/Dist. de Icoaraci - Belém/PA.", 105, 280, { align: "center" });
    doc.text("CEP: 66821-000. Contato: (91) 3258-9818 / E-mail: citel@pm.pa.gov.br", 105, 285, { align: "center" });

    doc.save(`OSM_${m.equipamento.rp}_${m.id}.pdf`);
  };

  const radiosDisponiveisFiltrados = radiosDisponiveis.filter(radio => {
    if (!buscaRadioModal.trim()) return true;
    const term = buscaRadioModal.toLowerCase();
    return (
      (radio.numSerie && radio.numSerie.toLowerCase().includes(term)) ||
      (radio.rp && radio.rp.toLowerCase().includes(term)) ||
      (radio.idRadio && radio.idRadio.toLowerCase().includes(term))
    );
  });

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
        {viewMode === 'list' ? (
          <button 
            onClick={() => setViewMode('form')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20 whitespace-nowrap"
          >
            <Plus size={18} />
            Nova Manutenção
          </button>
        ) : (
          <button 
            onClick={() => setViewMode('list')}
            className="flex items-center gap-2 bg-gray-100 dark:bg-surface border border-gray-300 dark:border-[#374151] hover:bg-gray-200 dark:hover:bg-[#1f2937] text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
          >
            <List size={18} />
            Consultar Registros
          </button>
        )}
      </div>

      {/* INLINE FORM: REGISTRAR MANUTENÇÃO */}
      {viewMode === 'form' ? (
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col transition-colors">
          <div className="p-6 border-b border-gray-200 dark:border-[#1f2937] flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Registrar Manutenção</h2>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Equipamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Equipamento</label>
              <div className="border border-gray-300 dark:border-[#374151] bg-gray-50 dark:bg-[#111827] rounded-lg overflow-hidden flex flex-col">
                {/* Search bar inside block */}
                <div className="p-2 border-b border-gray-200 dark:border-[#374151] bg-white dark:bg-[#1f2937]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input 
                      type="text"
                      placeholder="Buscar máquina (Série, RP, ID)..."
                      value={buscaRadioModal}
                      onChange={e => setBuscaRadioModal(e.target.value)}
                      className="w-full bg-transparent text-sm text-gray-900 dark:text-white pl-9 pr-3 py-1.5 focus:outline-none placeholder-gray-400"
                    />
                  </div>
                </div>
                {/* List of radio buttons */}
                <div className="max-h-48 overflow-y-auto p-4 space-y-3">
                  {radiosDisponiveisFiltrados.length === 0 ? (
                    <p className="text-sm text-gray-500 italic text-center py-2">Nenhuma máquina encontrada.</p>
                  ) : (
                    radiosDisponiveisFiltrados.map((radio) => (
                      <label key={radio.id} className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center w-4 h-4 rounded-full border border-gray-400 dark:border-gray-500 bg-white dark:bg-surface group-hover:border-primary transition-colors">
                          <input 
                            type="radio" 
                            name="manutencaoRadioSelect"
                            className="peer w-full h-full opacity-0 cursor-pointer absolute" 
                            checked={equipamentoId === String(radio.id)}
                            onChange={() => setEquipamentoId(String(radio.id))}
                          />
                          <div className="hidden peer-checked:block pointer-events-none absolute w-2 h-2 rounded-full bg-primary" />
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300 select-none font-medium text-left">
                          {radio.rp} - {radio.numSerie} {radio.idRadio ? `(${radio.idRadio})` : ''} - [{radio.idRadio || 'Sem ID'}]
                        </span>
                      </label>
                    ))
                  )}
                </div>
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

          <div className="p-6 border-t border-gray-200 dark:border-[#1f2937] flex items-center justify-end gap-3 flex-shrink-0 bg-gray-50 dark:bg-[#0b101a]">
            <button 
              onClick={handleCreateManutencao}
              className="px-8 py-2.5 text-sm font-medium text-white bg-primary hover:bg-blue-600 rounded-lg transition-colors shadow-lg shadow-blue-600/20"
            >
              Registrar Manutenção
            </button>
          </div>
        </div>
      ) : (

      <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col overflow-hidden transition-colors">
        
        <div className="p-5 border-b border-gray-200 dark:border-[#1f2937] flex items-center gap-2">
          <Wrench className="text-gray-400 dark:text-gray-500" size={20} />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Equipamentos em Manutenção</h2>
        </div>
        
        {/* TABELA - Responsiva */}
        <div className="flex-1 overflow-auto overflow-x-auto scrolling-touch z-0">
          <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300 min-w-[900px]">
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
                        <button 
                          onClick={() => gerarOrdemServicoPdf(m)}
                          className="hover:text-gray-900 dark:hover:text-white p-1.5 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-white/5" 
                          title="Emitir Ordem de Serviço"
                        >
                          <FileText size={16} />
                        </button>
                        {m.status === 'EM ANDAMENTO' && (
                          <button 
                            onClick={() => openConcluirModal(m.id)}
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
      )}

      <ModalConfirmacao 
        isOpen={isModalConcluirOpen}
        title="Finalizar Conserto"
        message="A oficina concluiu os reparos? O Rádio voltará automaticamente para o status OPERACIONAL e será liberado para Cautela."
        onConfirm={confirmConcluir}
        onCancel={() => { setIsModalConcluirOpen(false); setManutencaoConcluirId(null); }}
        confirmText="Confirmar Retorno"
      />
    </div>
  );
};

export default Manutencao;
