import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Search, 
  Trash2, 
  ChevronDown, 
  CheckCircle2, 
  List,
  Radio,
  FileText,
  Edit3,
  Download
} from 'lucide-react';
import ModalConfirmacao from '../components/ModalConfirmacao';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Equipamento {
  id: string;
  rp: string;
  numSerie: string;
  marca: string;
  modelo: string;
  status: string;
}

interface Militar {
  id: string;
  nome: string;
  rg: string;
  unidade?: {
    nome: string;
  };
}


interface Cautela {
  id: string;
  dataRetirada: string;
  dataDevolucao: string | null;
  dataPrevista: string | null;
  missao: string | null;
  status: string;
  militar: Militar | null;
  unidade: { nome: string } | null;
  equipamentos: Equipamento[];
}

const Cautelas: React.FC = () => {
  const [cautelas, setCautelas] = useState<Cautela[]>([]);
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [equipamentosDisponiveis, setEquipamentosDisponiveis] = useState<Equipamento[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState<'form' | 'list'>('form');
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');

  // Form state
  const [militarId, setMilitarId] = useState('');
  const [missao, setMissao] = useState('');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().slice(0, 16));
  const [dataPrevista, setDataPrevista] = useState('');
  const [radiosSelecionados, setRadiosSelecionados] = useState<string[]>([]);
  const [editingCautelaId, setEditingCautelaId] = useState<string | null>(null);
  const [buscaRadio, setBuscaRadio] = useState('');
  const [isRadioListOpen, setIsRadioListOpen] = useState(false);

  // Modal actions
  const [isModalDevolverOpen, setIsModalDevolverOpen] = useState(false);
  const [cautelaDevolverId, setCautelaDevolverId] = useState<string | null>(null);
  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [cautelaDeleteId, setCautelaDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cautRes, milRes, eqRes] = await Promise.all([
        axios.get('/api/cautelas'),
        axios.get('/api/militares'),
        axios.get('/api/equipamentos?status=OPERACIONAL')
      ]);
      setCautelas(cautRes.data);
      setMilitares(milRes.data);
      setEquipamentosDisponiveis(eqRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCriarCautela = async () => {
    try {
      if (editingCautelaId) {
        await axios.put(`/api/cautelas/${editingCautelaId}`, {
          militarId,
          equipamentosIds: radiosSelecionados,
          missao,
          dataInicio,
          dataPrevista
        });
        alert("Cautela atualizada!");
      } else {
        await axios.post('/api/cautelas', {
          militarId,
          equipamentosIds: radiosSelecionados,
          missao,
          dataInicio,
          dataPrevista
        });
        alert("Cautela registrada com sucesso!");
      }
      resetForm();
      fetchData();
      setViewMode('list');
    } catch (e) {
      console.error(e);
      alert("Erro ao registrar cautela.");
    }
  };

  const resetForm = () => {
    setMilitarId('');
    setMissao('');
    setDataInicio(new Date().toISOString().slice(0, 16));
    setDataPrevista('');
    setRadiosSelecionados([]);
    setEditingCautelaId(null);
    setBuscaRadio('');
  };

  const confirmDevolver = async () => {
    if (!cautelaDevolverId) return;
    try {
      await axios.put(`/api/cautelas/${cautelaDevolverId}/devolver`);
      setIsModalDevolverOpen(false);
      setCautelaDevolverId(null);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const confirmDelete = async () => {
    if (!cautelaDeleteId) return;
    try {
      await axios.delete(`/api/cautelas/${cautelaDeleteId}`);
      setIsModalDeleteOpen(false);
      setCautelaDeleteId(null);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (c: Cautela) => {
    setEditingCautelaId(c.id);
    setMilitarId(c.militar?.id || '');
    setMissao(c.missao || '');
    if (c.dataRetirada) {
      setDataInicio(new Date(c.dataRetirada).toISOString().slice(0, 16));
    }
    if (c.dataPrevista) {
      setDataPrevista(new Date(c.dataPrevista).toISOString().slice(0, 16));
    }
    setRadiosSelecionados(c.equipamentos.map(eq => eq.id));
    setViewMode('form');
  };

  const gerarComprovantePDF = (c: Cautela) => {
    const doc = new jsPDF();
    const nomeMilitar = c.militar?.nome || 'RESERVADO PARA UNIDADE';
    const unidadeNome = c.militar?.unidade?.nome || c.unidade?.nome || 'DITEL';
    
    // Header
    doc.setFontSize(16);
    doc.text('COMPROVANTE DE CAUTELA - PMPA/DITEL', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Data de Emissão: ${new Date().toLocaleString('pt-BR')}`, 20, 30);
    doc.text(`ID da Cautela: ${c.id}`, 20, 35);

    // Info
    doc.setFontSize(12);
    doc.text('Informações do Responsável:', 20, 45);
    doc.setFontSize(10);
    doc.text(`Nome: ${nomeMilitar}`, 25, 52);
    doc.text(`RG: ${c.militar?.rg || 'N/A'}`, 25, 57);
    doc.text(`Unidade: ${unidadeNome}`, 25, 62);
    doc.text(`Missão: ${c.missao || 'Não informada'}`, 25, 67);

    // Equipamentos
    doc.setFontSize(12);
    doc.text('Equipamentos Cautelados:', 20, 80);
    
    autoTable(doc, {
      startY: 85,
      head: [['Patrimônio (RP)', 'Série', 'Modelo']],
      body: c.equipamentos.map(eq => [eq.rp || 'S/P', eq.numSerie, eq.modelo]),
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102] }
    });

    // Datas
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Data de Retirada: ${new Date(c.dataRetirada).toLocaleString('pt-BR')}`, 20, finalY);
    if (c.dataPrevista) {
      doc.text(`Previsão de Retorno: ${new Date(c.dataPrevista).toLocaleString('pt-BR')}`, 20, finalY + 5);
    }

    // Assinaturas
    const signatureY = finalY + 40;
    doc.line(20, signatureY, 90, signatureY);
    doc.text('Assinatura do Responsável', 35, signatureY + 5);
    
    doc.line(120, signatureY, 190, signatureY);
    doc.text('Assinatura Plantão DITEL', 135, signatureY + 5);

    window.open(doc.output('bloburl'), '_blank');
  };

  const gerarRelatorioGeral = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('RELATÓRIO GERAL DE CAUTELAS - ATHENAS PMPA', 105, 15, { align: 'center' });

    autoTable(doc, {
      startY: 25,
      head: [['Militar', 'Unidade', 'Qtd', 'Retirada', 'Previsão', 'Status']],
      body: cautelasFiltradas.map(c => [
        c.militar?.nome || 'Unidade',
        c.militar?.unidade?.nome || c.unidade?.nome || 'DITEL',
        c.equipamentos.length,
        new Date(c.dataRetirada).toLocaleDateString('pt-BR'),
        c.dataPrevista ? new Date(c.dataPrevista).toLocaleDateString('pt-BR') : '-',
        c.status
      ]),
      theme: 'striped',
      headStyles: { fillColor: [0, 51, 102] },
      styles: { fontSize: 8 }
    });

    window.open(doc.output('bloburl'), '_blank');
  };


  const radiosFiltrados = (equipamentosDisponiveis || []).filter(eq => 
    (eq.rp || '').toLowerCase().includes(buscaRadio.toLowerCase()) ||
    (eq.numSerie || '').toLowerCase().includes(buscaRadio.toLowerCase()) ||
    (eq.modelo || '').toLowerCase().includes(buscaRadio.toLowerCase())
  );

  const cautelasFiltradas = (cautelas || []).filter(c => {
    const matchesBusca = (c.militar?.nome || '').toLowerCase().includes(busca.toLowerCase()) || 
                         (c.militar?.rg || '').includes(busca) ||
                         (c.militar?.unidade?.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
                         (c.unidade?.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
                         (c.missao || '').toLowerCase().includes(busca.toLowerCase());
    const matchesStatus = filtroStatus === 'Todos' || c.status === filtroStatus;
    return matchesBusca && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in text-gray-900 dark:text-white h-full flex flex-col relative transition-colors duration-200">
      
      {/* HEADER DINÂMICO */}
      <div className="flex justify-between items-center bg-white dark:bg-surface p-6 rounded-2xl border border-gray-100 dark:border-[#1f2937] shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Radio className="text-primary" size={32} />
            Cautelas de Equipamentos
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Controle de empréstimo e devolução de rádios HT</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={gerarRelatorioGeral}
            className="flex items-center gap-2 bg-gray-100 dark:bg-surface border border-gray-300 dark:border-[#374151] hover:bg-gray-200 dark:hover:bg-[#1f2937] text-gray-900 dark:text-white px-5 py-3 rounded-xl font-bold transition-all shadow-sm group"
          >
            <Download size={18} className="text-gray-400 group-hover:text-primary" />
            Gerar Relatório
          </button>
          
          {viewMode === 'list' ? (
            <button 
              onClick={() => { resetForm(); setViewMode('form'); }}
              className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={20} />
              Nova Cautela
            </button>
          ) : (
            <button 
              onClick={() => setViewMode('list')}
              className="flex items-center gap-2 bg-gray-100 dark:bg-surface border border-gray-300 dark:border-[#374151] hover:bg-gray-200 dark:hover:bg-[#1f2937] text-gray-900 dark:text-white px-5 py-3 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <List size={20} />
              Consultar Registros
            </button>
          )}
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col overflow-hidden transition-colors">
          <div className="p-4 border-b border-gray-200 dark:border-[#1f2937] flex items-center justify-between gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[300px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por militar ou RG..." 
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <select 
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-primary transition-all appearance-none pr-10 relative"
              >
                <option value="Todos">Todos os Status</option>
                <option value="ATIVA">Ativas</option>
                <option value="DEVOLVIDA">Devolvidas</option>
                <option value="VENCIDA">Vencidas</option>
              </select>
            </div>
          </div>

          <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-[#0b101a] text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider">
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
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center animate-pulse">Carregando histórico...</td></tr>
              ) : cautelasFiltradas.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2937]/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white uppercase truncate max-w-[150px]">
                    {c.militar?.nome || 'Reserva'}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-gray-500 uppercase">
                    {c.militar?.unidade?.nome || c.unidade?.nome || 'DITEL'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-[#374151] px-2.5 py-1 rounded-lg font-bold text-xs">
                      {c.equipamentos.length}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono">
                    {c.dataRetirada ? new Date(c.dataRetirada).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono">
                    {c.dataPrevista ? new Date(c.dataPrevista).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium truncate max-w-[120px] block">
                      {c.missao || ''}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                      c.status === 'ATIVA' ? 'bg-primary/10 text-[#3b82f6] border-[#3b82f6]/20' : 
                      c.status === 'DEVOLVIDA' ? 'bg-success/5 text-success border-success/20' : 
                      'bg-danger/5 text-danger border-danger/20'
                    }`}>
                      {c.status.charAt(0) + c.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3 text-gray-400">
                      <button 
                        onClick={() => gerarComprovantePDF(c)}
                        title="Imprimir Comprovante"
                        className="hover:text-primary transition-colors"
                      >
                        <FileText size={18} />
                      </button>
                      <button 
                        onClick={() => handleEdit(c)}
                        title="Editar Cautela"
                        className="hover:text-primary transition-colors"
                      >
                        <Edit3 size={18} />
                      </button>
                      {c.status !== 'DEVOLVIDA' && (
                        <button 
                          onClick={() => { setCautelaDevolverId(c.id); setIsModalDevolverOpen(true); }}
                          title="Marcar como Devolvida"
                          className="hover:text-success transition-colors"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => { setCautelaDeleteId(c.id); setIsModalDeleteOpen(true); }}
                        title="Excluir Cautela"
                        className="hover:text-danger transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {cautelasFiltradas.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500 italic">
                    Nenhuma cautela encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col overflow-hidden transition-colors shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-[#1f2937] flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {editingCautelaId ? 'Editar Cautela' : 'Nova Cautela'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {editingCautelaId ? 'Atualize as informações do empréstimo.' : 'Selecione o militar e os equipamentos para registrar a cautela.'}
            </p>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1">
            <div className="max-w-4xl space-y-6">
              
              {/* Militar e Missão */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Militar Responsável</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                      value={militarId}
                      onChange={(e) => setMilitarId(e.target.value)}
                    >
                      <option value="" disabled>Selecione um militar</option>
                      {militares.map(m => (
                        <option key={m.id} value={m.id}>{m.rg} - {m.nome}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Missão / Objetivo</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Operação Verão, Policiamento Ordinário..." 
                    value={missao}
                    onChange={(e) => setMissao(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Data de Início</label>
                  <input 
                    type="datetime-local" 
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Previsão de Retorno</label>
                  <input 
                    type="datetime-local" 
                    value={dataPrevista}
                    onChange={(e) => setDataPrevista(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Seleção de Equipamentos (Search & Add) */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rádios para Cautela</label>
                
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Pesquisar por RP ou Série..." 
                      value={buscaRadio}
                      onChange={(e) => { setBuscaRadio(e.target.value); setIsRadioListOpen(true); }}
                      onFocus={() => setIsRadioListOpen(true)}
                      className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>

                  {isRadioListOpen && buscaRadio.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-surface border border-gray-200 dark:border-[#374151] rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                      {radiosFiltrados.length > 0 ? radiosFiltrados.map(eq => (
                        <div 
                          key={eq.id}
                          onClick={() => {
                            if (!radiosSelecionados.includes(eq.id)) {
                              setRadiosSelecionados([...radiosSelecionados, eq.id]);
                            }
                            setBuscaRadio('');
                            setIsRadioListOpen(false);
                          }}
                          className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer border-b border-gray-100 dark:border-[#1f2937] last:border-0"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-bold text-sm text-primary">{eq.rp || 'S/P'}</span>
                              <span className="ml-2 text-xs text-gray-500">{eq.modelo} - SN: {eq.numSerie}</span>
                            </div>
                            <Plus size={14} className="text-gray-400" />
                          </div>
                        </div>
                      )) : (
                        <div className="p-4 text-center text-sm text-gray-500 italic">Nenhum rádio disponível encontrado.</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Lista de Selecionados */}
                {radiosSelecionados.length > 0 && (
                  <div className="bg-gray-50 dark:bg-black/20 rounded-xl p-4 border border-dashed border-gray-200 dark:border-[#374151]">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3">Rádios Selecionados ({radiosSelecionados.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {radiosSelecionados.map(id => {
                        const eq = equipamentosDisponiveis.find(e => e.id === id);
                        return (
                          <div key={id} className="flex items-center gap-2 bg-white dark:bg-surface px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#1f2937] shadow-sm group">
                            <span className="text-xs font-bold text-primary">{eq?.rp || eq?.numSerie}</span>
                            <button 
                              onClick={() => setRadiosSelecionados(prev => prev.filter(i => i !== id))}
                              className="text-gray-400 hover:text-danger p-0.5 rounded-full hover:bg-danger/10 transition-colors"
                            >
                              <Plus size={14} className="rotate-45" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* FOOTER */}
          <div className="p-6 border-t border-gray-200 dark:border-[#1f2937] flex items-center justify-end gap-3 flex-shrink-0 bg-gray-50 dark:bg-[#0b101a]">
            {editingCautelaId && (
              <button 
                onClick={() => setViewMode('list')}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-[#1f2937] rounded-lg transition-colors border border-transparent dark:border-[#374151]"
              >
                Cancelar Edição
              </button>
            )}
            <button 
              onClick={handleCriarCautela}
              disabled={radiosSelecionados.length === 0 || !militarId}
              className="px-8 py-2.5 text-sm font-medium text-white bg-primary hover:bg-blue-600 rounded-lg transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingCautelaId ? 'Salvar Edições' : 'Criar Cautela'}
            </button>
          </div>
        </div>
      )}

      <ModalConfirmacao 
        isOpen={isModalDevolverOpen}
        title="Registrar Devolução"
        message="Confirma o recebimento desta cautela? Todos os aparelhos vinculados a ela voltarão ao status OPERACIONAL livre na Reserva."
        onConfirm={confirmDevolver}
        onCancel={() => { setIsModalDevolverOpen(false); setCautelaDevolverId(null); }}
        confirmText="Confirmar Devolução"
      />

      <ModalConfirmacao 
        isOpen={isModalDeleteOpen}
        title="Exclusão de Histórico (Cautela)"
        message="CUIDADO: Você está deletando o B.O inteiro da cautela e seu rastro na base de estatísticas do patrimônio. Esta ação é estritamente em caso de erro na hora de formular a Cautela. Confirma exclusão?"
        onConfirm={confirmDelete}
        onCancel={() => { setIsModalDeleteOpen(false); setCautelaDeleteId(null); }}
      />
    </div>
  );
};

export default Cautelas;
