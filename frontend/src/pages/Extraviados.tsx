import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Search, 
  Trash2, 
  ShieldOff, 
  List,
  User,
  Radio,
  Edit3,
  CheckCircle,
  Archive,
  FileText
} from 'lucide-react';
import ModalConfirmacao from '../components/ModalConfirmacao';
import jsPDF from 'jspdf';

interface Equipamento {
  id: string;
  rp: string;
  numSerie: string;
  idRadio: string;
  marca: string;
  modelo: string;
}

interface Militar {
  id: string;
  nome: string;
  rg: string;
}

interface Unidade {
  id: string;
  nome: string;
}

interface Extraviado {
  id: string;
  dataExtravio: string;
  boNumero: string;
  descricao: string;
  status: string;
  militar?: Militar;
  militarResponsavelNome?: string;
  militarResponsavelGuerra?: string;
  militarResponsavelRg?: string;
  militarResponsavelPatente?: string;
  militarResponsavelContato?: string;
  unidade?: Unidade;
  equipamento: Equipamento;
}

const Extraviados: React.FC = () => {
  const [extraviados, setExtraviados] = useState<Extraviado[]>([]);
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState<'form' | 'list'>('form');
  const [busca, setBusca] = useState('');
  const [buscaMilitar, setBuscaMilitar] = useState('');
  const [buscaUnidade, setBuscaUnidade] = useState('');
  const [buscaEquipamento, setBuscaEquipamento] = useState('');

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    equipamentoId: '',
    boNumero: '',
    descricao: '',
    dataRegistro: new Date().toISOString().split('T')[0],
    militarResponsavelNome: '',
    militarResponsavelGuerra: '',
    militarResponsavelRg: '',
    militarResponsavelPatente: '',
    militarResponsavelContato: '',
    unidadeId: ''
  });

  // Modal actions
  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  
  const [isModalRecuperarOpen, setIsModalRecuperarOpen] = useState(false);
  const [idToRecuperar, setIdToRecuperar] = useState<string | null>(null);

  const [isModalBaixarOpen, setIsModalBaixarOpen] = useState(false);
  const [idToBaixar, setIdToBaixar] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const fetchExt = axios.get('/api/extravios').catch(err => { console.error("Erro ao buscar extravios", err); return { data: [] }; });
      const fetchMil = axios.get('/api/militares').catch(err => { console.error("Erro ao buscar militares", err); return { data: [] }; });
      const fetchEq = axios.get('/api/equipamentos').catch(err => { console.error("Erro ao buscar equipamentos", err); return { data: [] }; });
      const fetchUni = axios.get('/api/unidades').catch(err => { console.error("Erro ao buscar unidades", err); return { data: [] }; });

      const [extRes, milRes, eqRes, uniRes] = await Promise.all([fetchExt, fetchMil, fetchEq, fetchUni]);
      
      if (extRes.data) setExtraviados(extRes.data);
      if (milRes.data) setMilitares(milRes.data);
      if (eqRes.data) setEquipamentos(eqRes.data);
      if (uniRes.data) setUnidades(uniRes.data);
    } catch (e) {
      console.error("Erro crítico no fetchData", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.equipamentoId || !formData.militarResponsavelNome || !formData.militarResponsavelPatente || !formData.unidadeId) {
      alert("Por favor, preencha todos os campos obrigatórios do militar, da unidade e selecione o equipamento.");
      return;
    }
    try {
      if (editingId) {
        // Logica de edição se necessário futuramente
        alert("Função de edição em implementação.");
      } else {
        await axios.post('/api/extravios', formData);
        alert("Registro de extravio criado com sucesso!");
      }
      resetForm();
      fetchData();
      setViewMode('list');
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.error || e.message || "Erro desconhecido";
      alert(`Falha ao registrar extravio: ${msg}`);
    }
  };

  const resetForm = () => {
    setFormData({
      equipamentoId: '',
      boNumero: '',
      descricao: '',
      dataRegistro: new Date().toISOString().split('T')[0],
      militarResponsavelNome: '',
      militarResponsavelGuerra: '',
      militarResponsavelRg: '',
      militarResponsavelPatente: '',
      militarResponsavelContato: '',
      unidadeId: ''
    });
    setEditingId(null);
    setBuscaUnidade('');
    setBuscaEquipamento('');
  };

  const confirmDelete = async () => {
    if (!idToDelete) return;
    try {
      await axios.delete(`/api/extravios/${idToDelete}`);
      setIsModalDeleteOpen(false);
      setIdToDelete(null);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRecuperar = async () => {
    if (!idToRecuperar) return;
    try {
      await axios.put(`/api/extravios/${idToRecuperar}/encontrado`);
      setIsModalRecuperarOpen(false);
      setIdToRecuperar(null);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleBaixar = async () => {
    if (!idToBaixar) return;
    try {
      await axios.put(`/api/extravios/${idToBaixar}/baixar`);
      setIsModalBaixarOpen(false);
      setIdToBaixar(null);
      fetchData();
    } catch (e) {
      console.error(e);
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

  const gerarTermoPdf = async (ex: Extraviado) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    
    try {
      const base64Para = await getBase64ImageFromUrl('/brasao_para.png');
      doc.addImage(base64Para, 'PNG', 14, 10, 20, 22);
      const base64Pmpa = await getBase64ImageFromUrl('/brasao_pmpa.png');
      doc.addImage(base64Pmpa, 'PNG', 176, 10, 20, 22);
    } catch(e) {}

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("GOVERNO DO ESTADO DO PARÁ", 105, 15, { align: "center" });
    doc.text("SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA E DEFESA SOCIAL", 105, 20, { align: "center" });
    doc.text("POLÍCIA MILITAR DO PARÁ", 105, 25, { align: "center" });
    doc.text("DIRETORIA DE TELEMÁTICA", 105, 30, { align: "center" });

    doc.setFontSize(14);
    doc.text("TERMO DE REGISTRO DE EXTRAVIO / PERDA", 105, 50, { align: "center" });
    doc.setFontSize(11);
    doc.text(`Protocolo: ${ex.id.substring(0,8).toUpperCase()} | B.O: ${ex.boNumero}`, 105, 57, { align: "center" });

    doc.line(14, 65, 196, 65);

    doc.setFont("helvetica", "bold");
    doc.text("1. DADOS DO MILITAR RESPONSÁVEL", 14, 75);
    doc.setFont("helvetica", "normal");
    const nomePolicial = ex.militarResponsavelNome || ex.militar?.nome || 'N/I';
    const patente = ex.militarResponsavelPatente ? `${ex.militarResponsavelPatente} ` : '';
    doc.text(`Nome: ${patente}${nomePolicial}`, 14, 82);
    doc.text(`RG: ${ex.militarResponsavelRg || ex.militar?.rg || 'N/I'}`, 120, 82);
    doc.text(`Nome de Guerra: ${ex.militarResponsavelGuerra || 'N/I'}`, 14, 89);
    doc.text(`Contato: ${ex.militarResponsavelContato || 'N/I'}`, 120, 89);
    doc.text(`Unidade: ${ex.unidade?.nome || 'N/I'}`, 14, 96);
    
    // Adjusted Y coords for section 2 due to added fields
    doc.setFont("helvetica", "bold");
    doc.text("2. IDENTIFICAÇÃO DO EQUIPAMENTO", 14, 110);
    doc.setFont("helvetica", "normal");
    doc.text(`Material: Rádio Transceptor`, 14, 117);
    doc.text(`Marca/Modelo: ${ex.equipamento?.marca} ${ex.equipamento?.modelo}`, 100, 117);
    doc.text(`ID Rádio: ${ex.equipamento?.idRadio || 'N/I'}`, 14, 124);
    doc.text(`Nº de Série: ${ex.equipamento?.numSerie}`, 100, 124);
    doc.text(`Patrimônio (RP): ${ex.equipamento?.rp || 'S/RP'}`, 14, 131);

    doc.setFont("helvetica", "bold");
    doc.text("3. DESCRIÇÃO DO FATO", 14, 145);
    doc.setFont("helvetica", "normal");
    const descLines = doc.splitTextToSize(ex.descricao, 180);
    doc.text(descLines, 14, 152);

    doc.text(`Data do Registro: ${new Date(ex.dataExtravio).toLocaleDateString('pt-BR')}`, 14, 195);
    doc.text(`Status Atual: ${ex.status}`, 14, 202);

    const signY = 230;
    doc.line(30, signY, 85, signY);
    doc.text("Assinatura do Militar", 57, signY + 5, { align: "center" });
    doc.line(125, signY, 180, signY);
    doc.text("Responsável DITEL", 152, signY + 5, { align: "center" });

    doc.setFontSize(8);
    doc.text("Rod. Augusto Montenegro, Km 9, n° 3401, Bairro Parque Guajará/Dist. de Icoaraci - Belém/PA.", 105, pageHeight - 15, { align: "center" });
    doc.text("CEP: 66821-000. Contato: (91) 3255-9018 l E-mail: dtel@pm.pa.gov.br", 105, pageHeight - 10, { align: "center" });

    window.open(doc.output('bloburl'), '_blank');
  };

  const militaresFiltrados = useMemo(() => {
    return militares.filter(m => 
      m.nome.toLowerCase().includes(buscaMilitar.toLowerCase()) || 
      m.rg.toLowerCase().includes(buscaMilitar.toLowerCase())
    );
  }, [militares, buscaMilitar]);

  const equipamentosFiltrados = useMemo(() => {
    return equipamentos.filter(eq => {
      const term = buscaEquipamento.toLowerCase();
      return (
        (eq.idRadio && eq.idRadio.toLowerCase().includes(term)) ||
        (eq.numSerie && eq.numSerie.toLowerCase().includes(term)) ||
        (eq.rp && eq.rp.toLowerCase().includes(term))
      );
    });
  }, [equipamentos, buscaEquipamento]);

  const extraviadosFiltrados = useMemo(() => {
    return extraviados.filter(ex => {
      const term = busca.toLowerCase();
      const nomePolicial = ex.militarResponsavelNome || ex.militar?.nome || '';
      return nomePolicial.toLowerCase().includes(term) || 
             ex.equipamento?.rp?.toLowerCase().includes(term) ||
             ex.equipamento?.numSerie?.toLowerCase().includes(term) ||
             ex.boNumero?.toLowerCase().includes(term);
    });
  }, [extraviados, busca]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in text-gray-900 dark:text-white h-full flex flex-col relative transition-colors duration-200">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-surface p-6 rounded-2xl border border-gray-100 dark:border-[#1f2937] shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <ShieldOff className="text-danger" size={32} />
            Equipamentos Extraviados
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Controle e rastreio de bens não localizados ou com B.O de extravio</p>
        </div>
        {viewMode === 'list' ? (
          <button 
            onClick={() => { resetForm(); setViewMode('form'); }}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={20} />
            Registrar Extravio
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

      {viewMode === 'list' ? (
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col overflow-hidden transition-colors shadow-sm">
          <div className="p-4 border-b border-gray-200 dark:border-[#1f2937] flex items-center justify-between gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[300px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por militar, série, patrimônio ou B.O..." 
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#1f2937] rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-[#0b101a] text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Equipamento</th>
                  <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Militar Responsável</th>
                  <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Nº do B.O</th>
                  <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Data do Registro</th>
                  <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Status</th>
                  <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937] text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#1f2937]">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center animate-pulse text-gray-400 italic">Carregando dados...</td></tr>
                ) : extraviadosFiltrados.map(ex => (
                  <tr key={ex.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2937]/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-danger uppercase">{ex.equipamento?.idRadio ? `Nº ${ex.equipamento.idRadio}` : `SN: ${ex.equipamento?.numSerie}`}</span>
                        <span className="text-[10px] text-gray-400 font-mono uppercase">{ex.equipamento?.rp || 'S/RP'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="text-gray-900 dark:text-white font-medium uppercase">
                          {ex.militarResponsavelPatente ? `${ex.militarResponsavelPatente} ` : ''}{ex.militarResponsavelNome || ex.militar?.nome || 'Não Informado'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{ex.boNumero}</td>
                    <td className="px-6 py-4 text-xs font-medium">
                      {ex.dataExtravio ? new Date(ex.dataExtravio).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4">
                       {ex.status === 'INVESTIGACAO' && (
                         <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-600 rounded-full border border-orange-200">EM INVESTIGAÇÃO</span>
                       )}
                       {ex.status === 'RECUPERADO' && (
                         <span className="px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-600 rounded-full border border-green-200">RECUPERADO</span>
                       )}
                       {ex.status === 'BAIXADO' && (
                         <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-600 rounded-full border border-gray-200">BAIXADO (PERDA)</span>
                       )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => gerarTermoPdf(ex)}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all" 
                          title="Gerar Termo de Extravio"
                        >
                          <FileText size={18} />
                        </button>
                        
                        {ex.status === 'INVESTIGACAO' && (
                          <>
                            <button 
                              onClick={() => { setIdToRecuperar(ex.id); setIsModalRecuperarOpen(true); }}
                              className="p-2 text-success hover:bg-success/10 rounded-lg transition-all"
                              title="Marcar como Recuperado"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button 
                              onClick={() => { setIdToBaixar(ex.id); setIsModalBaixarOpen(true); }}
                              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                              title="Dar Baixa Permanente"
                            >
                              <Archive size={18} />
                            </button>
                            <button 
                              onClick={() => { 
                                // Futuro handler de editar
                                alert("Recurso disponível em breve.");
                              }}
                              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-all"
                              title="Editar Registro"
                            >
                              <Edit3 size={18} />
                            </button>
                          </>
                        )}

                        <button 
                          onClick={() => { setIdToDelete(ex.id); setIsModalDeleteOpen(true); }}
                          className="p-2 text-gray-400 hover:text-danger rounded-lg transition-colors hover:bg-danger/10"
                          title="Remover Registro"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {extraviadosFiltrados.length === 0 && !loading && (
                  <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-500 italic">Nenhum registro encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col overflow-hidden transition-colors shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-[#1f2937]">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldOff className="text-danger" size={24} />
              Registrar Novo Extravio
            </h2>
          </div>
          
          <form onSubmit={handleCreate} className="p-8 overflow-y-auto flex-1 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
              
              <div className="md:col-span-2 space-y-4 bg-gray-50 dark:bg-[#0b101a] p-5 rounded-xl border border-gray-200 dark:border-[#1f2937]">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2 mb-4">
                  <User size={16} />
                  1. Militar Responsável
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
                    <input type="text" required value={formData.militarResponsavelNome} onChange={e => setFormData({...formData, militarResponsavelNome: e.target.value})} className="w-full bg-white dark:bg-surface border border-gray-300 dark:border-[#374151] rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome de Guerra</label>
                    <input type="text" value={formData.militarResponsavelGuerra} onChange={e => setFormData({...formData, militarResponsavelGuerra: e.target.value})} className="w-full bg-white dark:bg-surface border border-gray-300 dark:border-[#374151] rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">RG PM</label>
                    <input type="text" required value={formData.militarResponsavelRg} onChange={e => setFormData({...formData, militarResponsavelRg: e.target.value})} className="w-full bg-white dark:bg-surface border border-gray-300 dark:border-[#374151] rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Patente</label>
                    <select required value={formData.militarResponsavelPatente} onChange={e => setFormData({...formData, militarResponsavelPatente: e.target.value})} className="w-full bg-white dark:bg-surface border border-gray-300 dark:border-[#374151] rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
                      <option value="">Selecione...</option>
                      {['CEL', 'TEN CEL', 'MAJ', 'CAP', '1º TEN', '2º TEN', 'ASP OF', 'CADETE', 'ST', '1º SGT', '2º SGT', '3º SGT', 'CB', 'SD', 'AL SD'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contato</label>
                    <input type="text" value={formData.militarResponsavelContato} onChange={e => setFormData({...formData, militarResponsavelContato: e.target.value})} className="w-full bg-white dark:bg-surface border border-gray-300 dark:border-[#374151] rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                  </div>
                  
                  {/* Unidade Selector */}
                  <div className="col-span-1 md:col-span-3 mt-2 relative">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Unidade do Militar</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Pesquisar unidade..." 
                        className="w-full bg-white dark:bg-surface border border-gray-300 dark:border-[#374151] rounded-lg pl-9 pr-4 py-2 text-sm focus:border-primary outline-none transition-all"
                        value={buscaUnidade}
                        onChange={(e) => setBuscaUnidade(e.target.value)}
                      />
                    </div>
                    {buscaUnidade && (
                      <div className="w-full mt-1 bg-white dark:bg-surface border border-gray-300 dark:border-[#374151] rounded-lg max-h-32 overflow-y-auto shadow-lg z-10 absolute left-0 right-0">
                        {unidades.filter(u => u.nome.toLowerCase().includes(buscaUnidade.toLowerCase())).map(u => (
                          <div 
                            key={u.id}
                            onClick={() => {
                              setFormData({...formData, unidadeId: u.id});
                              setBuscaUnidade(u.nome);
                            }}
                            className={`px-3 py-2 text-xs cursor-pointer transition-all border-l-2 ${formData.unidadeId === u.id ? 'bg-primary/10 border-primary font-bold text-primary' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                          >
                            {u.nome}
                          </div>
                        ))}
                      </div>
                    )}
                    {formData.unidadeId && !buscaUnidade && (
                      <div className="mt-2 text-xs font-bold text-primary bg-primary/10 px-3 py-2 rounded border border-primary/20">
                        Unidade Selecionada: {unidades.find(u => u.id === formData.unidadeId)?.nome}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <Radio size={16} />
                  2. Equipamento Extraviado
                </label>
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Pesquisar por Patrimônio ou Nº..." 
                      className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#1f2937] rounded-lg pl-9 pr-4 py-2 text-sm focus:border-primary outline-none transition-all"
                      value={buscaEquipamento}
                      onChange={(e) => setBuscaEquipamento(e.target.value)}
                    />
                  </div>
                  <div className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#1f2937] rounded-lg h-48 overflow-y-auto p-1 space-y-1">
                    {equipamentosFiltrados.map(eq => {
                      const identificador = eq.idRadio ? `Nº ${eq.idRadio}` : `SN: ${eq.numSerie}`;
                      return (
                        <div 
                          key={eq.id}
                          onClick={() => setFormData({...formData, equipamentoId: eq.id})}
                          className={`px-3 py-2 text-xs rounded-lg cursor-pointer transition-all border flex flex-col ${formData.equipamentoId === eq.id ? 'bg-danger/10 border-danger font-bold text-danger shadow-sm' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        >
                          <span>{identificador}</span>
                          <span className="text-[9px] opacity-60 font-normal">RP: {eq.rp || 'S/RP'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">3. Número do B.O</label>
                <input 
                  type="text" 
                  required
                  placeholder="EX: 00123/2023.100456-7"
                  value={formData.boNumero}
                  onChange={(e) => setFormData({...formData, boNumero: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#1f2937] rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">4. Data do Registro</label>
                <input 
                  type="date" 
                  required
                  value={formData.dataRegistro}
                  onChange={(e) => setFormData({...formData, dataRegistro: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">5. Descrição do Ocorrido</label>
                <textarea 
                  rows={4}
                  placeholder="Detalhe as circunstâncias do extravio..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#1f2937] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-10 border-t border-gray-100 dark:border-[#1f2937]">
              <button 
                type="submit"
                className="px-10 py-3 text-base font-bold text-white bg-danger hover:bg-red-600 rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-95"
              >
                Confirmar Registro
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAIS DE AÇÃO */}
      <ModalConfirmacao 
        isOpen={isModalDeleteOpen}
        title="Remover Registro"
        message="Deseja excluir este registro de extravio? O rádio voltará ao status OPERACIONAL."
        onConfirm={confirmDelete}
        onCancel={() => { setIsModalDeleteOpen(false); setIdToDelete(null); }}
      />

      <ModalConfirmacao 
        isOpen={isModalRecuperarOpen}
        title="Marcar como Recuperado"
        message="O equipamento foi localizado? Ele voltará ao inventário ativo como OPERACIONAL."
        onConfirm={handleRecuperar}
        onCancel={() => { setIsModalRecuperarOpen(false); setIdToRecuperar(null); }}
        confirmText="Confirmar Recuperação"
      />

      <ModalConfirmacao 
        isOpen={isModalBaixarOpen}
        title="Baixa Permanente"
        message="Deseja dar baixa definitiva neste equipamento? Ele será removido do inventário ativo e marcado como uma perda oficial e irreversível."
        onConfirm={handleBaixar}
        onCancel={() => { setIsModalBaixarOpen(false); setIdToBaixar(null); }}
        confirmText="Confirmar Baixa"
      />
    </div>
  );
};

export default Extraviados;
