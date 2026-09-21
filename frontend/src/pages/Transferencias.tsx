import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Search, 
  Trash2, 
  ArrowRightLeft, 
  List,
  Building2,
  Radio,
  Edit3,
  FileText
} from 'lucide-react';
import ModalConfirmacao from '../components/ModalConfirmacao';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Equipamento {
  id: string;
  rp: string;
  idRadio: string;
  numSerie: string;
  marca: string;
  modelo: string;
  status: string;
  unidade?: {
    id: string;
    nome: string;
  };
}

interface Unidade {
  id: string;
  nome: string;
}

interface Transferencia {
  id: string;
  dataTransferencia: string;
  motivo?: string;
  observacoes?: string;
  unidadeOrigem: Unidade;
  unidadeDestino: Unidade;
  equipamentos: Equipamento[];
  militarId?: string;
  militar?: { id: string; nome: string; rg: string; posto?: string | null };
}

const Transferencias: React.FC = () => {
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [militares, setMilitares] = useState<{id: string, nome: string, rg: string, posto?: string | null}[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState<'form' | 'list'>('form');
  const [busca, setBusca] = useState('');
  const [buscaUnidade, setBuscaUnidade] = useState('');
  const [buscaRadio, setBuscaRadio] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    unidadeDestinoId: '',
    equipamentosIds: [] as string[],
    militarId: '',
    observacoes: '',
    dataTransferencia: new Date().toISOString().split('T')[0]
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transRes, uniRes, eqRes, milRes] = await Promise.all([
        axios.get('/api/transferencias'),
        axios.get('/api/unidades'),
        axios.get('/api/equipamentos?status=OPERACIONAL'),
        axios.get('/api/militares')
      ]);
      setTransferencias(transRes.data);
      setUnidades(uniRes.data);
      setEquipamentos(eqRes.data);
      setMilitares(milRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEquipamento = (id: string) => {
    setFormData(prev => {
      const exists = prev.equipamentosIds.includes(id);
      if (exists) {
        return { ...prev, equipamentosIds: prev.equipamentosIds.filter(i => i !== id) };
      } else {
        return { ...prev, equipamentosIds: [...prev.equipamentosIds, id] };
      }
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.equipamentosIds.length === 0) {
      alert("Selecione ao menos um equipamento.");
      return;
    }
    try {
      if (editingId) {
        await axios.put(`/api/transferencias/${editingId}`, formData);
        alert("Transferência atualizada com sucesso!");
      } else {
        await axios.post('/api/transferencias', formData);
        alert(`${formData.equipamentosIds.length} rádio(s) transferido(s) com sucesso!`);
      }
      resetForm();
      fetchData();
      setViewMode('list');
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.error || e.response?.data?.details || "Erro desconhecido";
      alert(`Erro ao salvar: ${msg}`);
    }
  };

  const resetForm = () => {
    setFormData({
      unidadeDestinoId: '',
      equipamentosIds: [],
      militarId: '',
      observacoes: '',
      dataTransferencia: new Date().toISOString().split('T')[0]
    });
    setEditingId(null);
    setBuscaUnidade('');
    setBuscaRadio('');
  };

  const confirmDelete = async () => {
    if (!idToDelete) return;
    try {
      await axios.delete(`/api/transferencias/${idToDelete}`);
      setIsModalDeleteOpen(false);
      setIdToDelete(null);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (t: Transferencia) => {
    setFormData({
      unidadeDestinoId: t.unidadeDestino.id,
      equipamentosIds: t.equipamentos.map(e => e.id),
      militarId: t.militarId || '',
      observacoes: t.observacoes || '',
      dataTransferencia: t.dataTransferencia.split('T')[0]
    });
    setEditingId(t.id);
    setViewMode('form');
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

  const gerarPDF = async (t: Transferencia) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Brasões Institucionais
    try {
      const base64Para = await getBase64ImageFromUrl('/brasao_para.png');
      doc.addImage(base64Para, 'PNG', 14, 10, 20, 22);
      doc.setFontSize(6);
      doc.text("GOVERNO DO ESTADO", 24, 34, { align: "center" });
      doc.text("DO PARÁ", 24, 37, { align: "center" });
    } catch (err) { console.error('Sem brasao_para.png'); }
    
    try {
      const base64Pmpa = await getBase64ImageFromUrl('/brasao_pmpa.png');
      doc.addImage(base64Pmpa, 'PNG', 170, 8, 25, 25);
    } catch (err) { console.error('Sem brasao_pmpa.png'); }

    // 2. Cabeçalho Oficial (Timbre)
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("GOVERNO DO ESTADO DO PARÁ", 105, 15, { align: 'center' });
    doc.text("SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA E DEFESA SOCIAL", 105, 20, { align: 'center' });
    doc.text("POLÍCIA MILITAR DO PARÁ", 105, 25, { align: 'center' });
    doc.text("DEPARTAMENTO GERAL DE ADMINISTRAÇÃO", 105, 30, { align: 'center' });
    doc.text("DIRETORIA DE TELEMÁTICA", 105, 35, { align: 'center' });
    
    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(14, 42, pageWidth - 14, 42);

    // Título e Número
    doc.setFontSize(12);
    doc.text("TERMO DE RESPONSABILIDADE", 105, 52, { align: 'center' });
    doc.setLineWidth(0.2);
    doc.line(70, 53, 140, 53); // Underline

    const dataT = new Date(t.dataTransferencia);
    const ano = dataT.getFullYear();
    // Pega os ultimos digitos do ID para simular numero ou apenas gerar um
    const seq = t.id.substring(t.id.length - 4).toUpperCase();
    doc.text(`Nº ${seq}/${ano}`, 105, 62, { align: 'center' });

    // Informações textuais (Esquerda)
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("ÓRGÃO: POLÍCIA MILITAR DO ESTADO DO PARÁ", 20, 75);
    doc.text(`UNIDADE (ORIGEM): ${t.unidadeOrigem?.nome || 'DITEL/TELECOM'}`, 20, 81);
    doc.text(`UNIDADE (DESTINO): ${t.unidadeDestino.nome}`, 20, 87);
    doc.text("SITUAÇÃO: TRANSFERÊNCIA DE CARGA", 20, 93);

    // Tabela
    const tableData = t.equipamentos.map(eq => [
      eq.idRadio || eq.rp || '-',
      `${eq.marca || ''} ${eq.modelo || ''}`.trim() || 'RÁDIO COMUNICADOR',
      eq.numSerie,
      eq.rp || '-'
    ]);

    autoTable(doc, {
      startY: 105,
      head: [[{ content: 'RELAÇÃO DE EQUIPAMENTOS', colSpan: 4, styles: { halign: 'center', fillColor: [255, 255, 255], textColor: 0, fontStyle: 'bold' } }], ['ORDEM', 'DESCRIÇÃO DO BEM', 'Nº DE SÉRIE', 'RP']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { textColor: 0, halign: 'center' },
      styles: { fontSize: 9, cellPadding: 3, lineColor: [0, 0, 0], lineWidth: 0.2 }
    });

    let finalY = (doc as any).lastAutoTable.finalY || 105;

    // Observações
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    const obsText = `OBS: ${t.observacoes || 'RÁDIO ACOMPANHA BATERIA, MICROFONE DE LAPELA E BASE CARREGADORA COM FONTE.'}`;
    const splitObs = doc.splitTextToSize(obsText.toUpperCase(), pageWidth - 40);
    doc.text(splitObs, 20, finalY + 10);

    finalY += 10 + (splitObs.length * 4);

    // Termo de responsabilidade
    doc.setFont("helvetica", "normal");
    const responsabilidade = "Pelo presente termo assumo total e inteira responsabilidade pelo equipamento acima recebido, bem como, mantê-lo a salvo de perda, furto ou dano por má utilização, excetuado o desgaste natural de tempo e uso.";
    const splitResp = doc.splitTextToSize(responsabilidade, pageWidth - 40);
    doc.text(splitResp, 20, finalY + 10, { align: 'justify', maxWidth: pageWidth - 40 });

    finalY += 10 + (splitResp.length * 4) + 5;

    // Caixa de RECEBIMENTO
    doc.rect(14, finalY, pageWidth - 28, 60);
    doc.setFont("helvetica", "bold");
    doc.text("RECEBIMENTO", 105, finalY + 5, { align: 'center' });
    doc.line(14, finalY + 7, pageWidth - 14, finalY + 7); // Linha horizontal do recebimento
    doc.line(105, finalY + 7, 105, finalY + 60); // Linha vertical separadora

    // Coluna Esquerda (Origem)
    doc.setFontSize(9);
    doc.text(`ÓRGÃO ou UNIDADE ORIGEM: ${t.unidadeOrigem?.nome || 'TELECOM/DITEL'}`, 16, finalY + 13);
    doc.text("DATA: ___/___/_______", 16, finalY + 23);

    // Assinatura Militar Origem (DITEL)
    let militarOrigem = "AUXILIAR DA SEÇÃO DE TELECOMUNICAÇÕES DA DITEL";
    if (t.militar) {
      const posto = t.militar.posto ? t.militar.posto + " " : "";
      militarOrigem = `${posto}${t.militar.nome} - RG ${t.militar.rg}`;
    } else {
       militarOrigem = "RESPONSÁVEL ORIGEM";
    }
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(militarOrigem, 60, finalY + 53, { align: 'center' });
    if (t.militar) {
        doc.text("AUXILIAR DA SEÇÃO DE TELECOMUNICAÇÕES DA DITEL", 60, finalY + 57, { align: 'center' });
    }

    // Coluna Direita (Destino)
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`ÓRGÃO ou UNIDADE DESTINO: ${t.unidadeDestino.nome}`, 107, finalY + 13);
    doc.text("DATA: ___/___/_______", 107, finalY + 23);
    doc.text("RG:: ________________", 107, finalY + 28);

    doc.line(125, finalY + 50, 195, finalY + 50); // Linha assinatura
    doc.setFont("helvetica", "normal");
    doc.text("RECEBEDOR", 160, finalY + 55, { align: 'center' });

    window.open(doc.output('bloburl'), '_blank');
  };

  const transferenciasFiltradas = useMemo(() => {
    return transferencias.filter(t => {
      const termo = busca.toLowerCase();
      return t.unidadeDestino.nome.toLowerCase().includes(termo) || 
             t.unidadeOrigem?.nome?.toLowerCase().includes(termo);
    });
  }, [transferencias, busca]);

  const unidadesFiltradas = useMemo(() => {
    return unidades.filter(u => u.nome.toLowerCase().includes(buscaUnidade.toLowerCase()));
  }, [unidades, buscaUnidade]);

  const radiosFiltrados = useMemo(() => {
    return equipamentos.filter(eq => 
      eq.rp?.toLowerCase().includes(buscaRadio.toLowerCase()) || 
      eq.idRadio?.toLowerCase().includes(buscaRadio.toLowerCase())
    );
  }, [equipamentos, buscaRadio]);

  return (
    <div className="max-width-7xl mx-auto space-y-6 animate-fade-in text-gray-900 dark:text-white h-full flex flex-col relative transition-colors duration-200">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-surface p-6 rounded-2xl border border-gray-100 dark:border-[#1f2937] shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <ArrowRightLeft className="text-primary" size={32} />
            Transferências de Carga
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Movimentação definitiva de patrimônio entre unidades</p>
        </div>
        {viewMode === 'list' ? (
          <button 
            onClick={() => { resetForm(); setViewMode('form'); }}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={20} />
            Nova Transferência
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
                placeholder="Buscar por Unidade (Origem ou Destino)..." 
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#1f2937] rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-[#0b101a] text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Patrimônio / Rádio</th>
                  <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Unidade Origem</th>
                  <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Unidade Destino</th>
                  <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Data</th>
                  <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Motivo</th>
                  <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937] text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#1f2937]">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">Carregando dados...</td></tr>
                ) : transferenciasFiltradas.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2937]/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 dark:text-white">
                          <Radio className="inline mr-2 text-primary" size={14} />
                          {t.equipamentos.length} Equipamento(s)
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase">Transferência em Lote</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 uppercase">{t.unidadeOrigem?.nome || '-'}</td>
                    <td className="px-6 py-4 font-bold text-primary uppercase">{t.unidadeDestino.nome}</td>
                    <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">
                      {new Date(t.dataTransferencia).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-xs italic text-gray-500 max-w-[200px] truncate">{t.observacoes || 'Sem observações'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => gerarPDF(t)}
                          className="text-primary hover:text-blue-700 p-2 rounded-lg transition-colors hover:bg-primary/10"
                          title="Emitir Documento"
                        >
                          <FileText size={18} />
                        </button>
                        <button 
                          onClick={() => handleEdit(t)}
                          className="text-gray-400 hover:text-primary p-2 rounded-lg transition-colors hover:bg-primary/10"
                          title="Editar"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => { setIdToDelete(t.id); setIsModalDeleteOpen(true); }}
                          className="text-gray-400 hover:text-danger p-2 rounded-lg transition-colors hover:bg-danger/10"
                          title="Estornar Transferência"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {transferenciasFiltradas.length === 0 && !loading && (
                  <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-500 italic">Nenhum registro encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col overflow-hidden transition-colors shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-[#1f2937] flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 className="text-primary" size={24} />
              {editingId ? 'Editar Registro de Transferência' : 'Registrar Transferência de Carga'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Transfira a carga de um ou mais equipamentos para outra unidade definitivamente.
            </p>
          </div>
          
          <form onSubmit={handleCreate} className="p-8 overflow-y-auto flex-1 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
              
              {/* PESQUISA UNIDADE */}
              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <Building2 size={16} />
                  1. Unidade de Destino
                </label>
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Pesquisar unidade..." 
                      className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#1f2937] rounded-lg pl-9 pr-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      value={buscaUnidade}
                      onChange={(e) => setBuscaUnidade(e.target.value)}
                    />
                  </div>
                  <div className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#1f2937] rounded-lg h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20">
                    {unidadesFiltradas.map(u => (
                      <div 
                        key={u.id}
                        onClick={() => setFormData({...formData, unidadeDestinoId: u.id})}
                        className={`px-4 py-2.5 text-sm cursor-pointer transition-colors border-l-4 ${formData.unidadeDestinoId === u.id ? 'bg-primary/10 border-primary font-bold text-primary' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                      >
                        {u.nome}
                      </div>
                    ))}
                    {unidadesFiltradas.length === 0 && <div className="p-4 text-center text-gray-500 text-xs italic">Nenhuma unidade encontrada</div>}
                  </div>
                </div>
              </div>

              {/* PESQUISA RÁDIO (MÚLTIPLO) */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                    <Radio size={16} />
                    2. Equipamento(s) para Transferir
                  </label>
                  <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                    {formData.equipamentosIds.length} selecionado(s)
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Pesquisar por Patrimônio ou Nº..." 
                      className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#1f2937] rounded-lg pl-9 pr-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      value={buscaRadio}
                      onChange={(e) => setBuscaRadio(e.target.value)}
                    />
                  </div>
                  <div className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#1f2937] rounded-lg h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 p-1 space-y-1">
                    {radiosFiltrados.map(eq => {
                      const selected = formData.equipamentosIds.includes(eq.id);
                      const identificador = eq.idRadio ? `Nº ${eq.idRadio}` : `SN: ${eq.numSerie}`;
                      return (
                        <div 
                          key={eq.id}
                          onClick={() => handleToggleEquipamento(eq.id)}
                          className={`
                            px-3 py-2 rounded-lg text-xs cursor-pointer transition-all border flex items-center justify-between
                            ${selected 
                              ? 'bg-primary/20 border-primary text-primary font-bold shadow-sm' 
                              : 'bg-white dark:bg-surface border-gray-200 dark:border-[#1f2937] hover:border-primary/50 text-gray-700 dark:text-gray-300'}
                          `}
                        >
                          <div className="flex flex-col">
                            <span>{identificador}</span>
                            <span className="text-[9px] opacity-60 font-normal">{eq.modelo} [{eq.unidade?.nome}]</span>
                          </div>
                          {selected && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                        </div>
                      );
                    })}
                    {radiosFiltrados.length === 0 && <div className="p-4 text-center text-gray-500 text-xs italic">Nenhum rádio operacional encontrado</div>}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">3. Data da Transferência</label>
                <input 
                  type="date" 
                  required
                  value={formData.dataTransferencia}
                  onChange={(e) => setFormData({...formData, dataTransferencia: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#1f2937] rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">4. Observações / Documento</label>
                <textarea 
                  rows={4}
                  placeholder="Informe o número do ofício, portaria ou motivo da transferência definitiva..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#1f2937] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="md:col-span-2 mt-4 border-t border-gray-100 dark:border-[#1f2937] pt-6">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">5. Militar Responsável (DITEL)</label>
                <select 
                  value={formData.militarId} 
                  onChange={e => setFormData({...formData, militarId: e.target.value})} 
                  className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#1f2937] rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selecione...</option>
                  {militares.map(m => <option key={m.id} value={m.id}>{m.rg} - {m.posto ? `${m.posto} ` : ''}{m.nome}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-10 border-t border-gray-100 dark:border-[#1f2937]">
              <button 
                type="submit"
                className="px-10 py-3 text-base font-bold text-white bg-primary hover:bg-blue-600 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2"
              >
                <ArrowRightLeft size={20} />
                {editingId ? 'Salvar Alterações' : `Confirmar Transferência de ${formData.equipamentosIds.length > 1 ? `${formData.equipamentosIds.length} Cargas` : 'Carga'}`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL EXCLUIR */}
      <ModalConfirmacao 
        isOpen={isModalDeleteOpen}
        title="Estornar Transferência"
        message="Deseja realmente cancelar este registro de transferência? O rádio retornará para a unidade de origem com status operacional."
        onConfirm={confirmDelete}
        onCancel={() => { setIsModalDeleteOpen(false); setIdToDelete(null); }}
      />
    </div>
  );
};

export default Transferencias;
