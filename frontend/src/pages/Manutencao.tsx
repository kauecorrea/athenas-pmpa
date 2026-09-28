/**
 * @file Manutencao.tsx
 * @description Componente de Gestão de Oficina/Manutenção. Lida com o fluxo de envio de equipamentos quebrados, laudos técnicos, orçamentos e devolução, com opção de impressão de Ordens de Serviço (OS).
 * Contém lógicas de controle de estado (useState), chamadas à API backend (Axios/useEffect)
 * e renderização de tabelas e modais.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Plus, Wrench, FileText, CheckCircle, Search, List, Edit3, Trash2, Check, ClipboardCheck } from 'lucide-react';
import ModalConfirmacao from '../components/ModalConfirmacao';
import jsPDF from 'jspdf';
import { CHEFIA_DITEL } from '../config/ditel';

interface ManutencaoRecord {
  id: string;
  numeroSequencial: number | null;
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
  dataEnvioUnidade: string | null;
  dataConclusao: string | null;
  status: string;
  analiseTecnica: string | null;
  laudoTecnico: string | null;
  tecnicoResp: string | null;
  solicitante: string | null;
    pae: string | null;
  tipoManutencao: string;
  unidadeId: string | null;
  unidade: { id: string; nome: string } | null;
  documentoOrigem: string | null;
  documentoSaidaEmpresa: string | null;
  documentoEntregaUnidade: string | null;
  tecnicoId: string | null;
  tecnico: { id: string; nome: string; rg: string; posto?: string | null } | null;
}

interface EquipamentoDisponivel {
  id: string;
  rp: string;
  numSerie: string;
  idRadio: string;
  tipo?: string;
}

const Manutencao: React.FC = () => {
  const [viewMode, setViewMode] = useState<'form' | 'list'>('list');
  const [radiosDisponiveis, setRadiosDisponiveis] = useState<EquipamentoDisponivel[]>([]);
  const [manutencoes, setManutencoes] = useState<ManutencaoRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalConcluirOpen, setIsModalConcluirOpen] = useState(false);
  const [manutencaoConcluirId, setManutencaoConcluirId] = useState<string | null>(null);
  const [statusDestino, setStatusDestino] = useState<'OPERACIONAL' | 'BAIXADO'>('OPERACIONAL');

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
  const [dataEnvioUnidade, setDataEnvioUnidade] = useState('');
  const [analiseTecnica, setAnaliseTecnica] = useState('');
  const [laudoTecnico, setLaudoTecnico] = useState('');
  const [tecnicoResp, setTecnicoResp] = useState('');
  const [solicitante, setSolicitante] = useState('');
  const [buscaRadioModal, setBuscaRadioModal] = useState('');
  const [tipoBusca, setTipoBusca] = useState('RADIO');

  const [tipoManutencao, setTipoManutencao] = useState<'Externa' | 'Interna'>('Externa');
  const [unidadeId, setUnidadeId] = useState('');
  const [documentoOrigem, setDocumentoOrigem] = useState('');
  const [documentoSaidaEmpresa, setDocumentoSaidaEmpresa] = useState('');
  const [documentoEntregaUnidade, setDocumentoEntregaUnidade] = useState('');
  const [pae, setPae] = useState('');
  const [tecnicoId, setTecnicoId] = useState('');
  const [unidades, setUnidades] = useState<{id: string, nome: string}[]>([]);
  const [militares, setMilitares] = useState<{id: string, nome: string, rg: string, posto?: string | null}[]>([]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchManutencoes();
    fetchUnidadesAndMilitares();
  }, []);

  const fetchUnidadesAndMilitares = async () => {
    try {
      const [uniRes, milRes] = await Promise.all([
        axios.get('/api/unidades'),
        axios.get('/api/militares')
      ]);
      setUnidades(uniRes.data);
      setMilitares(milRes.data);
    } catch (error) {
      console.error("Erro ao buscar unidades e militares", error);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const disponiveis = res.data.filter((eq: Record<string, unknown>) => eq.status !== 'MANUTENCAO' && eq.status !== 'EXTRAVIADO');
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
          previsaoRetorno: previsaoRetorno ? new Date(previsaoRetorno).toISOString() : null,
          dataEnvioUnidade: dataEnvioUnidade ? new Date(dataEnvioUnidade).toISOString() : null,
          analiseTecnica,
          laudoTecnico,
          tecnicoResp,
          solicitante,
          tipoManutencao,
          unidadeId,
          documentoOrigem,
          documentoSaidaEmpresa,
          documentoEntregaUnidade,
          pae,
          tecnicoId
        });
        alert("Registro de manutenção atualizado!");
      } else {
        await axios.post('/api/manutencoes', {
          equipamentoIds: equipamentosSelecionados,
          problema,
          dataEntrada: dataEntrada ? new Date(dataEntrada).toISOString() : new Date().toISOString(),
          dataChegadaDitel: dataChegadaDitel ? new Date(dataChegadaDitel).toISOString() : null,
          dataSaidaEmpresa: dataSaidaEmpresa ? new Date(dataSaidaEmpresa).toISOString() : null,
          previsaoRetorno: previsaoRetorno ? new Date(previsaoRetorno).toISOString() : null,
          dataEnvioUnidade: dataEnvioUnidade ? new Date(dataEnvioUnidade).toISOString() : null,
          tipoManutencao,
          unidadeId,
          documentoOrigem,
          documentoSaidaEmpresa,
          documentoEntregaUnidade,
          pae,
          tecnicoId,
          analiseTecnica,
          laudoTecnico,
          solicitante
        });
        alert("Registro de manutenção incluído!");
      }
      resetForm();
      fetchManutencoes();
      setViewMode('list');
    } catch (error) {
      console.error("Erro ao salvar manutenção", error);
      alert("Erro ao salvar manutenção! Detalhes: " + ((error as any).response?.data?.details || (error as any).response?.data?.error || (error as any).message));
    }
  };

  const resetForm = () => {
    setEquipamentosSelecionados([]);
    setProblema('');
    setDataEntrada(new Date().toISOString().split('T')[0]);
    setDataChegadaDitel('');
    setDataSaidaEmpresa('');
    setPrevisaoRetorno('');
    setDataEnvioUnidade('');
    setAnaliseTecnica('');
    setLaudoTecnico('');
    setTecnicoResp('');
    setSolicitante('');
    setTipoManutencao('Externa');
    setUnidadeId('');
    setDocumentoOrigem('');
    setDocumentoSaidaEmpresa('');
    setDocumentoEntregaUnidade('');
    setPae('');
    setTecnicoId('');
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
    setDataEnvioUnidade(m.dataEnvioUnidade ? m.dataEnvioUnidade.split('T')[0] : '');
    setAnaliseTecnica(m.analiseTecnica || '');
    setLaudoTecnico(m.laudoTecnico || '');
    setTecnicoResp(m.tecnicoResp || '');
    setSolicitante(m.solicitante || '');
    setTipoManutencao((m.tipoManutencao as 'Externa' | 'Interna') || 'Externa');
    setUnidadeId(m.unidadeId || '');
    setDocumentoOrigem(m.documentoOrigem || '');
    setDocumentoSaidaEmpresa(m.documentoSaidaEmpresa || '');
    setDocumentoEntregaUnidade(m.documentoEntregaUnidade || '');
    setPae(m.pae || '');
    setTecnicoId(m.tecnicoId || '');
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
      await axios.put(`/api/manutencoes/${manutencaoConcluirId}/concluir`, { statusDestino });
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
    } catch (_err) { console.error('Sem brasao_para.png'); }
    
    try {
      const base64Pmpa = await getBase64ImageFromUrl('/brasao_pmpa.png');
      doc.addImage(base64Pmpa, 'PNG', 176, 10, 20, 22);
    } catch (_err) { console.error('Sem brasao_pmpa.png'); }

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
    doc.text(`Chegada ao DITEL: ${m.dataChegadaDitel ? new Date(m.dataChegadaDitel).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A'}`, 14, yDatas);
    doc.text(`Saída para Empresa: ${m.dataSaidaEmpresa ? new Date(m.dataSaidaEmpresa).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A'}`, 105, yDatas);
    
    doc.text(`Previsão de Retorno: ${m.previsaoRetorno ? new Date(m.previsaoRetorno).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A'}`, 14, yDatas + 6);
    doc.text(`Envio à Unidade: ${m.dataEnvioUnidade ? new Date(m.dataEnvioUnidade).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A'}`, 105, yDatas + 6);

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

  const gerarLaudoPdf = async (m: ManutencaoRecord) => {
    const doc = new jsPDF();
    
    const drawVia = async (offsetY: number) => {
      try {
        const base64Para = await getBase64ImageFromUrl('/brasao_para.png');
        doc.addImage(base64Para, 'PNG', 14, 10 + offsetY, 20, 22);
      } catch (_err) { }
      try {
        const base64Pmpa = await getBase64ImageFromUrl('/brasao_pmpa.png');
        doc.addImage(base64Pmpa, 'PNG', 176, 10 + offsetY, 20, 22);
      } catch (_err) { }

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("GOVERNO DO ESTADO DO PARÁ", 105, 12 + offsetY, { align: "center" });
      doc.text("SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA E DEFESA SOCIAL", 105, 16 + offsetY, { align: "center" });
      doc.text("POLÍCIA MILITAR DO PARÁ", 105, 20 + offsetY, { align: "center" });
      doc.text("DEPARTAMENTO GERAL DE ADMINISTRAÇÃO", 105, 24 + offsetY, { align: "center" });
      doc.text("DIRETORIA DE TELEMÁTICA", 105, 28 + offsetY, { align: "center" });

      doc.setFontSize(14);
      doc.text("RELATÓRIO DE LAUDO TÉCNICO", 105, 35 + offsetY, { align: "center" });
      
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(14, 38 + offsetY, 196, 38 + offsetY);

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      const osFormatada = m.numeroSequencial ? `OS-${m.numeroSequencial.toString().padStart(4, '0')}` : `OS: ${m.id.substring(0,6).toUpperCase()}`;
      doc.text(osFormatada, 14, 43 + offsetY);
      doc.text(`Suporte:`, 60, 43 + offsetY);
      doc.text(`Telecom: ${m.equipamento.marca || ''} ${m.equipamento.modelo || ''}`, 130, 43 + offsetY);

      doc.line(14, 45 + offsetY, 196, 45 + offsetY);

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("UNIDADE", 14, 50 + offsetY);
      doc.text("Nº PAE", 40, 50 + offsetY);
      doc.text("RP/PM", 75, 50 + offsetY);
      doc.text("Nº SÉRIE", 105, 50 + offsetY);
      doc.text("SOLICITANTE", 140, 50 + offsetY);
      doc.text("DATA ENTRADA", 175, 50 + offsetY);

      doc.setFont("helvetica", "normal");
      doc.text("DITEL", 14, 55 + offsetY);
      doc.text(m.pae || "-", 40, 55 + offsetY);
      doc.text(m.equipamento.rp || "-", 75, 55 + offsetY);
      doc.text(m.equipamento.numSerie || "-", 105, 55 + offsetY);
      doc.text(m.solicitante || "-", 140, 55 + offsetY);
      doc.text(new Date(m.dataEntrada).toLocaleDateString('pt-BR'), 175, 55 + offsetY);

      doc.setFont("helvetica", "bold");
      doc.text("DEFEITO RECLAMADO:", 14, 62 + offsetY);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(m.problema || "-", 182), 14, 67 + offsetY);

      doc.setFont("helvetica", "bold");
      doc.text("ANÁLISE TÉCNICA:", 14, 78 + offsetY);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(m.analiseTecnica || "Sob análise.", 182), 14, 83 + offsetY);

      doc.setFont("helvetica", "bold");
      doc.text("LAUDO TÉCNICO:", 14, 94 + offsetY);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(m.laudoTecnico || "-", 182), 14, 99 + offsetY);

      doc.setFont("helvetica", "bold");
      const outDate = m.dataConclusao || m.dataSaidaEmpresa || new Date().toISOString();
      doc.text(`DATA DE SAÍDA: ${new Date(outDate).toLocaleDateString('pt-BR')}`, 14, 114 + offsetY);
      const postoTecnico = m.tecnico?.posto ? m.tecnico.posto + ' ' : '';
      doc.text(`TÉCNICO RESP: ${m.tecnico?.nome ? postoTecnico + m.tecnico.nome : m.tecnicoResp || '-'}`, 130, 114 + offsetY);

      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text('"A Diretoria de Telemática não possui peças de reposição ou suprimento para aquisição destas peças informadas"', 105, 120 + offsetY, { align: "center" });

      doc.setDrawColor(0, 0, 0);
      doc.line(20, 131 + offsetY, 95, 131 + offsetY);
      doc.line(115, 131 + offsetY, 190, 131 + offsetY);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text(CHEFIA_DITEL.assinaturaBase, 57.5, 134 + offsetY, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.text("RESPONDENDO PELAS SEÇÕES DE TELECOMUNICAÇÃO E SUPORTE AO USUÁRIO", 57.5, 137 + offsetY, { align: "center" });
      
      doc.setFont("helvetica", "bold");
      doc.text("RECEBEDOR DO EQUIPAMENTO", 152.5, 134 + offsetY, { align: "center" });
    };

    await drawVia(0);
    
    // Linha tracejada para corte
    doc.setDrawColor(150, 150, 150);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(10, 148, 200, 148);
    doc.setLineDashPattern([], 0); // reset
    
    await drawVia(148);

    window.open(doc.output('bloburl'), '_blank');
  };

  const radiosDisponiveisFiltrados = useMemo(() => {
    return radiosDisponiveis.filter(radio => {
      if ((radio.tipo || 'RADIO') !== tipoBusca) return false;
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
          <div className="flex flex-col border-b border-gray-200 dark:border-[#1f2937]">
            <div className="p-6 pb-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {editingId ? <Edit3 className="text-primary" size={24} /> : <Plus className="text-primary" size={24} />}
                {editingId ? 'Visualização e Edição de Registro' : 'Registrar Entrada na Oficina'}
              </h2>
            </div>

          </div>
          
          <form onSubmit={handleCreateManutencao} className="p-8 overflow-y-auto flex-1 flex flex-col">
            <div className="flex gap-4 mb-8">
              <button 
                type="button" 
                onClick={() => setTipoManutencao('Externa')} 
                className={`flex-1 py-4 font-bold text-lg rounded-xl border-2 transition-all ${tipoManutencao === 'Externa' ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-500 hover:border-primary/50'}`}
              >
                🏢 Manutenção Externa (Empresa)
              </button>
              <button 
                type="button" 
                onClick={() => setTipoManutencao('Interna')} 
                className={`flex-1 py-4 font-bold text-lg rounded-xl border-2 transition-all ${tipoManutencao === 'Interna' ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-500 hover:border-primary/50'}`}
              >
                🛠️ Manutenção Interna (DITEL)
              </button>
            </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
              
              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">1. Selecionar Equipamento</label>
                <div className={`border border-gray-300 dark:border-[#374151] bg-gray-50 dark:bg-[#0b101a] rounded-xl overflow-hidden flex flex-col ${editingId ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="flex gap-2 p-2 border-b border-gray-100 dark:border-[#1f2937]">
                    <select 
                      value={tipoBusca} 
                      onChange={(e) => setTipoBusca(e.target.value)}
                      className="bg-transparent text-sm text-gray-900 dark:text-white px-2 focus:outline-none border-r border-gray-200 dark:border-gray-700"
                    >
                      <option value="RADIO">Rádios</option>
                      <option value="DIVERSO">Equipamentos</option>
                    </select>
                    <Search className="text-gray-400 ml-2" size={16} />
                    <input 
                      type="text"
                      placeholder="Buscar por Série, RP, ID..."
                      value={buscaRadioModal}
                      onChange={e => setBuscaRadioModal(e.target.value)}
                      className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white px-2 focus:outline-none"
                    />
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
                            if (tipoManutencao === 'Interna') {
                              setEquipamentosSelecionados([radio.id]);
                            } else {
                              setEquipamentosSelecionados(prev => prev.includes(radio.id) ? prev.filter(e => e !== radio.id) : [...prev, radio.id]);
                            }
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

              {tipoManutencao === 'Externa' ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Unidade de Origem</label>
                      <select value={unidadeId} onChange={e => setUnidadeId(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none text-gray-900">
                        <option value="">Selecione...</option>
                        {unidades.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Nº Doc Origem</label>
                      <input type="text" value={documentoOrigem} onChange={e => setDocumentoOrigem(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Nº Doc Saída Empresa</label>
                      <input type="text" value={documentoSaidaEmpresa} onChange={e => setDocumentoSaidaEmpresa(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Nº Doc Entrega Unidade</label>
                      <input type="text" value={documentoEntregaUnidade} onChange={e => setDocumentoEntregaUnidade(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Chegada ao DITEL</label>
                      <input type="date" value={dataChegadaDitel} onChange={e => setDataChegadaDitel(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Saída para Empresa</label>
                      <input type="date" value={dataSaidaEmpresa} onChange={e => setDataSaidaEmpresa(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Previsão Retorno</label>
                      <input type="date" value={previsaoRetorno} onChange={e => setPrevisaoRetorno(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Envio à Unidade</label>
                      <input type="date" value={dataEnvioUnidade} onChange={e => setDataEnvioUnidade(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none text-gray-900" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Unidade</label>
                      <select value={unidadeId} onChange={e => setUnidadeId(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none text-gray-900">
                        <option value="">Selecione...</option>
                        {unidades.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Nº PAE</label>
                      <input type="text" value={pae} onChange={e => setPae(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Solicitante</label>
                      <input type="text" value={solicitante} onChange={e => setSolicitante(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Data de Entrada</label>
                      <input type="date" value={dataEntrada} onChange={e => setDataEntrada(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none text-gray-900" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Técnico Responsável</label>
                      <select value={tecnicoId} onChange={e => setTecnicoId(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none text-gray-900">
                        <option value="">Selecione...</option>
                        {militares.map(m => <option key={m.id} value={m.id}>{m.rg} - {m.posto ? `${m.posto} ` : ''}{m.nome}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}


              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Descrição do Problema / Defeito Reclamado</label>
                <textarea 
                  rows={4}
                  value={problema}
                  onChange={(e) => setProblema(e.target.value)}
                  placeholder="Descreva detalhadamente o defeito relatado..."
                  className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#374151] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all"
                />
              </div>

              {tipoManutencao === 'Interna' && (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Análise Técnica</label>
                    <textarea 
                      rows={4}
                      value={analiseTecnica}
                      onChange={(e) => setAnaliseTecnica(e.target.value)}
                      placeholder="Descreva a análise técnica..."
                      className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#374151] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Laudo Técnico</label>
                    <textarea 
                      rows={4}
                      value={laudoTecnico}
                      onChange={(e) => setLaudoTecnico(e.target.value)}
                      placeholder="Descreva o laudo técnico final..."
                      className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#374151] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all"
                    />
                  </div>
                </>
              )}

            </div>

            
            <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-[#1f2937]">
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
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">OS</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Problema</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Datas</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Status</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1f2937]">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">Carregando registros...</td></tr>
              ) : manutencoes.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center text-gray-500 italic">Nenhum registro encontrado.</td></tr>
              ) : (
                manutencoes.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2937]/30 transition-colors group">
                    <td className="px-6 py-4">
                       <p className="font-bold text-gray-900 dark:text-white">{m.equipamento?.rp || 'S/RP'}</p>
                       <p className="text-[10px] text-gray-400 font-mono uppercase">{m.equipamento?.numSerie}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-primary">{m.equipamento?.idRadio || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {m.numeroSequencial ? `OS-${m.numeroSequencial.toString().padStart(4, '0')}` : m.id.substring(0, 6).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-[250px]">
                       <p className="text-xs italic text-gray-600 dark:text-gray-400 truncate" title={m.problema}>{m.problema}</p>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className={`px-2 py-0.5 mb-1 inline-block text-[9px] font-bold uppercase rounded ${m.tipoManutencao === 'Interna' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {m.tipoManutencao || 'Externa'}
                      </span>
                      {m.tipoManutencao === 'Interna' ? (
                         <p className="font-medium text-gray-500">Entrada: {m.dataEntrada ? new Date(m.dataEntrada).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-'}</p>
                      ) : (
                         <p className="font-medium text-gray-500">DITEL: {m.dataChegadaDitel ? new Date(m.dataChegadaDitel).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-'}</p>
                      )}
                      {m.dataEnvioUnidade && <p className="text-[10px] text-green-500">Envio Unid: {new Date(m.dataEnvioUnidade).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>}
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
                          onClick={() => gerarLaudoPdf(m)}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all" 
                          title="Imprimir Laudo Técnico"
                        >
                          <ClipboardCheck size={18} />
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

      {isModalConcluirOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/40 dark:bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-surface w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-up border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Concluir Manutenção</h3>
                <p className="text-sm text-gray-500">Defina o destino do equipamento</p>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                O equipamento foi reparado e está Operacional ou precisa de Laudo (Baixa/Condenação)?
              </p>
              
              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${statusDestino === 'OPERACIONAL' ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'}`}>
                  <input 
                    type="radio" 
                    name="statusDestino" 
                    value="OPERACIONAL" 
                    checked={statusDestino === 'OPERACIONAL'}
                    onChange={() => setStatusDestino('OPERACIONAL')}
                    className="w-4 h-4 text-primary"
                  />
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">Operacional</p>
                    <p className="text-xs text-gray-500">Rádio consertado, volta para o estoque.</p>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${statusDestino === 'BAIXADO' ? 'border-orange-500 bg-orange-500/5' : 'border-gray-200 dark:border-gray-700 hover:border-orange-500/50'}`}>
                  <input 
                    type="radio" 
                    name="statusDestino" 
                    value="BAIXADO" 
                    checked={statusDestino === 'BAIXADO'}
                    onChange={() => setStatusDestino('BAIXADO')}
                    className="w-4 h-4 text-orange-500"
                  />
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-orange-600">Laudo / Baixa</p>
                    <p className="text-xs text-gray-500">Sem conserto, equipamento será baixado.</p>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0b101a] flex justify-end gap-3">
              <button
                onClick={() => { setIsModalConcluirOpen(false); setManutencaoConcluirId(null); }}
                className="px-4 py-2 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmConcluir}
                className="px-4 py-2 font-bold text-white bg-primary hover:bg-blue-600 rounded-xl transition-all"
              >
                Confirmar Conclusão
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

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
