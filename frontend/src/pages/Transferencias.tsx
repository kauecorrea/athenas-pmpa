import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Edit2, FileText, ChevronDown, Check, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface EquipamentoDisponivel {
  id: string;
  rp: string;
  numSerie: string;
  idRadio?: string;
}

interface TransferenciaRecord {
  id: string;
  militar: { nome: string; rg?: string; contato?: string; posto: string; unidade: { nome: string } | null } | null;
  destino: string;
  dataTransferencia: string;
  qtdRadios: number;
  status: string;
  observacoes?: string;
  equipamentos: EquipamentoDisponivel[];
}

interface Militar {
  id: string;
  nome: string;
  posto: string;
}

const Transferencias: React.FC = () => {
  const [viewMode, setViewMode] = useState<'form' | 'list'>('form');
  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);

  const [transferenciaAlvo, setTransferenciaAlvo] = useState<TransferenciaRecord | null>(null);

  const [buscaTratada, setBuscaTratada] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos - Status');
  const [radiosDisponiveis, setRadiosDisponiveis] = useState<EquipamentoDisponivel[]>([]);
  const [radiosSelecionados, setRadiosSelecionados] = useState<string[]>([]);
  const [buscaRadioModal, setBuscaRadioModal] = useState('');
  
  const [transferencias, setTransferencias] = useState<TransferenciaRecord[]>([]);
  const [militares, setMilitares] = useState<Militar[]>([]);

  // Form states
  const [militarId, setMilitarId] = useState('');
  const [destino, setDestino] = useState('');
  const [dataTransferencia, setDataTransferencia] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    fetchTransferencias();
  }, []);

  useEffect(() => {
    if (viewMode === 'form') {
      fetchEquipamentosCautelados();
      fetchMilitares();
    }
  }, [viewMode]);

  const fetchTransferencias = async () => {
    try {
      const res = await axios.get('/api/transferencias');
      setTransferencias(res.data);
    } catch (error) {
      console.error("Erro ao buscar transferências", error);
    }
  };

  const fetchMilitares = async () => {
    try {
      const res = await axios.get('/api/militares');
      setMilitares(res.data);
    } catch (error) {
      console.error("Erro ao buscar militares", error);
    }
  };

  const fetchEquipamentosCautelados = async () => {
    try {
      const res = await axios.get('/api/equipamentos');
      const cautelados = res.data.filter((eq: any) => eq.status === 'CAUTELADO');
      setRadiosDisponiveis(cautelados);
    } catch (error) {
      console.error("Erro ao buscar equipamentos cautelados", error);
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

  // -----------------------------------------------------------------------------------------------------
  // PDF GENERATOR
  // -----------------------------------------------------------------------------------------------------
  const gerarReciboTransferencia = async (t: TransferenciaRecord) => {
    const doc = new jsPDF();
    
    try {
      const base64Para = await getBase64ImageFromUrl('/brasao_para.png');
      doc.addImage(base64Para, 'PNG', 14, 10, 20, 22);
    } catch (e) { console.error('Sem brasao_para.png'); }
    
    try {
      const base64Pmpa = await getBase64ImageFromUrl('/brasao_pmpa.png');
      doc.addImage(base64Pmpa, 'PNG', 176, 10, 20, 22);
    } catch (e) { console.error('Sem brasao_pmpa.png'); }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("GOVERNO DO ESTADO DO PARÁ", 105, 14, { align: "center" });
    doc.text("SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA E DEFESA SOCIAL", 105, 19, { align: "center" });
    doc.text("POLÍCIA MILITAR DO PARÁ", 105, 24, { align: "center" });
    doc.text("DEPARTAMENTO GERAL DE ADMINISTRAÇÃO", 105, 29, { align: "center" });
    doc.text("DIRETORIA DE TELEMÁTICA", 105, 34, { align: "center" });

    doc.setFontSize(14);
    doc.text(`TERMO DE REPASSE N° ${String(t.id).padStart(5, '0')}`, 105, 50, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const missaoFormatada = t.destino ? `Destino / Missão: ${t.destino}` : 'Destino: Não Informado';
    doc.text(missaoFormatada, 105, 58, { align: "center" });

    const tableData = t.equipamentos?.map((eq, index) => [
      index + 1,
      `${eq.numSerie} / ${eq.rp}`,
      t.militar ? `${t.militar.posto} ${t.militar.nome}` : 'Não Identificado',
      t.militar?.rg || '-',
      t.militar?.contato || '-',
      '' // Assinatura
    ]) || [];

    autoTable(doc, {
      startY: 70,
      head: [['Nº', 'Nº DE SÉRIE / RP', 'RECEPTOR', 'RG', 'CONTATO', 'ASSINATURA']],
      body: tableData,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 4, textColor: [0, 0, 0] },
      headStyles: { fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0] },
      columnStyles: { 5: { cellWidth: 40 } },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          doc.setDrawColor(200, 200, 200);
          doc.line(data.cell.x + 2, data.cell.y + 8, data.cell.x + data.cell.width - 2, data.cell.y + 8);
        }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("ACOMPANHA:", 14, finalY);
    
    doc.setFont("helvetica", "normal");
    doc.text(`- ${t.qtdRadios} RÁDIOS HT`, 20, finalY + 10);
    doc.text("- TODOS OS RÁDIOS ESTÃO COM PRESILHA PARA CINTO, PROTETOR LATERAL, BATERIA E ANTENA.", 20, finalY + 20);

    const dataF = new Date(t.dataTransferencia).toLocaleDateString('pt-BR');
    doc.text(`Belém PA, ${dataF}`, 14, finalY + 70);
    
    doc.setDrawColor(0, 0, 0);
    doc.line(110, finalY + 70, 196, finalY + 70);
    doc.setFontSize(9);
    doc.text("ASSINATURA DO MILITAR RECEPTOR", 153, finalY + 75, { align: "center" });

    doc.save(`Repasse_PMPA_${t.id}.pdf`);
  };

  const toggleRadioSelection = (id: string) => {
    if (radiosSelecionados.includes(id)) {
      setRadiosSelecionados(radiosSelecionados.filter(selectedId => selectedId !== id));
    } else {
      setRadiosSelecionados([...radiosSelecionados, id]);
    }
  };

  const openDeleteModal = (t: TransferenciaRecord) => {
    setTransferenciaAlvo(t);
    setIsModalDeleteOpen(true);
  };

  const openEditModal = (t: TransferenciaRecord) => {
    setTransferenciaAlvo(t);
    setDestino(t.destino);
    setObservacoes(t.observacoes || '');
    setMilitarId(t.militar?.id || '');
    setRadiosSelecionados(t.equipamentos.map(eq => eq.id));
    setDataTransferencia(new Date(t.dataTransferencia).toISOString().slice(0, 16));
    setViewMode('form');
  };

  // -----------------------------------------------------------------------------------------------------
  // CRUD
  // -----------------------------------------------------------------------------------------------------
  const handleCreateTransferencia = async () => {
    if (!militarId || radiosSelecionados.length === 0 || !destino) {
      alert("Preencha o Destino, o Militar responsável e selecione ao menos 1 rádio.");
      return;
    }

    try {
      await axios.post('/api/transferencias', {
        equipamentosIds: radiosSelecionados,
        militarId: militarId,
        destino,
        dataTransferencia: dataTransferencia ? new Date(dataTransferencia).toISOString() : new Date().toISOString(),
        observacoes,
      });

      alert("Transferência criada com sucesso!");
      setRadiosSelecionados([]);
      setMilitarId('');
      setDestino('');
      setDataTransferencia('');
      setObservacoes('');
      fetchTransferencias();
    } catch (error) {
      console.error("Erro ao processar transferência", error);
      alert("Ocorreu um erro. Verifique se o backend está rodando e conectado ao banco.");
    }
  };

  const handleDeleteTransferencia = async () => {
    if (!transferenciaAlvo) return;
    try {
      await axios.delete(`/api/transferencias/${transferenciaAlvo.id}`);
      setIsModalDeleteOpen(false);
      setTransferenciaAlvo(null);
      fetchTransferencias();
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir a transferência.');
    }
  };

  const handleSaveForm = async () => {
    if (transferenciaAlvo) {
      if (!transferenciaAlvo) return;
      try {
        await axios.put(`/api/transferencias/${transferenciaAlvo.id}`, {
          destino,
          observacoes
        });
        setViewMode('list');
        setTransferenciaAlvo(null);
        fetchTransferencias();
      } catch (e) {
        console.error(e);
        alert('Erro ao editar a transferência.');
      }
    } else {
      handleCreateTransferencia();
    }
  };

  // Filtragem local
  const transferenciasFiltradas = transferencias.filter(t => {
    const searchMatch = !buscaTratada || 
      t.destino.toLowerCase().includes(buscaTratada.toLowerCase()) ||
      t.militar?.nome.toLowerCase().includes(buscaTratada.toLowerCase());
    
    const statusMatch = filtroStatus === 'Todos - Status' || t.status.toLowerCase() === filtroStatus.toLowerCase();

    return searchMatch && statusMatch;
  });

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
             Transferência de Carga
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Repasse direto de Cautelas Operacionais (Guarnição p/ Guarnição)</p>
        </div>
        {viewMode === 'list' ? (
          <button 
            onClick={() => {
              setTransferenciaAlvo(null);
              setMilitarId('');
              setDestino('');
              setObservacoes('');
              setRadiosSelecionados([]);
              setBuscaRadioModal('');
              setViewMode('form');
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus size={18} />
            Nova Transferência
          </button>
        ) : (
          <button 
            onClick={() => {
              setTransferenciaAlvo(null);
              setViewMode('list');
            }}
            className="flex items-center gap-2 bg-gray-100 dark:bg-surface border border-gray-300 dark:border-[#374151] hover:bg-gray-200 dark:hover:bg-[#1f2937] text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Edit2 size={18} />
            Consultar Registros
          </button>
        )}
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col overflow-hidden transition-colors">
        
        {/* FILTER BAR */}
        <div className="p-4 border-b border-gray-200 dark:border-[#1f2937] flex items-center justify-between gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[300px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por militar ou destino..." 
              value={buscaTratada}
              onChange={(e) => setBuscaTratada(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer z-50">
              <div className="bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] hover:border-gray-400 dark:hover:border-gray-500 rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between gap-3 min-w-[170px] transition-colors">
                <div className="flex items-center gap-2">
                  {filtroStatus !== 'Todos - Status' && <Check size={14} className="text-primary" />}
                  <span className="truncate">{filtroStatus}</span>
                </div>
                <ChevronDown size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
              </div>
              <div className="absolute top-full mt-1 w-full right-0 bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#374151] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-1">
                <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] flex items-center gap-2 cursor-pointer" onClick={() => setFiltroStatus('Todos - Status')}>
                   Todos - Status
                </div>
                <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer pl-7" onClick={() => setFiltroStatus('Finalizada')}>Finalizada</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* TABLE CONTENT - Responsivo */}
        <div className="flex-1 overflow-auto overflow-x-auto scrolling-touch z-0">
          <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300 min-w-[900px]">
            <thead className="bg-gray-50 dark:bg-[#0b101a] text-gray-500 dark:text-gray-400 font-medium text-xs sticky top-0 z-0">
              <tr>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Militar Substituto</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Unidade Receptora</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Missão / Destino</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Data do Repasse</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Volume (Qtd)</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Status</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1f2937]">
              {transferenciasFiltradas.length === 0 ? (
                <tr>
                   <td colSpan={7} className="px-6 py-10 text-center text-gray-500 bg-transparent">
                     Nenhuma transferência inter-policial registrada.
                   </td>
                </tr>
              ) : (
                transferenciasFiltradas.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2937]/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                      {t.militar ? `${t.militar.posto} ${t.militar.nome}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {t.militar && t.militar.unidade ? t.militar.unidade.nome : '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 truncate max-w-[200px]" title={t.destino}>{t.destino}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {new Date(t.dataTransferencia).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{t.equipamentos?.length || t.qtdRadios} Un.</td>
                    <td className="px-6 py-4">
                      {t.status === 'FINALIZADA' ? (
                        <span className="px-2.5 py-1 text-[11px] font-bold text-success bg-success/10 border border-success/20 rounded-full uppercase tracking-wider">
                          Sucesso
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-[11px] font-bold text-gray-500 bg-gray-500/10 border border-gray-500/20 rounded-full uppercase tracking-wider">
                          {t.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 text-gray-400 dark:text-gray-500">
                        <button onClick={() => gerarReciboTransferencia(t)} className="hover:text-primary dark:hover:text-primary p-1.5 rounded-lg transition-colors hover:bg-primary/10" title="Imprimir Termo de Repasse">
                          <FileText size={16} />
                        </button>
                        <button onClick={() => openEditModal(t)} className="hover:text-blue-500 dark:hover:text-blue-400 p-1.5 rounded-lg transition-colors hover:bg-blue-500/10" title="Editar Transferência">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => openDeleteModal(t)} className="hover:text-red-500 dark:hover:text-red-400 p-1.5 rounded-lg transition-colors hover:bg-red-500/10" title="Excluir Transferência">
                          <Trash2 size={16} />
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
      ) : (
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col overflow-hidden transition-colors shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-[#1f2937] flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {transferenciaAlvo ? 'Editar Transferência' : 'Repasse Tático de Material'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {transferenciaAlvo ? 'Modifique os dados básicos da transferência (destino e observações).' : 'Ao registrar, a cautela original do rádio selecionado é encerrada e transferida para a matrícula do PM selecionado abaixo.'}
            </p>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
              {/* Militar Responsável */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Policial Substituto (Quem vai assumir) *</label>
                <div className="relative">
                  <select 
                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none disabled:opacity-50"
                    value={militarId}
                    onChange={(e) => setMilitarId(e.target.value)}
                    disabled={!!transferenciaAlvo}
                  >
                    <option value="" disabled>Selecione o militar</option>
                    {militares.map(m => (
                      <option key={m.id} value={m.id}>{m.posto} {m.nome}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                </div>
              </div>

              {/* Destino */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Missão ou Prefixo da Viatura *</label>
                <input 
                  type="text" 
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  placeholder="Ex: Viatura 2304 / Operação Paz"
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              {/* Data Saída */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Hora Crítica do Repasse</label>
                <input 
                  type="datetime-local"
                  value={dataTransferencia}
                  onChange={(e) => setDataTransferencia(e.target.value)}
                  disabled={!!transferenciaAlvo}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                />
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Observações Visuais (Avarias)</label>
                <textarea 
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex: Rádio recebido com a ponta da antena mastigada."
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                />
              </div>

              {/* Rádios Cautelados Disponíveis Component */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {transferenciaAlvo ? 'Rádios Repassados' : 'Rádios Atualmente na Rua *'}
                </label>
                <div className="border border-gray-300 dark:border-[#374151] bg-gray-50 dark:bg-[#111827] rounded-lg overflow-hidden flex flex-col max-h-64 shadow-sm">
                  {/* Search bar inside block */}
                  <div className="p-3 border-b border-gray-200 dark:border-[#374151] bg-white dark:bg-[#1f2937]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="text"
                        placeholder="Buscar rádio cautelado..."
                        value={buscaRadioModal}
                        onChange={e => setBuscaRadioModal(e.target.value)}
                        disabled={!!transferenciaAlvo}
                        className="w-full bg-transparent text-sm text-gray-900 dark:text-white pl-10 pr-3 py-1 focus:outline-none placeholder-gray-400 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  {/* List of checkboxes */}
                  <div className="overflow-y-auto p-4 space-y-3">
                    {transferenciaAlvo ? (
                      transferenciaAlvo.equipamentos.map((radio) => (
                        <label key={radio.id} className="flex items-center gap-4 cursor-pointer group p-2 bg-gray-100 dark:bg-[#1f2937] rounded-md transition-colors border border-transparent opacity-70">
                          <span className="text-sm text-gray-700 dark:text-gray-300 select-none font-medium text-left">
                            {radio.rp} - {radio.numSerie} {radio.idRadio ? `(${radio.idRadio})` : ''} 
                          </span>
                        </label>
                      ))
                    ) : radiosDisponiveisFiltrados.length === 0 ? (
                      <p className="text-sm text-gray-500 italic text-center py-4">Nenhum rádio encontrado.</p>
                    ) : (
                      radiosDisponiveisFiltrados.map((radio) => (
                         <label key={radio.id} className="flex items-center gap-4 cursor-pointer group p-2 hover:bg-gray-100 dark:hover:bg-[#1f2937] rounded-md transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                          <div className="relative flex items-center justify-center w-5 h-5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface group-hover:border-primary transition-colors">
                            <input 
                              type="checkbox" 
                              className="peer w-full h-full opacity-0 cursor-pointer absolute" 
                              checked={radiosSelecionados.includes(radio.id)}
                              onChange={() => toggleRadioSelection(radio.id)}
                            />
                            <div className="hidden peer-checked:block pointer-events-none text-white absolute left-[-1px] top-[-1px] bg-primary rounded w-[22px] h-[22px] flex items-center justify-center">
                              <svg className="w-3.5 h-3.5 mx-auto mt-[3px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300 select-none font-medium text-left">
                            {radio.rp} - {radio.numSerie} {radio.idRadio ? `(${radio.idRadio})` : ''} 
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
                {/* Selection Count Label */}
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium ml-1">
                  Selecionados para repasse: <strong className="text-primary">{transferenciaAlvo ? transferenciaAlvo.equipamentos.length : radiosSelecionados.length}</strong>
                </p>
              </div>

            </div>
          </div>

          {/* FOOTER */}
          <div className="p-6 border-t border-gray-200 dark:border-[#1f2937] flex items-center justify-end gap-3 flex-shrink-0 bg-gray-50 dark:bg-[#0b101a]">
            {transferenciaAlvo && (
              <button 
                onClick={() => {
                  setViewMode('list');
                  setTransferenciaAlvo(null);
                }}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-[#1f2937] rounded-lg transition-colors border border-transparent dark:border-[#374151]"
              >
                Cancelar Edição
              </button>
            )}
            <button 
              onClick={handleSaveForm}
              className="px-8 py-2.5 text-sm font-medium text-white bg-primary hover:bg-blue-600 rounded-lg transition-colors shadow-lg shadow-blue-600/20"
            >
              {transferenciaAlvo ? 'Salvar Edições' : 'Transferir Instintivamente'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL EXCLUIR */}
      {isModalDeleteOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111827] border border-gray-800 rounded-xl w-full max-w-lg shadow-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-2">Excluir Transferência</h2>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Tem certeza que deseja excluir esta transferência? Os rádios serão desvinculados da cautela daquele policial e marcados como operacionais livremente no estoque novamente.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsModalDeleteOpen(false)}
                className="px-4 py-2 text-sm font-bold text-white border border-gray-700 hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteTransferencia}
                className="px-4 py-2 text-sm font-bold text-white bg-red-800/90 hover:bg-red-700 rounded-lg transition-colors shadow-lg shadow-red-900/50"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}



    </div>
  );
};

export default Transferencias;
