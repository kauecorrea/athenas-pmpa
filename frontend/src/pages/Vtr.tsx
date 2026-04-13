import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Search, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  X, 
  Trash2,
  Car
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Unidade {
  id: string;
  nome: string;
}

interface ManutencaoVTR {
  id: string;
  osNumero: number;
  paeNumero: string;
  dataServico: string;
  unidade: Unidade;
  unidadeId: string;
  solicitante: string;
  tecnico: string;
  placaVrt: string;
  prefixo: string;
  kmVrt: number;
  modeloRadio: string;
  numSerieRadio: string;
  defeitoReclamado: string;
  defeitoConstatado: string;
  solucao: string;
  status: string;
  servicos: string[];
}

const LISTA_SERVICOS = [
  "Prog. e padro. de Freq. Radio HTs",
  "Prog. e padro. de Freq. Radio Fixo",
  "Manut. Corret. Radio HT (Terceiros)",
  "Manut. Corret. Radio Movel (Terceir)",
  "Vist. Ánalise de Radio Moveis",
  "Prog. Padro. de Radio Movel",
  "Vist. Radio Fixos",
  "Vist. e Ánalise de Radio",
  "Vist. Radio Portateis",
  "Manut. Corret. Antena Base Fixa",
  "Manut. Corret. Antena VTR",
  "Levant. Situa. Rede Radio"
];

