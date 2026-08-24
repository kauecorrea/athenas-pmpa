import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Plus, Wrench, FileText, CheckCircle, Search, List, Edit3, Trash2, Check } from 'lucide-react';
import ModalConfirmacao from '../components/ModalConfirmacao';
import jsPDF from 'jspdf';

interface ManutencaoRecord {
  id: string;
  equipamentoId: string;
  equipamento: { 
    id: string;
    rp: string; 
    numSerie: string; 
    idRadio: string;
    marca: string | null;
    modelo: string | null;
  };
  problema: string;
  dataEntrada: string;
  dataChegadaDitel: string | null;
  dataSaidaEmpresa: string | null;
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
  const [viewMode, setViewMode] = useState<'form' | 'list'>('list');
  const [radiosDisponiveis, setRadiosDisponiveis] = useState<EquipamentoDisponivel[]>([]);
  const [manutencoes, setManutencoes] = useState<ManutencaoRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalConcluirOpen, setIsModalConcluirOpen] = useState(false);
  const [manutencaoConcluirId, setManutencaoConcluirId] = useState<string | null>(null);

  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [equipamentosSelecionados, setEquipamentosSelecionados] = useState<string[]>([]);
  const [problema, setProblema] = useState('');
  const [dataEntrada, setDataEntrada] = useState(new Date().toISOString().split('T')[0]);
  const [dataChegadaDitel, setDataChegadaDitel] = useState('');
  const [dataSaidaEmpresa, setDataSaidaEmpresa] = useState('');
  const [previsaoRetorno, setPrevisaoRetorno] = useState('');
  const [buscaRadioModal, setBuscaRadioModal] = useState('');

  useEffect(() => {
    fetchManutencoes();
  }, []);

  useEffect(() => {
    if (viewMode === 'form' && !editingId) {
      setBuscaRadioModal('');
      fetchEquipamentosParaManutencao();
    }
  }, [viewMode, editingId]);

  const fetchManutencoes = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/manutencoes');
      setManutencoes(res.data);
    } catch (error) {
      console.error("Erro ao buscar manutenções", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipamentosParaManutencao = async () => {
    try {
      const res = await axios.get('/api/equipamentos');
      const disponiveis = res.data.filter((eq: any) => eq.status !== 'MANUTENCAO' && eq.status !== 'EXTRAVIADO');
      setRadiosDisponiveis(disponiveis);
    } catch (error) {
      console.error("Erro ao buscar equipamentos para manutenção", error);
    }
  };

  const handleCreateManutencao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (equipamentosSelecionados.length === 0 || !problema) {
      alert("Selecione pelo menos um equipamento e descreva o problema.");
      return;
    }

    try {
      if (editingId) {
        await axios.put(`/api/manutencoes/${editingId}`, {
          problema,
          dataEntrada: dataEntrada ? new Date(dataEntrada).toISOString() : undefined,
          dataChegadaDitel: dataChegadaDitel ? new Date(dataChegadaDitel).toISOString() : null,
          dataSaidaEmpresa: dataSaidaEmpresa ? new Date(dataSaidaEmpresa).toISOString() : null,
          previsaoRetorno: previsaoRetorno ? new Date(previsaoRetorno).toISOString() : null
        });
        alert("Registro de manutenção atualizado!");
      } else {
        await axios.post('/api/manutencoes', {
          equipamentoIds: equipamentosSelecionados,
          problema,
          dataEntrada: dataEntrada ? new Date(dataEntrada).toISOString() : new Date().toISOString(),
          dataChegadaDitel: dataChegadaDitel ? new Date(dataChegadaDitel).toISOString() : null,
          dataSaidaEmpresa: dataSaidaEmpresa ? new Date(dataSaidaEmpresa).toISOString() : null,
          previsaoRetorno: previsaoRetorno ? new Date(previsaoRetorno).toISOString() : null
        });
        alert("Registro de manutenção incluído!");
      }
      resetForm();
      fetchManutencoes();
      setViewMode('list');
    } catch (error) {
      console.error("Erro ao salvar manutenção", error);
    }
  };

  const resetForm = () => {
    setEquipamentosSelecionados([]);
    setProblema('');
    setDataEntrada(new Date().toISOString().split('T')[0]);
    setDataChegadaDitel('');
    setDataSaidaEmpresa('');
    setPrevisaoRetorno('');
    setEditingId(null);
  };

  const handleEdit = (m: ManutencaoRecord) => {
    setEditingId(m.id);
    setEquipamentosSelecionados([m.equipamentoId]);
    setProblema(m.problema);
    setDataEntrada(m.dataEntrada.split('T')[0]);
    setDataChegadaDitel(m.dataChegadaDitel ? m.dataChegadaDitel.split('T')[0] : '');
    setDataSaidaEmpresa(m.dataSaidaEmpresa ? m.dataSaidaEmpresa.split('T')[0] : '');
    setPrevisaoRetorno(m.previsaoRetorno ? m.previsaoRetorno.split('T')[0] : '');
    setViewMode('form');
  };

  const confirmDelete = async () => {
    if (!idToDelete) return;
    try {
      await axios.delete(`/api/manutencoes/${idToDelete}`);
      fetchManutencoes();
    } catch (error) {
      console.error("Erro ao excluir", error);
    } finally {
      setIsModalDeleteOpen(false);
      setIdToDelete(null);
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
    
    try {
      const base64Para = await getBase64ImageFromUrl('/brasao_para.png');
      doc.addImage(base64Para, 'PNG', 14, 10, 20, 22);
    } catch (err) { console.error('Sem brasao_para.png'); }
    
    try {
      const base64Pmpa = await getBase64ImageFromUrl('/brasao_pmpa.png');
      doc.addImage(base64Pmpa, 'PNG', 176, 10, 20, 22);
    } catch (err) { console.error('Sem brasao_pmpa.png'); }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("GOVERNO DO ESTADO DO PARÁ", 105, 15, { align: "center" });
    doc.text("SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA E DEFESA SOCIAL", 105, 20, { align: "center" });
    doc.text("POLÍCIA MILITAR DO PARÁ", 105, 25, { align: "center" });
    doc.text("DEPARTAMENTO GERAL DE ADMINISTRAÇÃO", 105, 30, { align: "center" });
    doc.text("DIRETORIA DE TELEMÁTICA", 105, 35, { align: "center" });

    doc.setFontSize(14);
    doc.text("ORDEM DE SERVIÇO DE MANUTENÇÃO (OSM)", 105, 50, { align: "center" });
    doc.setFontSize(11);
    doc.text(`Nº ${m.id.substring(0,8).toUpperCase()}/${new Date(m.dataEntrada).getFullYear()}`, 105, 56, { align: "center" });
    
    doc.setLineWidth(0.5);
    doc.line(14, 62, 196, 62);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("1. IDENTIFICAÇÃO DO EQUIPAMENTO", 14, 67);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Patrimônio (RP): ${m.equipamento.rp || 'S/RP'}`, 14, 75);
    doc.text(`Nº de Série: ${m.equipamento.numSerie}`, 105, 75);
    doc.text(`Marca/Modelo: ${m.equipamento.marca || 'N/I'} / ${m.equipamento.modelo || 'N/I'}`, 14, 82);
    doc.text(`ID Lógico (Rádio): ${m.equipamento.idRadio || 'N/I'}`, 105, 82);

    doc.setFont("helvetica", "bold");
    doc.text("2. DESCRIÇÃO DO PROBLEMA (RELATO DA UNIDADE)", 14, 95);
    doc.setFont("helvetica", "normal");
    const splitProblema = doc.splitTextToSize(m.problema, 180);
    doc.text(splitProblema, 14, 102);

    const yCampoTecnico = 102 + (splitProblema.length * 6) + 10;
    doc.setFont("helvetica", "bold");
    doc.setDrawColor(200, 200, 200);
    doc.rect(14, yCampoTecnico, 182, 50);
    doc.text("3. PARECER TÉCNICO / SERVIÇOS EXECUTADOS (USO DITEL)", 14, yCampoTecnico - 2);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("Espaço reservado para o técnico descrever peças trocadas, limpeza ou reparos efetuados.", 16, yCampoTecnico + 5);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const yDatas = yCampoTecnico + 60;
    doc.text(`Data de Entrada: ${new Date(m.dataEntrada).toLocaleDateString('pt-BR')}`, 14, yDatas);
    doc.text(`Chegada ao DITEL: ${m.dataChegadaDitel ? new Date(m.dataChegadaDitel).toLocaleDateString('pt-BR') : 'N/A'}`, 105, yDatas);
    
    doc.text(`Saída para Empresa: ${m.dataSaidaEmpresa ? new Date(m.dataSaidaEmpresa).toLocaleDateString('pt-BR') : 'N/A'}`, 14, yDatas + 6);
    doc.text(`Previsão de Retorno: ${m.previsaoRetorno ? new Date(m.previsaoRetorno).toLocaleDateString('pt-BR') : 'N/A'}`, 105, yDatas + 6);

    const finalY = yDatas + 40;
    doc.line(20, finalY, 90, finalY);
    doc.text("REQUISITANTE (UNIDADE)", 55, finalY + 5, { align: "center" });
    
    doc.line(120, finalY, 190, finalY);
    doc.text("RECEBIDO POR (DITEL)", 155, finalY + 5, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const pageHeight = doc.internal.pageSize.height;
    doc.text("Rod. Augusto Montenegro, Km 9, n° 3401, Bairro Parque Guajará/Dist. de Icoaraci - Belém/PA.", 105, pageHeight - 15, { align: "center" });
    doc.text("CEP: 66821-000. Contato: (91) 3255-9018 l E-mail: dtel@pm.pa.gov.br", 105, pageHeight - 10, { align: "center" });

    window.open(doc.output('bloburl'), '_blank');
  };

  const radiosDisponiveisFiltrados = useMemo(() => {
    return radiosDisponiveis.filter(radio => {
      if (!buscaRadioModal.trim()) return true;
      const term = buscaRadioModal.toLowerCase();
      return (
        (radio.numSerie && radio.numSerie.toLowerCase().includes(term)) ||
        (radio.rp && radio.rp.toLowerCase().includes(term)) ||
        (radio.idRadio && radio.idRadio.toLowerCase().includes(term))
      );
    });
  }, [radiosDisponiveis, buscaRadioModal]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in text-gray-900 dark:text-white h-full flex flex-col transition-colors duration-200">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-surface p-6 rounded-2xl border border-gray-100 dark:border-[#1f2937] shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
             <Wrench className="text-primary" size={32} />
             Manutenção
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gerenciamento de consertos ou reparos preventivos</p>
        </div>
        {viewMode === 'list' ? (
          <button 
            onClick={() => { resetForm(); setViewMode('form'); }}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={20} />
            Nova Manutenção
          </button>
        ) : (
          <button 
            onClick={() => setViewMode('list')}
            className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-surface border border-gray-300 dark:border-[#374151] hover:bg-gray-200 dark:hover:bg-[#1f2937] text-gray-900 dark:text-white px-5 py-3 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <List size={20} />
            Consultar Registros
          </button>
        )}
      </div>

      {viewMode === 'form' ? (
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col transition-colors shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-[#1f2937]">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Plus className="text-primary" size={24} />
              {editingId ? 'Editar Registro de Manutenção' : 'Registrar Entrada na Oficina'}
            </h2>
          </div>
          
          <form onSubmit={handleCreateManutencao} className="p-8 overflow-y-auto flex-1 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">1. Selecionar Equipamento</label>
                <div className={`border border-gray-300 dark:border-[#374151] bg-gray-50 dark:bg-[#0b101a] rounded-xl overflow-hidden flex flex-col ${editingId ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="p-3 border-b border-gray-200 dark:border-[#374151] bg-white dark:bg-[#1f2937]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="text"
                        placeholder="Buscar por Série, RP, ID..."
                        value={buscaRadioModal}
                        onChange={e => setBuscaRadioModal(e.target.value)}
                        className="w-full bg-transparent text-sm text-gray-900 dark:text-white pl-9 pr-3 py-2 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                    {radiosDisponiveisFiltrados.length === 0 ? (
                      <p className="text-xs text-gray-500 italic text-center py-4">Nenhum rádio disponível encontrado.</p>
                    ) : (
                      radiosDisponiveisFiltrados.map((radio) => (
                        <div 
                          key={radio.id} 
                          onClick={() => {
                            if (editingId) return;
                            setEquipamentosSelecionados(prev => 
                              prev.includes(radio.id) ? prev.filter(e => e !== radio.id) : [...prev, radio.id]
                            );
                          }}
                          className={`px-4 py-3 rounded-lg text-sm cursor-pointer transition-all border flex items-center justify-between ${equipamentosSelecionados.includes(radio.id) ? 'bg-primary/10 border-primary font-bold text-primary shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent'}`}
                        >
                          <div className="flex flex-col">
                            <span>{radio.idRadio ? `Nº ${radio.idRadio}` : `SN: ${radio.numSerie}`}</span>
                            <span className="text-[10px] opacity-60 font-normal">RP: {radio.rp || 'S/RP'}</span>
                          </div>
                          {equipamentosSelecionados.includes(radio.id) && (
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Check size={12} className="text-white font-bold" />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">2. Data de Entrada</label>
                  <input 
                    type="date"
                    required
                    value={dataEntrada}
                    onChange={(e) => setDataEntrada(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">3. Chegada ao DITEL</label>
                    <input 
                      type="date" 
                      value={dataChegadaDitel}
                      onChange={(e) => setDataChegadaDitel(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">4. Saída para Empresa</label>
                    <input 
                      type="date" 
                      value={dataSaidaEmpresa}
                      onChange={(e) => setDataSaidaEmpresa(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">5. Previsão de Retorno</label>
                    <input 
                      type="date" 
                      value={previsaoRetorno}
                      onChange={(e) => setPrevisaoRetorno(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">6. Descrição do Problema / Defeito</label>
                <textarea 
                  required
                  rows={4}
                  value={problema}
                  onChange={(e) => setProblema(e.target.value)}
                  placeholder="Descreva detalhadamente o defeito relatado..."
                  className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#374151] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-10 border-t border-gray-100 dark:border-[#1f2937]">
              {editingId && (
                <button 
                  type="button"
                  onClick={() => resetForm()}
                  className="px-6 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                >
                  Cancelar Edição
                </button>
              )}
              <button 
                type="submit"
                className="px-10 py-3 text-base font-bold text-white bg-primary hover:bg-blue-600 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2"
              >
                {editingId ? <Edit3 size={20} /> : <Plus size={20} />}
                {editingId ? 'Salvar Edição' : 'Registrar Entrada'}
              </button>
            </div>
          </form>
        </div>
      ) : (

      <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col overflow-hidden transition-colors shadow-sm">
        <div className="p-5 border-b border-gray-200 dark:border-[#1f2937] flex items-center gap-2">
          <List className="text-primary" size={20} />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Equipamentos em Manutenção</h2>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300 min-w-full">
            <thead className="bg-gray-50 dark:bg-[#0b101a] text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">RP / Série</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">ID Rádio</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Problema</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Datas</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Status</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1f2937]">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">Carregando registros...</td></tr>
              ) : manutencoes.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-500 italic">Nenhum registro encontrado.</td></tr>
              ) : (
                manutencoes.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2937]/30 transition-colors group">
                    <td className="px-6 py-4">
                       <p className="font-bold text-gray-900 dark:text-white">{m.equipamento?.rp || 'S/RP'}</p>
                       <p className="text-[10px] text-gray-400 font-mono uppercase">{m.equipamento?.numSerie}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-primary">{m.equipamento?.idRadio || '-'}</td>
                    <td className="px-6 py-4 max-w-[250px]">
                       <p className="text-xs italic text-gray-600 dark:text-gray-400 truncate" title={m.problema}>{m.problema}</p>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <p className="font-medium text-gray-500">Entrada: {new Date(m.dataEntrada).toLocaleDateString('pt-BR')}</p>
                      {m.previsaoRetorno && <p className="text-[10px] text-blue-400">Previsão: {new Date(m.previsaoRetorno).toLocaleDateString('pt-BR')}</p>}
                    </td>
                    <td className="px-6 py-4">
                      {m.status === 'EM ANDAMENTO' ? (
                        <span className="px-3 py-1 text-[10px] font-bold text-orange-600 bg-orange-100 rounded-full flex items-center gap-1 w-fit">
                          <Wrench size={10} /> NA OFICINA
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-[10px] font-bold text-green-600 bg-green-100 rounded-full flex items-center gap-1 w-fit">
                          <CheckCircle size={10} /> CONCLUÍDA
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => gerarOrdemServicoPdf(m)}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all" 
                          title="Gerar Ordem de Serviço"
                        >
                          <FileText size={18} />
                        </button>
                        <button 
                          onClick={() => handleEdit(m)}
                          className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => { setIdToDelete(m.id); setIsModalDeleteOpen(true); }}
                          className="p-2 text-gray-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-all"
                          title="Excluir Registro"
                        >
                          <Trash2 size={18} />
                        </button>
                        {m.status === 'EM ANDAMENTO' && (
                          <button 
                            onClick={() => openConcluirModal(m.id)}
                            className="p-2 text-success hover:bg-success/10 rounded-lg transition-all"
                            title="Concluir Manutenção"
                          >
                            <CheckCircle size={18} />
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
        message="Confirma a conclusão do reparo técnico? O rádio retornará para o status OPERACIONAL."
        onConfirm={confirmConcluir}
        onCancel={() => { setIsModalConcluirOpen(false); setManutencaoConcluirId(null); }}
        confirmText="Confirmar Conclusão"
      />

      <ModalConfirmacao 
        isOpen={isModalDeleteOpen}
        title="Excluir Registro"
        message="Tem certeza que deseja remover este registro de manutenção? Se o rádio ainda estiver na oficina, seu status será resetado para OPERACIONAL."
        onConfirm={confirmDelete}
        onCancel={() => { setIsModalDeleteOpen(false); setIdToDelete(null); }}
        confirmText="Sim, Excluir"
      />
    </div>
  );
};

export default Manutencao;
