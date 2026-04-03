import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, FileText, Download, ChevronDown, CheckCircle, Edit2, Trash2 } from 'lucide-react';
import ModalConfirmacao from '../components/ModalConfirmacao';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface EquipamentoDisponivel {
  id: string;
  rp: string;
  numSerie: string;
  idRadio: string;
}

interface Militar {
  id: string;
  nome: string;
  posto: string;
  unidade: { nome: string };
}

interface Cautela {
  id: string;
  militar: { id: string; nome: string; posto: string; rg: string; contato: string; unidade: { nome: string } } | null;
  unidade: { nome: string } | null;
  equipamentos: EquipamentoDisponivel[];
  missao: string | null;
  dataRetirada: string;
  dataDevolucao: string | null;
  dataPrevista: string | null;
  status: string;
}

const Cautelas: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [buscaTratada, setBuscaTratada] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos - Status');
  
  const [radiosDisponiveis, setRadiosDisponiveis] = useState<EquipamentoDisponivel[]>([]);
  const [radiosSelecionados, setRadiosSelecionados] = useState<string[]>([]);
  const [buscaRadioModal, setBuscaRadioModal] = useState('');
  
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [cautelas, setCautelas] = useState<Cautela[]>([]);

  // Form states
  const [militarId, setMilitarId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataPrevista, setDataPrevista] = useState('');
  const [missao, setMissao] = useState('');
  
  // Edit State
  const [editingCautelaId, setEditingCautelaId] = useState<string | null>(null);

  // Modals de Confirmação
  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [cautelaDeleteId, setCautelaDeleteId] = useState<string | null>(null);
  
  const [isModalDevolverOpen, setIsModalDevolverOpen] = useState(false);
  const [cautelaDevolverId, setCautelaDevolverId] = useState<string | null>(null);

  // Initial Data Fetch
  useEffect(() => {
    fetchCautelas();
    fetchMilitares();
  }, []);

  // Fetch Available Radios when Modal Opens
  useEffect(() => {
    if (isModalOpen) {
      fetchEquipamentosOperacionais();
      setRadiosSelecionados([]);
      setBuscaRadioModal('');
      setMilitarId('');
      setDataInicio('');
      setDataPrevista('');
      setMissao('');
      setEditingCautelaId(null);
    }
  }, [isModalOpen]);

  const fetchCautelas = async () => {
    try {
      const res = await axios.get('/api/cautelas');
      setCautelas(res.data);
    } catch (error) {
      console.error("Erro ao buscar cautelas", error);
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

  const fetchEquipamentosOperacionais = async () => {
    try {
      const res = await axios.get('/api/equipamentos');
      const operacionais = res.data.filter((eq: any) => eq.status === 'OPERACIONAL');
      setRadiosDisponiveis(operacionais);
    } catch (error) {
      console.error("Erro ao buscar equipamentos operacionais", error);
    }
  };

  const toggleRadioSelection = (id: string) => {
    if (radiosSelecionados.includes(id)) {
      setRadiosSelecionados(radiosSelecionados.filter(selectedId => selectedId !== id));
    } else {
      setRadiosSelecionados([...radiosSelecionados, id]);
    }
  };

  const handleCriarCautela = async () => {
    if (radiosSelecionados.length === 0 || !militarId) {
      alert("Selecione um militar e pelo menos um rádio.");
      return;
    }

    try {
      if (editingCautelaId) {
        await axios.put(`/api/cautelas/${editingCautelaId}`, {
          missao,
          dataInicio: dataInicio ? new Date(dataInicio).toISOString() : undefined,
          dataPrevista: dataPrevista ? new Date(dataPrevista).toISOString() : null
        });
      } else {
        await axios.post('/api/cautelas', {
          equipamentosIds: radiosSelecionados,
          militarId: militarId,
          missao,
          dataInicio: dataInicio ? new Date(dataInicio).toISOString() : undefined,
          dataPrevista: dataPrevista ? new Date(dataPrevista).toISOString() : null
        });
      }
      setIsModalOpen(false);
      fetchCautelas(); // Refresh table
    } catch (error) {
      console.error("Erro ao salvar cautela:", error);
      alert("Ocorreu um erro ao processar a requisição.");
    }
  };

  const handleEdit = (c: Cautela) => {
    setEditingCautelaId(c.id);
    setMilitarId(c.militar ? String(c.militar.id) : '');
    setMissao(c.missao || '');
    setDataInicio(c.dataRetirada ? new Date(c.dataRetirada).toISOString().split('T')[0] : '');
    setDataPrevista(c.dataPrevista ? new Date(c.dataPrevista).toISOString().split('T')[0] : '');
    setRadiosSelecionados(c.equipamentos.map(e => e.id));
    // Forçamos abrir a tela pra edição (apenas dados de missão e data podem ser mudados por padrao de segurança, ou injetar todos. Dependerá da visão do usuario, aqui forçaremos visual base).
    setIsModalOpen(true);
  };

  const openDeleteModal = (id: string) => {
    setCautelaDeleteId(id);
    setIsModalDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!cautelaDeleteId) return;
    try {
      await axios.delete(`/api/cautelas/${cautelaDeleteId}`);
      fetchCautelas(); // Refresh table
    } catch (error) {
      console.error("Erro ao excluir:", error);
    } finally {
      setIsModalDeleteOpen(false);
      setCautelaDeleteId(null);
    }
  };

  const openDevolverModal = (id: string) => {
    setCautelaDevolverId(id);
    setIsModalDevolverOpen(true);
  };

  const confirmDevolver = async () => {
    if (!cautelaDevolverId) return;
    try {
      await axios.put(`/api/cautelas/${cautelaDevolverId}/devolver`);
      fetchCautelas(); // Refresh table
    } catch (error) {
      console.error("Erro ao devolver:", error);
    } finally {
      setIsModalDevolverOpen(false);
      setCautelaDevolverId(null);
    }
  };

  // Filtragem local
  const cautelasFiltradas = cautelas.filter(c => {
    const termo = buscaTratada.toLowerCase();
    const nome = c.militar?.nome?.toLowerCase() || '';
    const unidade = c.unidade?.nome?.toLowerCase() || c.militar?.unidade?.nome?.toLowerCase() || '';
    const rpList = c.equipamentos?.map(e => e.rp).join(' ') || '';
    const missaoDesc = c.missao?.toLowerCase() || '';
    
    const matchBusca = nome.includes(termo) || unidade.includes(termo) || rpList.includes(termo) || missaoDesc.includes(termo);
    
    if (filtroStatus === 'Todos - Status') return matchBusca;
    if (filtroStatus === 'Ativa') return matchBusca && c.status === 'ATIVA';
    if (filtroStatus === 'Devolvida') return matchBusca && c.status === 'DEVOLVIDA';
    if (filtroStatus === 'Vencida') return matchBusca && c.status === 'VENCIDA';
    
    return matchBusca;
  });

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

  const gerarRelatorioPdf = async () => {
    const doc = new jsPDF();

    try {
      const base64Para = await getBase64ImageFromUrl('/brasao_para.png');
      doc.addImage(base64Para, 'PNG', 14, 10, 20, 22);
    } catch (e) { console.error('Sem brasao_para.png no public'); }
    
    try {
      const base64Pmpa = await getBase64ImageFromUrl('/brasao_pmpa.png');
      doc.addImage(base64Pmpa, 'PNG', 176, 10, 20, 22);
    } catch (e) { console.error('Sem brasao_pmpa.png no public'); }

    // 2. Pegar as últimas 30 cautelas cadastradas
    const ultimas30 = [...cautelasFiltradas].slice(0, 30);
    
    // Contadores
    const qtdAtivas = ultimas30.filter(c => c.status === 'ATIVA').length;
    const qtdDevolvidas = ultimas30.filter(c => c.status === 'DEVOLVIDA').length;

    // 3. Cabeçalho Principal (Título)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("RELATÓRIO DE CAUTELAS", 105, 18, { align: "center" });
    
    // Subtítulo (Gerado em)
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const dataHora = new Date().toLocaleString('pt-BR');
    doc.text(`Gerado em: ${dataHora}`, 105, 25, { align: "center" });

    // Linha divisória
    doc.setLineWidth(0.5);
    doc.line(14, 34, 196, 34);

    // 4. Estatísticas Resumidas
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Total de Cautelas: ${ultimas30.length}`, 14, 44);
    doc.text(`Cautelas Ativas: ${qtdAtivas}`, 14, 50);
    doc.text(`Cautelas Devolvidas: ${qtdDevolvidas}`, 14, 56);

    // 5. Montar a Tabela
    const dataTabela = ultimas30.map(c => {
      const nomeApresentacao = c.militar ? `${c.militar.nome}` : '-';
      const statusFinal = c.status === 'ATIVA' ? 'Ativa' : (c.status === 'DEVOLVIDA' ? 'Devolvida' : 'Vencida');
      const dataInicio = new Date(c.dataRetirada).toLocaleDateString('pt-BR');

      return [nomeApresentacao, c.unidade?.nome || c.militar?.unidade?.nome || '-', String(c.equipamentos?.length || 0), statusFinal, dataInicio];
    });

    autoTable(doc, {
      startY: 65,
      head: [['Militar', 'Unidade', 'Quantidade', 'Status', 'Data Início']],
      body: dataTabela,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fontStyle: 'bold',
        textColor: [0, 0, 0],
        lineWidth: { bottom: 0.5 },
        lineColor: [0, 0, 0],
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255]
      }
    });

    // 6. Fazer Download Automático
    doc.save('Relatorio_Cautelas_PMPA.pdf');
  };

  const gerarReciboIndividual = async (c: Cautela) => {
    const doc = new jsPDF();
    
    try {
      const base64Para = await getBase64ImageFromUrl('/brasao_para.png');
      doc.addImage(base64Para, 'PNG', 14, 10, 20, 22);
    } catch (e) { console.error('Sem brasao_para.png'); }
    
    try {
      const base64Pmpa = await getBase64ImageFromUrl('/brasao_pmpa.png');
      doc.addImage(base64Pmpa, 'PNG', 176, 10, 20, 22);
    } catch (e) { console.error('Sem brasao_pmpa.png'); }

    // Título Geral e Timbre Fake
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("GOVERNO DO ESTADO DO PARÁ", 105, 15, { align: "center" });
    doc.text("SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA E DEFESA SOCIAL", 105, 20, { align: "center" });
    doc.text("POLÍCIA MILITAR DO PARÁ", 105, 25, { align: "center" });
    doc.text("DEPARTAMENTO GERAL DE ADMINISTRAÇÃO", 105, 30, { align: "center" });
    doc.text("DIRETORIA DE TELEMÁTICA", 105, 35, { align: "center" });

    doc.setFontSize(12);
    doc.text(`CAUTELA N° ${String(c.id).padStart(5, '0')}`, 105, 50, { align: "center" });
    if (c.missao) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Missão: ${c.missao}`, 105, 56, { align: "center" });
    }

    // Tabela individual de Rádios com Autotable
    const radiosTabela = c.equipamentos.map((eq, index) => {
      return [
        index + 1,
        eq.numSerie + " / " + eq.rp,
        c.militar ? `${c.militar.posto} ${c.militar.nome}` : '',
        c.militar?.rg || '',
        c.militar?.contato || '',
        ''
      ];
    });

    autoTable(doc, {
      startY: 65,
      head: [['Nº', 'Nº DE SÉRIE / RP', 'RESPONSÁVEL', 'RG', 'CONTATO', 'ASSINATURA']],
      body: radiosTabela,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fontStyle: 'bold', lineWidth: { bottom: 0.5 }, lineColor: [0, 0, 0] },
      columnStyles: {
        5: { cellWidth: 40 } // Espaço maior para assinatura da linha
      },
      didDrawCell: (data) => {
        // Desenha uma linha na coluna de assinatura no corpo da tabela
        if (data.section === 'body' && data.column.index === 5) {
          doc.setLineWidth(0.1);
          doc.line(data.cell.x + 2, data.cell.y + data.cell.height - 3, data.cell.x + data.cell.width - 2, data.cell.y + data.cell.height - 3);
        }
      }
    });

    // Rodapé de Informações ("ACOMPANHA")
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFont("helvetica", "bold");
    doc.text("ACOMPANHA:", 14, finalY);
    doc.setFont("helvetica", "normal");
    doc.text(`- ${c.equipamentos.length} RÁDIOS HT`, 20, finalY + 7);
    doc.text("- TODOS OS RÁDIOS ESTÃO COM PRESILHA PARA CINTO, PROTETOR LATERAL, BATERIA E ANTENA.", 20, finalY + 14);

    // Assinatura Final
    const dateHoje = new Date().toLocaleDateString('pt-BR');
    doc.text(`Belém PA, ${dateHoje}`, 14, finalY + 60);

    doc.line(110, finalY + 60, 196, finalY + 60);
    doc.setFontSize(9);
    doc.text("ASSINATURA DO MILITAR RESPONSÁVEL", 153, finalY + 65, { align: "center" });

    // Endereço Padrão (Rodapé absoluto, mas fixo para PMPA)
    doc.setFontSize(8);
    doc.text("Rod. Augusto Montenegro, Km 9, n°8401, Bairro Parque Guajará/Dist. de Icoaraci - Belém/PA.", 105, 280, { align: "center" });
    doc.text("CEP: 66821-000. Contato: (91) 3258-9818 / E-mail: citel@pm.pa.gov.br", 105, 285, { align: "center" });

    doc.save(`Cautela_${String(c.id).padStart(5, '0')}.pdf`);
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
             Cautelas
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gerenciamento de empréstimos e devoluções</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={gerarRelatorioPdf}
            className="flex items-center gap-2 bg-gray-100 dark:bg-surface border border-gray-300 dark:border-[#374151] hover:bg-gray-200 dark:hover:bg-[#1f2937] text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
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
              placeholder="Buscar por militar, unidade, rádio (RP)..." 
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
        
        {/* TABLE CONTENT - Responsivo */}
        <div className="flex-1 overflow-auto overflow-x-auto scrolling-touch z-0">
          <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300 min-w-[1000px]">
            <thead className="bg-gray-50 dark:bg-[#0b101a] text-gray-500 dark:text-gray-400 font-medium text-xs sticky top-0 z-0">
              <tr>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Militar</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Unidade</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937] text-center">Quantidade</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Data Inicio</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Data Retorno</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Missão</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Status</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1f2937]">
              {cautelasFiltradas.length > 0 ? cautelasFiltradas.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2937]/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                    {c.militar ? `${c.militar.posto} ${c.militar.nome}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                    {c.militar?.unidade?.nome || c.unidade?.nome || '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-medium text-center">
                    {c.equipamentos?.length || 0}
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                    {new Date(c.dataRetirada).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                    {c.dataDevolucao ? new Date(c.dataDevolucao).toLocaleDateString('pt-BR') : (c.dataPrevista ? new Date(c.dataPrevista).toLocaleDateString('pt-BR') : '-')}
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300 max-w-[200px] truncate" title={c.missao || ''}>
                    {c.missao || '-'}
                  </td>
                  <td className="px-6 py-4">
                    {c.status === 'ATIVA' && (
                      <span className="px-2.5 py-1 text-[11px] font-bold text-success bg-success/10 border border-success/20 rounded-full lowercase tracking-wider">
                        Ativa
                      </span>
                    )}
                    {c.status === 'DEVOLVIDA' && (
                      <span className="px-2.5 py-1 text-[11px] font-bold text-danger bg-danger/10 border border-danger/20 rounded-full lowercase tracking-wider">
                        Devolvida
                      </span>
                    )}
                    {c.status === 'VENCIDA' && (
                      <span className="px-2.5 py-1 text-[11px] font-bold text-warning bg-warning/10 border border-warning/20 rounded-full lowercase tracking-wider">
                        Vencida
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 text-gray-400 dark:text-gray-500">
                      <button onClick={() => gerarReciboIndividual(c)} className="hover:text-gray-900 dark:hover:text-white p-1.5 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-white/5" title="Gerar Recibo Oficial (PDF)">
                        <FileText size={16} />
                      </button>
                      <button onClick={() => handleEdit(c)} className="hover:text-primary dark:hover:text-primary p-1.5 rounded-lg transition-colors hover:bg-blue-50 dark:hover:bg-blue-500/10" title="Editar Informações da Cautela">
                        <Edit2 size={16} />
                      </button>
                      {c.status === 'ATIVA' && (
                        <button 
                          onClick={() => openDevolverModal(c.id)}
                          className="hover:text-success dark:hover:text-success p-1.5 rounded-lg transition-colors hover:bg-success/10" 
                          title="Registrar Devolução"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      <button onClick={() => openDeleteModal(c.id)} className="hover:text-danger dark:hover:text-danger p-1.5 rounded-lg transition-colors hover:bg-danger/10" title="Excluir Lote Definitivamente">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Nenhuma cautela encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl w-full max-w-[600px] shadow-2xl flex flex-col my-auto max-h-[95vh]">
            <div className="p-6 border-b border-gray-200 dark:border-[#1f2937] flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nova Cautela</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Selecione o militar e os equipamentos</p>
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
                    value={militarId}
                    onChange={(e) => setMilitarId(e.target.value)}
                  >
                    <option value="" disabled>Selecione um militar</option>
                    {militares.map(m => (
                      <option key={m.id} value={m.id}>{m.posto} {m.nome} - {m.unidade?.nome || ''}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                </div>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Data de Início</label>
                  <div className="relative">
                    <input 
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Data de Retorno</label>
                  <div className="relative">
                    <input 
                      type="date"
                      value={dataPrevista}
                      onChange={(e) => setDataPrevista(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Missão */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Missão (Opcional)</label>
                <textarea 
                  rows={3}
                  value={missao}
                  onChange={(e) => setMissao(e.target.value)}
                  placeholder="Descreva a finalidade ou a missão que motivou o empréstimo..."
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                />
              </div>

              {/* Rádios Disponíveis Component */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex justify-between items-center">
                  <span>Rádios Disponíveis para Empréstimo</span>
                </label>
                <div className="border border-gray-300 dark:border-[#374151] bg-gray-50 dark:bg-[#111827] rounded-lg overflow-hidden flex flex-col">
                  {/* Search bar inside block */}
                  <div className="p-2 border-b border-gray-200 dark:border-[#374151] bg-white dark:bg-[#1f2937]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input 
                        type="text"
                        placeholder="Buscar rádio (Série, RP, ID)..."
                        value={buscaRadioModal}
                        onChange={e => setBuscaRadioModal(e.target.value)}
                        className="w-full bg-transparent text-sm text-gray-900 dark:text-white pl-9 pr-3 py-1.5 focus:outline-none placeholder-gray-400"
                      />
                    </div>
                  </div>
                  {/* List of checkboxes */}
                  <div className="max-h-48 overflow-y-auto p-4 space-y-3">
                    {radiosDisponiveisFiltrados.length === 0 ? (
                      <p className="text-sm text-gray-500 italic text-center py-2">Nenhum rádio encontrado.</p>
                    ) : (
                      radiosDisponiveisFiltrados.map((radio) => (
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
                          <span className="text-sm text-gray-700 dark:text-gray-300 select-none font-medium text-left">
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
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] rounded-lg transition-colors border border-transparent dark:border-[#374151]"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCriarCautela}
                disabled={radiosSelecionados.length === 0 || !militarId}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-blue-600 rounded-lg transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingCautelaId ? 'Salvar Edições' : 'Criar Cautela'}
              </button>
            </div>
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