const Vtr: React.FC = () => {
  const [manutencoes, setManutencoes] = useState<ManutencaoVTR[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    paeNumero: '',
    unidadeId: '',
    solicitante: '',
    tecnico: '',
    placaVrt: '',
    prefixo: '',
    kmVrt: '',
    modeloRadio: '',
    numSerieRadio: '',
    defeitoReclamado: '',
    defeitoConstatado: '',
    solucao: '',
    status: 'Pendente',
    servicos: [] as string[],
    dataInicio: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filtro]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vtrRes, unidadesRes] = await Promise.all([
        axios.get('/api/vtr'),
        axios.get('/api/unidades')
      ]);
      setManutencoes(vtrRes.data);
      setUnidades(unidadesRes.data);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/vtr', formData);
      setIsModalOpen(false);
      fetchData();
      // Reset form
      setFormData({
        paeNumero: '',
        unidadeId: '',
        solicitante: '',
        tecnico: '',
        placaVrt: '',
        prefixo: '',
        kmVrt: '',
        modeloRadio: '',
        numSerieRadio: '',
        defeitoReclamado: '',
        defeitoConstatado: '',
        solucao: '',
        status: 'Pendente',
        servicos: [],
        dataInicio: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      alert('Erro ao criar manutenção VTR');
    }
  };

  const toggleService = (servico: string) => {
    setFormData(prev => ({
      ...prev,
      servicos: prev.servicos.includes(servico)
        ? prev.servicos.filter(s => s !== servico)
        : [...prev.servicos, servico]
    }));
  };

  const deleteManutencao = async (id: string) => {
    setIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!idToDelete) return;
    try {
      await axios.delete(`/api/vtr/${idToDelete}`);
      setIsDeleteModalOpen(false);
      setIdToDelete(null);
      fetchData();
    } catch (error) {
      alert('Erro ao excluir');
    }
  };

  const getBase64ImageFromUrl = async (imageUrl: string) => {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(reader.result as string), false);
      reader.onerror = () => reject();
      reader.readAsDataURL(blob);
    });
  };

  const gerarLaudoPDF = async (m: ManutencaoVTR) => {
    const doc = new jsPDF();
    
    try {
      const base64Para = await getBase64ImageFromUrl('/brasao_para.png');
      doc.addImage(base64Para, 'PNG', 14, 10, 20, 22);
    } catch (e) { console.error('Sem brasao_para.png'); }
    
    try {
      const base64Pmpa = await getBase64ImageFromUrl('/brasao_pmpa.png');
      doc.addImage(base64Pmpa, 'PNG', 176, 10, 20, 22);
    } catch (e) { console.error('Sem brasao_pmpa.png'); }

    // Cabeçalho
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("GOVERNO DO ESTADO DO PARÁ", 105, 15, { align: "center" });
    doc.text("SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA E DEFESA SOCIAL", 105, 20, { align: "center" });
    doc.text("POLÍCIA MILITAR DO PARÁ", 105, 25, { align: "center" });
    doc.text("DEPARTAMENTO GERAL DE ADMINISTRAÇÃO", 105, 30, { align: "center" });
    doc.text("DIRETORIA DE TELEMÁTICA", 105, 35, { align: "center" });

    doc.setFontSize(12);
    doc.text("LAUDO DE ATENDIMENTO TÉCNICO VTR", 105, 50, { align: "center" });

    // Informações Básicas
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    const dataFormatada = new Date(m.dataServico).toLocaleDateString('pt-BR');
    
    autoTable(doc, {
      startY: 60,
      head: [['Os nº', m.osNumero?.toString().padStart(3, '0')]],
      body: [
        ['UnidadeVrt', m.unidade?.nome || '-', 'Data_Serviço', dataFormatada],
        ['Solicitante', m.solicitante || '-', '', ''],
        ['PlacaVRT', m.placaVrt || '-', 'Pre_fixo', m.prefixo || '0'],
        ['Defeito Reclamado', m.defeitoReclamado || '-', '', ''],
        ['Defeito Constatado', m.defeitoConstatado || '-', '', ''],
      ],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 }, 2: { fontStyle: 'bold', cellWidth: 35 } }
    });

    const finalYInfo = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFont("helvetica", "bold");
    doc.text("ATENDIMENTO", 105, finalYInfo, { align: "center" });
    
    doc.setFontSize(8);
    doc.text(`TÉCNICO: ${m.tecnico}`, 14, finalYInfo + 8);

    // Checklist de Serviços
    const servicosRows = LISTA_SERVICOS.map(s => [
      m.servicos.includes(s) ? "[X]" : "[ ]",
      s
    ]);

    autoTable(doc, {
      startY: finalYInfo + 12,
      head: [['CHECK', 'SERVIÇOS']],
      body: servicosRows,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1 },
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 15, halign: 'center' } }
    });

    const finalYServ = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFont("helvetica", "bold");
    doc.text("SOLUÇÃO", 14, finalYServ);
    doc.setFont("helvetica", "normal");
    const splitSolucao = doc.splitTextToSize(m.solucao || '-', 180);
    doc.text(splitSolucao, 14, finalYServ + 6);

    // Rodapé Assinatura
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("1º TEN QOPM MADAKE", 105, pageHeight - 30, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Chefe da Seção de Manutenção - DITEL", 105, pageHeight - 25, { align: "center" });

    doc.save(`Laudo_VTR_OS_${m.osNumero}.pdf`);
  };

  const manutencoesFiltradas = manutencoes.filter(m => {
    let matchString = 
      (m.placaVrt || '').toLowerCase().includes(filtro.toLowerCase()) ||
      (m.prefixo || '').toLowerCase().includes(filtro.toLowerCase()) ||
      (m.unidade?.nome || '').toLowerCase().includes(filtro.toLowerCase()) ||
      (m.osNumero || '').toString().includes(filtro);
    
    let matchStatus = filtroStatus === 'Todos' || m.status === filtroStatus;

    return matchString && matchStatus;
  });

  // Pagination Logic
  const totalPages = Math.ceil(manutencoesFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const manutencoesPaginadas = manutencoesFiltradas.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in text-gray-900 dark:text-white pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-surface p-6 rounded-2xl border border-gray-100 dark:border-[#1f2937] shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Car className="text-primary" size={32} />
            Manutenção de Viaturas (VTR)
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Registro de laudos e vistorias técnicas em viaturas da corporação
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={20} />
          Nova Manutençao VTR
        </button>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="bg-white dark:bg-surface p-4 rounded-xl border border-gray-100 dark:border-[#1f2937] shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por placa, prefixo, unidade ou OS..." 
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full bg-gray-50 dark:bg-[#0a0f1d] border border-gray-200 dark:border-[#1f2937] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
        <div className="w-full md:w-auto">
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="w-full bg-gray-50 dark:bg-[#0a0f1d] border border-gray-200 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-900 dark:text-white"
          >
            <option value="Todos">Todos os Status</option>
            <option value="Pronto">Pronto</option>
            <option value="Pendente">Pendente</option>
            <option value="Assistência Técnica">Assistência Técnica</option>
          </select>
        </div>
      </div>

      {/* TABELA DE REGISTROS */}
      <div className="bg-white dark:bg-surface rounded-2xl border border-gray-100 dark:border-[#1f2937] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-gray-50 dark:bg-[#0a0f1d] text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 border-b border-gray-100 dark:border-[#1f2937]">OS nº</th>
                <th className="px-6 py-4 border-b border-gray-100 dark:border-[#1f2937]">VTR / Prefixo</th>
                <th className="px-6 py-4 border-b border-gray-100 dark:border-[#1f2937]">Unidade</th>
                <th className="px-6 py-4 border-b border-gray-100 dark:border-[#1f2937]">Data</th>
                <th className="px-6 py-4 border-b border-gray-100 dark:border-[#1f2937]">Status</th>
                <th className="px-6 py-4 border-b border-gray-100 dark:border-[#1f2937] text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-[#1f2937]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400 italic">Carregando manutenções...</td>
                </tr>
              ) : manutencoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400 italic">Nenhum registro encontrado.</td>
                </tr>
              ) : (
                manutencoesPaginadas.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-bold text-primary">#{m.osNumero.toString().padStart(3, '0')}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold">{m.placaVrt}</span>
                        <span className="text-xs text-gray-500 uppercase">Prefixo: {m.prefixo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{m.unidade?.nome}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar size={14} />
                        {new Date(m.dataServico).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      <span className={`px-2.5 py-1 text-[11px] font-bold tracking-wide rounded-full border ${
                        m.status === 'Pronto' ? 'text-success bg-success/10 border-success/20' :
                        m.status === 'Assistência Técnica' ? 'text-danger bg-danger/10 border-danger/20' :
                        'text-warning bg-warning/10 border-warning/20'
                      }`}>
                        {m.status || 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => gerarLaudoPDF(m)}
                          title="Gerar Laudo PDF"
                          className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                        >
                          <FileText size={18} />
                        </button>
                        <button 
                          onClick={() => deleteManutencao(m.id)}
                          title="Excluir"
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-[#0a0f1d] border-t border-gray-100 dark:border-[#1f2937] flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Mostrando <span className="text-gray-900 dark:text-white">{startIndex + 1}</span> a <span className="text-gray-900 dark:text-white">{Math.min(startIndex + itemsPerPage, manutencoesFiltradas.length)}</span> de <span className="text-gray-900 dark:text-white">{manutencoesFiltradas.length}</span> registros
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 dark:border-[#1f2937] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
              >
                Anterior
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const pageNumber = i + 1;
                  // Show current page, first, last, and pages around current
                  if (
                    pageNumber === 1 || 
                    pageNumber === totalPages || 
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                          currentPage === pageNumber 
                            ? 'bg-primary text-white shadow-md' 
                            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    pageNumber === currentPage - 2 || 
                    pageNumber === currentPage + 2
                  ) {
                    return <span key={pageNumber} className="text-gray-400">...</span>;
                  }
                  return null;
                })}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 dark:border-[#1f2937] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE CADASTRO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-surface w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-8 py-6 bg-gray-50 dark:bg-[#0a0f1d] border-b border-gray-100 dark:border-[#1f2937] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <Car className="text-primary" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nova Manutenção VTR</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">Emitir Laudo de Atendimento</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              
              {/* Seção 1: Identificação */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <div className="w-1.5 h-6 bg-primary rounded-full" />
                  <h3 className="font-bold uppercase tracking-wider text-sm">Identificação do Atendimento</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 tracking-wider">Unidade VRT</label>
                    <select 
                      value={formData.unidadeId}
                      onChange={(e) => setFormData({...formData, unidadeId: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-[#0a0f1d] border border-gray-200 dark:border-[#374151] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-900 dark:text-white"
                    >
                      <option value="">Selecione a Unidade</option>
                      {unidades.map(u => (
                        <option key={u.id} value={u.id}>{u.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 tracking-wider">Nº/PAE</label>
                    <input 
                      type="text" 
                      value={formData.paeNumero}
                      onChange={(e) => setFormData({...formData, paeNumero: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-[#0a0f1d] border border-gray-200 dark:border-[#374151] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 tracking-wider">Data do Serviço</label>
                    <input 
                      type="date" 
                      value={formData.dataInicio}
                      onChange={(e) => setFormData({...formData, dataInicio: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-[#0a0f1d] border border-gray-200 dark:border-[#374151] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 tracking-wider">Solicitante</label>
                    <input 
                      type="text" 
                      value={formData.solicitante}
                      onChange={(e) => setFormData({...formData, solicitante: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-[#0a0f1d] border border-gray-200 dark:border-[#374151] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 tracking-wider">Técnico Responsável</label>
                    <input 
                      type="text" 
                      value={formData.tecnico}
                      onChange={(e) => setFormData({...formData, tecnico: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-[#0a0f1d] border border-gray-200 dark:border-[#374151] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Dados da Viatura */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 opacity-70">
                  <div className="w-1.5 h-6 bg-gray-400 rounded-full" />
                  <h3 className="font-bold uppercase tracking-wider text-sm">Dados da Viatura e Equipamento</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 tracking-wider">Placa VRT</label>
                    <input 
                      type="text" 
                      placeholder="ABC-1234"
                      value={formData.placaVrt}
                      onChange={(e) => setFormData({...formData, placaVrt: e.target.value.toUpperCase()})}
                      className="w-full bg-gray-50 dark:bg-[#0a0f1d] border border-gray-200 dark:border-[#374151] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 tracking-wider">Prefixo</label>
                    <input 
                      type="text" 
                      value={formData.prefixo}
                      onChange={(e) => setFormData({...formData, prefixo: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-[#0a0f1d] border border-gray-200 dark:border-[#374151] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 tracking-wider">Km VRT</label>
                    <input 
                      type="number" 
                      value={formData.kmVrt}
                      onChange={(e) => setFormData({...formData, kmVrt: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-[#0a0f1d] border border-gray-200 dark:border-[#374151] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 tracking-wider">Modelo do Rádio</label>
                    <input 
                      type="text" 
                      value={formData.modeloRadio}
                      onChange={(e) => setFormData({...formData, modeloRadio: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-[#0a0f1d] border border-gray-200 dark:border-[#374151] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 tracking-wider">Nº de Série / Rádio</label>
                    <input 
                      type="text" 
                      value={formData.numSerieRadio}
                      onChange={(e) => setFormData({...formData, numSerieRadio: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-[#0a0f1d] border border-gray-200 dark:border-[#374151] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 3: Checklist de Serviços */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <div className="w-1.5 h-6 bg-primary rounded-full" />
                  <h3 className="font-bold uppercase tracking-wider text-sm">Serviços Realizados</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 dark:bg-[#0a0f1d] p-6 rounded-2xl border border-gray-100 dark:border-[#1f2937]">
                  {LISTA_SERVICOS.map(servico => (
                    <label key={servico} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input 
                          type="checkbox"
                          checked={formData.servicos.includes(servico)}
                          onChange={() => toggleService(servico)}
                          className="peer appearance-none w-5 h-5 rounded-md border-2 border-gray-300 dark:border-[#374151] checked:bg-primary checked:border-primary transition-all"
                        />
                        <CheckCircle2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" size={14} />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">{servico}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Seção 4: Diagnóstico e Solução */}
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 tracking-wider">Defeito Reclamado</label>
                  <textarea 
                    value={formData.defeitoReclamado}
                    onChange={(e) => setFormData({...formData, defeitoReclamado: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-[#0a0f1d] border border-gray-200 dark:border-[#374151] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[80px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 tracking-wider">Defeito Constatado</label>
                  <textarea 
                    value={formData.defeitoConstatado}
                    onChange={(e) => setFormData({...formData, defeitoConstatado: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-[#0a0f1d] border border-gray-200 dark:border-[#374151] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[80px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 tracking-wider">Solução Técnica</label>
                  <textarea 
                    value={formData.solucao}
                    onChange={(e) => setFormData({...formData, solucao: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-[#0a0f1d] border border-gray-200 dark:border-[#374151] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[120px]"
                    placeholder="Descreva detalhadamente o serviço executado..."
                  />
                </div>
              </div>

              {/* Seção 5: Status */}
              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-[#1f2937]">
                <div className="flex items-center gap-2 text-primary">
                  <div className="w-1.5 h-6 bg-primary rounded-full" />
                  <h3 className="font-bold uppercase tracking-wider text-sm">Status Final da Manutenção</h3>
                </div>
                <div>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-[#0a0f1d] border border-gray-200 dark:border-[#374151] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-900 dark:text-white font-bold"
                  >
                    <option value="Pronto">Pronto</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Assistência Técnica">Assistência Técnica</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer (Inner) */}
              <div className="pt-6 border-t border-gray-100 dark:border-[#1f2937] flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white px-10 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Salvar e Gerar OS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-surface w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="text-red-500" size={40} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Excluir Registro?</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Esta ação não pode ser desfeita. O laudo de manutenção será removido permanentemente do sistema.
              </p>
            </div>
            <div className="px-8 py-6 bg-gray-50 dark:bg-[#0a0f1d] border-t border-gray-100 dark:border-[#1f2937] flex gap-3">
              <button 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setIdToDelete(null);
                }}
                className="flex-1 px-6 py-3 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vtr;
