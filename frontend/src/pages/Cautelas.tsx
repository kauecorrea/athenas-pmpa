/**
 * @file Cautelas.tsx
 * @description Componente de Gerenciamento de Cautelas. Controla o empréstimo de rádios, incluindo formulários complexos M:N e a pesada lógica de geração de PDFs de Cautela e Termos de Responsabilidade usando jspdf e autotable.
 * Contém lógicas de controle de estado (useState), chamadas à API backend (Axios/useEffect)
 * e renderização de tabelas e modais.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
import { emitToast } from '../utils/toast';
import { CHEFIA_DITEL } from '../config/ditel';

interface Equipamento {
  id: string;
  idRadio?: string;
  rp: string;
  numSerie: string;
  marca: string;
  modelo: string;
  status: string;
  tipo?: string;
}

interface Militar {
  id: string;
  nome: string;
  rg: string;
  unidade?: {
    nome: string;
  };
  contato?: string;
  nomeGuerra?: string;
  posto?: string;
}


interface Cautela {
  id: string;
  dataRetirada: string;
  dataDevolucao: string | null;
  dataPrevista: string | null;
  missao: string | null;
  status: string;
  recebedorPosto?: string;
  recebedorRgPM?: string;
  recebedorNome?: string;
  recebedorGuerra?: string;
  recebedorContato?: string;
    recebedorUnidade?: string;
  numeroSequencial: number | null;
  observacao: string | null;
  observacaoDevolucao: string | null;
  tipoCautela?: string;
  militar: Militar | null;
  unidade: { nome: string } | null;
  equipamentos: Equipamento[];
}

const Cautelas: React.FC = () => {
  const [cautelas, setCautelas] = useState<Cautela[]>([]);
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [equipamentosDisponiveis, setEquipamentosDisponiveis] = useState<Equipamento[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState<'form' | 'list'>('form');
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');

  // Form state
  const [militarId, setMilitarId] = useState('');
  const [missao, setMissao] = useState('');
  const [tipoCautela, setTipoCautela] = useState('Provisória');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().slice(0, 16));
  const [dataPrevista, setDataPrevista] = useState('');
  const [radiosSelecionados, setRadiosSelecionados] = useState<string[]>([]);
  const [editingCautelaId, setEditingCautelaId] = useState<string | null>(null);

  const [recebedorPosto, setRecebedorPosto] = useState('');
  const [recebedorRgPM, setRecebedorRgPM] = useState('');
  const [recebedorNome, setRecebedorNome] = useState('');
  const [recebedorGuerra, setRecebedorGuerra] = useState('');
  const [recebedorContato, setRecebedorContato] = useState('');
  const [recebedorUnidade, setRecebedorUnidade] = useState('');
  const [observacao, setObservacao] = useState('');
  const [observacaoDevolucao, setObservacaoDevolucao] = useState('');

  const [buscaRadio, setBuscaRadio] = useState('');
  const [tipoBusca, setTipoBusca] = useState('RADIO');
  const [isRadioListOpen, setIsRadioListOpen] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<'7dias' | '30dias' | '6meses' | '1ano' | 'tudo'>('30dias');

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
      const [cautRes, milRes, eqRes, uniRes] = await Promise.all([
        axios.get('/api/cautelas'),
        axios.get('/api/militares'),
        axios.get('/api/equipamentos?status=OPERACIONAL'),
        axios.get('/api/unidades')
      ]);
      setCautelas(cautRes.data);
      setMilitares(milRes.data);
      setEquipamentosDisponiveis(eqRes.data);
      setUnidades(uniRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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

  const handleCriarCautela = async () => {
    if (!recebedorPosto || !recebedorRgPM || !recebedorGuerra || !recebedorContato) {
      emitToast("Por favor, preencha todos os campos obrigatórios do Militar Recebedor (*).", "error");
      return;
    }
    
    try {
      if (editingCautelaId) {
        await axios.put(`/api/cautelas/${editingCautelaId}`, {
          militarId,
          equipamentosIds: radiosSelecionados,
          missao,
          dataInicio,
          dataPrevista,
          recebedorPosto,
          recebedorRgPM,
          recebedorNome,
          recebedorGuerra,
          recebedorContato,
          recebedorUnidade,
          observacao,
          tipoCautela
        });
        emitToast("Cautela atualizada!", "success");
      } else {
        await axios.post('/api/cautelas', {
          militarId,
          equipamentosIds: radiosSelecionados,
          missao,
          dataInicio,
          dataPrevista,
          recebedorPosto,
          recebedorRgPM,
          recebedorNome,
          recebedorGuerra,
          recebedorContato,
          recebedorUnidade,
          observacao,
          tipoCautela
        });
        emitToast("Cautela registrada com sucesso!", "success");
      }
      resetForm();
      fetchData();
      setViewMode('list');
    } catch (e) {
      console.error(e);
      emitToast("Erro ao registrar cautela.", "error");
    }
  };

  const resetForm = () => {
    setMilitarId('');
    setMissao('');
    setTipoCautela('Provisória');
    setDataInicio(new Date().toISOString().slice(0, 16));
    setDataPrevista('');
    setRadiosSelecionados([]);
    setEditingCautelaId(null);
    setBuscaRadio('');
    setRecebedorPosto('');
    setRecebedorRgPM('');
    setRecebedorNome('');
    setRecebedorGuerra('');
    setRecebedorContato('');
    setRecebedorUnidade('');
    setObservacao('');
  };

  const confirmDevolver = async () => {
    if (!cautelaDevolverId) return;
    try {
      await axios.put(`/api/cautelas/${cautelaDevolverId}/devolver`, { observacaoDevolucao });
      setIsModalDevolverOpen(false);
      setCautelaDevolverId(null);
      setObservacaoDevolucao('');
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
    setTipoCautela(c.tipoCautela || 'Provisória');
    if (c.dataRetirada) {
      setDataInicio(new Date(c.dataRetirada).toISOString().slice(0, 16));
    }
    if (c.dataPrevista) {
      setDataPrevista(new Date(c.dataPrevista).toISOString().slice(0, 16));
    }
    setRecebedorPosto(c.recebedorPosto || '');
    setRecebedorRgPM(c.recebedorRgPM || '');
    setRecebedorNome(c.recebedorNome || '');
    setRecebedorGuerra(c.recebedorGuerra || '');
    setRecebedorContato(c.recebedorContato || '');
    setRecebedorUnidade(c.recebedorUnidade || '');
    setObservacao(c.observacao || '');
    setRadiosSelecionados(c.equipamentos.map(eq => eq.id));
    setViewMode('form');
  };

  const gerarComprovantePDF = async (c: Cautela) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.height;
    
    // 1. Brasões Institucionais
    try {
      const base64Para = await getBase64ImageFromUrl('/brasao_para.png');
      doc.addImage(base64Para, 'PNG', 14, 10, 20, 22);
      doc.setFontSize(6);
      doc.text("GOVERNO DO ESTADO", 24, 34, { align: "center" });
      doc.text("DO PARÁ", 24, 37, { align: "center" });
    } catch (e) { }
    
    try {
      const base64Pmpa = await getBase64ImageFromUrl('/brasao_pmpa.png');
      doc.addImage(base64Pmpa, 'PNG', 170, 10, 20, 22);
    } catch (e) { }

    // 2. Cabeçalho Oficial (Timbre)
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("GOVERNO DO ESTADO DO PARÁ", 105, 15, { align: "center" });
    doc.text("SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA E DEFESA SOCIAL", 105, 20, { align: "center" });
    doc.text("POLÍCIA MILITAR DO PARÁ", 105, 25, { align: "center" });
    doc.text("DEPARTAMENTO GERAL DE ADMINISTRAÇÃO", 105, 30, { align: "center" });
    doc.text("DIRETORIA DE TELEMÁTICA", 105, 35, { align: "center" });

    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(14, 42, pageWidth - 14, 42);

    // Título e Número
    doc.setFontSize(12);
    doc.text("TERMO DE RESPONSABILIDADE", 105, 52, { align: 'center' });
    doc.setLineWidth(0.2);
    doc.line(70, 53, 140, 53); // Underline

    const dataT = new Date(c.dataRetirada || new Date());
    const ano = dataT.getFullYear();
    const osFormatada = c.numeroSequencial ? `${c.numeroSequencial.toString().padStart(2, '0')}/${ano}` : `00/${ano}`;
    
    doc.setFontSize(11);
    doc.text(`Nº ${osFormatada}`, 105, 62, { align: 'center' });

    // Informações textuais (Esquerda)
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("ÓRGÃO: POLÍCIA MILITAR DO ESTADO DO PARÁ", 20, 75);
    doc.text(`UNIDADE (ORIGEM): DITEL/TELECOM`, 20, 81);
    
    const unidadeDestinoStr = (c.recebedorUnidade || c.unidade?.nome || c.militar?.unidade?.nome || '').toUpperCase();
    doc.text(`UNIDADE (DESTINO): - ${unidadeDestinoStr}`, 20, 87);
    
    let yBase = 93;
    if (c.observacao) {
      doc.text(`OBS: ${c.observacao.toUpperCase()}`, 20, yBase);
      yBase += 6;
    }
    doc.text(`SITUAÇÃO: CAUTELA ${c.tipoCautela?.toUpperCase() || 'PROVISÓRIA'}`, 20, yBase);

    // Tabela
    const tableData = c.equipamentos.map(eq => [
      eq.idRadio || eq.rp || '-',
      `${eq.marca || ''} ${eq.modelo || ''}`.trim() || 'RÁDIO COMUNICADOR',
      eq.numSerie
    ]);

    autoTable(doc, {
      startY: yBase + 12,
      head: [[{ content: 'RELAÇÃO DE EQUIPAMENTOS', colSpan: 3, styles: { halign: 'center', fillColor: [255, 255, 255], textColor: 0, fontStyle: 'bold' } }], ['Nº ORDEM', 'DESCRIÇÃO DO BEM', 'Nº DE SÉRIE']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { textColor: 0, halign: 'center' },
      styles: { fontSize: 9, cellPadding: 3, lineColor: [0, 0, 0], lineWidth: 0.2 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 50 }
      }
    });

    let finalY = (doc as any).lastAutoTable.finalY || 105;

    // Verificar se há espaço suficiente para as observações e o bloco de recebimento (aprox 75 pts)
    if (finalY + 80 > pageHeight - 20) {
      doc.addPage();
      finalY = 20;
    }

    // Observações Fixas / Dinâmicas
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    const obsText = "OBS: RÁDIO ACOMPANHA BATERIA, MICROFONE DE LAPELA E BASE CARREGADORA COM FONTE.";
    const splitObs = doc.splitTextToSize(obsText, pageWidth - 40);
    doc.text(splitObs, 20, finalY + 10);

    finalY += 10 + (splitObs.length * 4);

    // Termo de responsabilidade
    doc.setFont("helvetica", "normal");
    const responsabilidade = "Pelo presente termo assumo total e inteira responsabilidade pelo equipamento acima recebido, bem como, mantê-lo a salvo de perda, furto ou dano por má utilização, excetuado o desgaste natural de tempo e uso.";
    const splitResp = doc.splitTextToSize(responsabilidade, pageWidth - 40);
    doc.text(splitResp, 20, finalY + 5, { align: 'justify', maxWidth: pageWidth - 40 });

    finalY += 5 + (splitResp.length * 4) + 10;

    // Caixa de RECEBIMENTO
    doc.rect(14, finalY, pageWidth - 28, 55);
    doc.setFont("helvetica", "bold");
    doc.text("RECEBIMENTO", 105, finalY + 5, { align: 'center' });
    doc.line(14, finalY + 7, pageWidth - 14, finalY + 7); // Linha horizontal do recebimento
    doc.line(100, finalY + 7, 100, finalY + 55); // Linha vertical separadora

    // Coluna Esquerda (Origem - DITEL)
    doc.setFontSize(9);
    doc.text(`ÓRGÃO ou UNIDADE ORIGEM: TELECOM/DITEL`, 16, finalY + 13);
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    doc.setFont("helvetica", "normal");
    doc.text(`DATA: ${dataAtual}`, 16, finalY + 18);

    doc.setFontSize(8);
    doc.setFont("helvetica", "bolditalic");
    doc.text(CHEFIA_DITEL.assinaturaBase, 57, finalY + 48, { align: 'center' });
    doc.text(CHEFIA_DITEL.funcao, 57, finalY + 52, { align: 'center' });

    // Coluna Direita (Destino)
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`ÓRGÃO ou UNIDADE DESTINO: ${unidadeDestinoStr}`, 102, finalY + 13);
    doc.setFont("helvetica", "normal");
    doc.text(`DATA: ${dataAtual}`, 102, finalY + 18);

    doc.line(115, finalY + 46, 185, finalY + 46); // Linha assinatura centralizada
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    
    const nomeGuerraFormatado = (c.recebedorGuerra || c.recebedorNome || 'N/A').trim();
    const postoFormatado = (c.recebedorPosto || '').trim();
    const rgFormatado = (c.recebedorRgPM || '').trim();
    
    let sigLine1 = `${nomeGuerraFormatado}`;
    if (postoFormatado) sigLine1 += ` - ${postoFormatado}`;
    const sigLine2 = `RG: ${rgFormatado}`;
    
    if (sigLine1 && sigLine1 !== 'N/A') {
      doc.text(sigLine1, 150, finalY + 51, { align: 'center' });
      doc.text(sigLine2, 150, finalY + 55, { align: 'center' });
    } else {
      doc.text("RECEBEDOR", 150, finalY + 51, { align: 'center' });
    }

    // Rodapé (Endereço)
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Rod. Augusto Montenegro, Km 9, n°8401, Bairro Parque Guajará/Dist. de Icoaraci - Belém/PA.", 105, pageHeight - 15, { align: "center" });
    doc.text("CEP: 66821-000. Contato: (91) 3258-9818 / E-mail: ditelpmpa@gmail.com", 105, pageHeight - 10, { align: "center" });

    window.open(doc.output('bloburl'), '_blank');
  };

  const gerarRelatorioEstatistico = async () => {
    const doc = new jsPDF();
    
    // 1. Filtrar Cautelas
    const hoje = new Date();
    let dataLimite = new Date(0);
    let periodoTexto = "Todo o Histórico";

    if (reportPeriod === '7dias') {
      dataLimite = new Date();
      dataLimite.setDate(hoje.getDate() - 7);
      periodoTexto = "Últimos 7 Dias";
    } else if (reportPeriod === '30dias') {
      dataLimite = new Date();
      dataLimite.setDate(hoje.getDate() - 30);
      periodoTexto = "Últimos 30 Dias";
    } else if (reportPeriod === '6meses') {
      dataLimite = new Date();
      dataLimite.setMonth(hoje.getMonth() - 6);
      periodoTexto = "Últimos 6 Meses";
    } else if (reportPeriod === '1ano') {
      dataLimite = new Date();
      dataLimite.setFullYear(hoje.getFullYear() - 1);
      periodoTexto = "Últimos 365 Dias (1 Ano)";
    }

    const cautelasPeriodo = cautelas.filter(c => new Date(c.dataRetirada) >= dataLimite);

    // 2. Calcular Estatísticas
    const total = cautelasPeriodo.length;
    const ativas = cautelasPeriodo.filter(c => c.status === 'ATIVA');
    const devolvidas = cautelasPeriodo.filter(c => c.status === 'DEVOLVIDA');
    
    // Atrasadas: ATIVA e com dataPrevista < hoje
    const atrasadas = ativas.filter(c => c.dataPrevista && new Date(c.dataPrevista) < hoje);
    const taxaDevolucao = total > 0 ? Math.round((devolvidas.length / total) * 100) : 0;
    const totalEquips = cautelasPeriodo.reduce((acc, c) => acc + (c.equipamentos?.length || 0), 0);

    // 3. Montar PDF
    try {
      const base64Para = await getBase64ImageFromUrl('/brasao_para.png');
      doc.addImage(base64Para, 'PNG', 14, 10, 15, 17);
    } catch (e) { }
    
    try {
      const base64Pmpa = await getBase64ImageFromUrl('/brasao_pmpa.png');
      doc.addImage(base64Pmpa, 'PNG', 181, 10, 15, 17);
    } catch (e) { }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("POLÍCIA MILITAR DO PARÁ - DIRETORIA DE TELEMÁTICA", 105, 18, { align: "center" });
    doc.setFontSize(12);
    doc.text('RELATÓRIO ESTATÍSTICO DE CAUTELAS', 105, 26, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Período: ${periodoTexto}`, 105, 32, { align: 'center' });

    // Desenhar Resumo Estatístico
    doc.setDrawColor(200);
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(14, 40, 182, 35, 3, 3, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("RESUMO DO PERÍODO", 105, 46, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    // Linha 1 de Status
    doc.text(`Total de Cautelas: ${total}`, 20, 56);
    doc.text(`Cautelas Ativas: ${ativas.length}`, 80, 56);
    doc.text(`Cautelas Devolvidas: ${devolvidas.length}`, 140, 56);

    // Linha 2 de Status
    doc.setTextColor(220, 38, 38); // Vermelho
    doc.setFont("helvetica", "bold");
    doc.text(`Atrasadas (Vencidas): ${atrasadas.length}`, 20, 66);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.text(`Equipamentos Movimentados: ${totalEquips}`, 80, 66);
    doc.text(`Taxa de Devolução: ${taxaDevolucao}%`, 140, 66);

    // Tabela detalhada
    autoTable(doc, {
      startY: 85,
      head: [['Militar (Resp)', 'Recebedor', 'Unidade', 'Qtd', 'Retirada', 'Previsão', 'Status']],
      body: cautelasPeriodo.map(c => [
        c.militar ? `${c.militar.posto || ''} ${c.militar.nomeGuerra || c.militar.nome}`.trim() : 'RESERVA',
        c.recebedorPosto || c.recebedorGuerra ? `${c.recebedorPosto || ''} ${c.recebedorGuerra || c.recebedorNome || ''}`.trim() : '-',
        c.militar?.unidade?.nome || c.unidade?.nome || 'DITEL',
        c.equipamentos?.length || 0,
        new Date(c.dataRetirada).toLocaleDateString('pt-BR'),
        c.dataPrevista ? new Date(c.dataPrevista).toLocaleDateString('pt-BR') : '-',
        c.status
      ]),
      theme: 'striped',
      headStyles: { fillColor: [0, 51, 102] },
      styles: { fontSize: 8 }
    });

    window.open(doc.output('bloburl'), '_blank');
    setShowReportModal(false);
  };


  const radiosFiltrados = useMemo(() => {
    const termo = buscaRadio.toLowerCase();
    if (!termo) return [];

    return (equipamentosDisponiveis || []).filter(eq => (eq.tipo || 'RADIO') === tipoBusca)
      .filter(eq => 
        eq.status === 'OPERACIONAL' && (
          (eq.idRadio || '').toLowerCase().includes(termo) ||
          (eq.rp || '').toLowerCase().includes(termo) ||
          (eq.numSerie || '').toLowerCase().includes(termo) ||
          (eq.modelo || '').toLowerCase().includes(termo)
        )
      )
      .sort((a, b) => {
        const idA = (a.idRadio || '').toLowerCase();
        const idB = (b.idRadio || '').toLowerCase();
        const rpA = (a.rp || '').toLowerCase();
        const rpB = (b.rp || '').toLowerCase();
        const snA = (a.numSerie || '').toLowerCase();
        const snB = (b.numSerie || '').toLowerCase();

        // Prioridade 0: Match EXATO no idRadio (O "Nº" que o usuário quer)
        if (idA === termo && idB !== termo) return -1;
        if (idA !== termo && idB === termo) return 1;

        // Prioridade 1: Match EXATO no RP
        if (rpA === termo && rpB !== termo) return -1;
        if (rpA !== termo && rpB === termo) return 1;

        const aHasIdMatch = idA.includes(termo);
        const bHasIdMatch = idB.includes(termo);

        // Prioridade 2: Qualquer match no idRadio vem antes de outros
        if (aHasIdMatch && !bHasIdMatch) return -1;
        if (!aHasIdMatch && bHasIdMatch) return 1;

        const aHasRpMatch = rpA.includes(termo);
        const bHasRpMatch = rpB.includes(termo);

        // Prioridade 3: Match no RP
        if (aHasRpMatch && !bHasRpMatch) return -1;
        if (!aHasRpMatch && bHasRpMatch) return 1;

        // Prioridade 4: Match no SN
        const aHasSnMatch = snA.includes(termo);
        const bHasSnMatch = snB.includes(termo);
        if (aHasSnMatch && !bHasSnMatch) return -1;
        if (!aHasSnMatch && bHasSnMatch) return 1;
        
        return 0;
      });
  }, [equipamentosDisponiveis, buscaRadio]);

  const cautelasFiltradas = (cautelas || []).filter(c => {
    const matchesBusca = (c.militar?.nome || '').toLowerCase().includes(busca.toLowerCase()) || 
                         (c.militar?.rg || '').includes(busca) ||
                         (c.militar?.unidade?.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
                         (c.unidade?.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
                         (c.missao || '').toLowerCase().includes(busca.toLowerCase()) ||
                         (c.numeroSequencial ? `os-${c.numeroSequencial.toString().padStart(4, '0')}`.includes(busca.toLowerCase()) : false) ||
                         (c.numeroSequencial?.toString().includes(busca));
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
            onClick={() => setShowReportModal(true)}
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
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">OS / Número</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Responsável (Entrega)</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Recebedor</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Unidade</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Quantidade</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Data Início</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Data Retorno</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Missão</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Status</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#1f2937]">
              {loading ? (
                <tr><td colSpan={10} className="px-6 py-8 text-center animate-pulse">Carregando histórico...</td></tr>
              ) : cautelasFiltradas.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                      {c.numeroSequencial ? `OS-${c.numeroSequencial.toString().padStart(4, '0')}` : 'OS-0000'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white uppercase truncate max-w-[150px]">
                    {c.militar ? `${c.militar.posto || ''} ${c.militar.nomeGuerra || c.militar.nome}`.trim() : 'RESERVA'}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white uppercase truncate max-w-[150px]">
                    {c.recebedorPosto || c.recebedorGuerra ? `${c.recebedorPosto || ''} ${c.recebedorGuerra || c.recebedorNome || ''}`.trim() : '-'}
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
                  <td colSpan={10} className="px-6 py-10 text-center text-gray-500 italic">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Militar Responsável</label>
                  <div className="relative">
                    <select 
                      disabled={!!editingCautelaId}
                      className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                      value={militarId}
                      onChange={(e) => setMilitarId(e.target.value)}
                    >
                      <option value="" disabled>Selecione um militar</option>
                      {militares.map(m => (
                        <option key={m.id} value={m.id}>{m.rg} - {m.posto ? `${m.posto} ` : ''}{m.nome}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tipo de Cautela</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                      value={tipoCautela}
                      onChange={(e) => {
                        setTipoCautela(e.target.value);
                        if (e.target.value === 'Permanente') {
                          setDataPrevista('');
                        }
                      }}
                    >
                      <option value="Provisória">Provisória</option>
                      <option value="Permanente">Permanente</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Missão / Objetivo</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Operação Verão..." 
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
                    disabled={tipoCautela === 'Permanente'}
                    title={tipoCautela === 'Permanente' ? 'Cautelas permanentes não possuem previsão de retorno' : ''}
                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Observações (Início da Cautela)</label>
                <textarea 
                  placeholder="Se houver alguma avaria, pendência ou observação no momento da entrega, digite aqui..." 
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-all resize-none h-20"
                />
              </div>

              {/* Militar Recebedor */}
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-[#1f2937]">
                <h3 className="text-md font-bold text-gray-900 dark:text-white">Militar Recebedor</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Patente / Posto *</label>
                    <select
                      value={recebedorPosto}
                      onChange={(e) => setRecebedorPosto(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="">Selecione...</option>
                      <option value="SD PM">SD PM</option>
                      <option value="CB PM">CB PM</option>
                      <option value="3º SGT PM">3º SGT PM</option>
                      <option value="2º SGT PM">2º SGT PM</option>
                      <option value="1º SGT PM">1º SGT PM</option>
                      <option value="SUB TEN PM">SUB TEN PM</option>
                      <option value="2º TEN PM">2º TEN PM</option>
                      <option value="1º TEN PM">1º TEN PM</option>
                      <option value="CAP PM">CAP PM</option>
                      <option value="MAJ PM">MAJ PM</option>
                      <option value="TEN CEL PM">TEN CEL PM</option>
                      <option value="CEL PM">CEL PM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RG PM *</label>
                    <input
                      type="text"
                      placeholder="Ex: 12345"
                      value={recebedorRgPM}
                      onChange={(e) => setRecebedorRgPM(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                    <input
                      type="text"
                      placeholder="Opcional"
                      value={recebedorNome}
                      onChange={(e) => setRecebedorNome(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome de Guerra *</label>
                    <input
                      type="text"
                      placeholder=""
                      value={recebedorGuerra}
                      onChange={(e) => setRecebedorGuerra(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contato *</label>
                    <input
                      type="text"
                      placeholder="(91) 90000-0000"
                      value={recebedorContato}
                      onChange={(e) => setRecebedorContato(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unidade</label>
                    <select
                      value={recebedorUnidade}
                      onChange={(e) => setRecebedorUnidade(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="">Selecione...</option>
                      {unidades.map(u => (
                        <option key={u.id} value={u.nome}>{u.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Seleção de Equipamentos (Search & Add) */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rádios para Cautela</label>
                
                {!editingCautelaId && (
                <div className="relative">
                  <div className="flex gap-3">
                    <select 
                      value={tipoBusca} 
                      onChange={(e) => setTipoBusca(e.target.value)}
                      className="bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary text-gray-900 dark:text-white"
                    >
                      <option value="RADIO">Rádios</option>
                      <option value="DIVERSO">Equipamentos</option>
                    </select>
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Pesquisar por RP ou Série..." 
                        value={buscaRadio}
                        onChange={(e) => { setBuscaRadio(e.target.value); setIsRadioListOpen(true); }}
                        onFocus={() => setIsRadioListOpen(true)}
                        className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary text-gray-900 dark:text-white"
                      />
                    </div>
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
                              <span className="font-bold text-sm text-primary">Nº {eq.idRadio || '-'} {eq.rp ? `| RP: ${eq.rp}` : ''}</span>
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
                )}

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
                            {!editingCautelaId && (
                              <button 
                                onClick={() => setRadiosSelecionados(prev => prev.filter(i => i !== id))}
                                className="text-gray-400 hover:text-danger p-0.5 rounded-full hover:bg-danger/10 transition-colors"
                              >
                                <Plus size={14} className="rotate-45" />
                              </button>
                            )}
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

      {showReportModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/40 dark:bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-md shadow-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Gerar Relatório de Cautelas</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Selecione o período desejado para o relatório estatístico.
            </p>
            
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <input 
                  type="radio" 
                  name="reportPeriod" 
                  value="7dias"
                  checked={reportPeriod === '7dias'}
                  onChange={() => setReportPeriod('7dias')}
                  className="text-primary w-4 h-4 focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Últimos 7 dias</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <input 
                  type="radio" 
                  name="reportPeriod" 
                  value="30dias"
                  checked={reportPeriod === '30dias'}
                  onChange={() => setReportPeriod('30dias')}
                  className="text-primary w-4 h-4 focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Últimos 30 dias</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <input 
                  type="radio" 
                  name="reportPeriod" 
                  value="6meses"
                  checked={reportPeriod === '6meses'}
                  onChange={() => setReportPeriod('6meses')}
                  className="text-primary w-4 h-4 focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Últimos 6 Meses</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <input 
                  type="radio" 
                  name="reportPeriod" 
                  value="1ano"
                  checked={reportPeriod === '1ano'}
                  onChange={() => setReportPeriod('1ano')}
                  className="text-primary w-4 h-4 focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Últimos 365 Dias (1 ano)</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <input 
                  type="radio" 
                  name="reportPeriod" 
                  value="tudo"
                  checked={reportPeriod === 'tudo'}
                  onChange={() => setReportPeriod('tudo')}
                  className="text-primary w-4 h-4 focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Todo o Histórico</span>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={gerarRelatorioEstatistico}
                className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-blue-600 rounded-lg transition-colors shadow-lg shadow-blue-600/20"
              >
                Gerar PDF
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}      {isModalDevolverOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/40 dark:bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-lg shadow-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Registrar Devolução</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              Confirma o recebimento desta cautela? Todos os aparelhos vinculados a ela voltarão ao status OPERACIONAL livre na Reserva.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Observações Finais (Opcional)</label>
              <textarea 
                placeholder="Ex: Rádio devolvido com antena trincada, falta de presilha..." 
                value={observacaoDevolucao}
                onChange={(e) => setObservacaoDevolucao(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-all resize-none h-24"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setIsModalDevolverOpen(false); setCautelaDevolverId(null); setObservacaoDevolucao(''); }}
                className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDevolver}
                className="px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-lg shadow-green-600/20"
              >
                Confirmar Devolução
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <ModalConfirmacao 
        isOpen={isModalDeleteOpen}
        title="Exclusão de Histórico (Cautela)"
        message="CUIDADO: Você está deletando o B.O/TCO inteiro da cautela e seu rastro na base de estatísticas do patrimônio. Esta ação é estritamente em caso de erro na hora de formular a Cautela. Confirma exclusão?"
        onConfirm={confirmDelete}
        onCancel={() => { setIsModalDeleteOpen(false); setCautelaDeleteId(null); }}
      />
    </div>
  );
};

export default Cautelas;
