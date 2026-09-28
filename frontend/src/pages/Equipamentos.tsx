/**
 * @file Equipamentos.tsx
 * @description Componente de Cadastro e Consulta de Rádios (Transceptores). Permite registrar, editar e visualizar o status físico e patrimonial do inventário padrão.
 * Contém lógicas de controle de estado (useState), chamadas à API backend (Axios/useEffect)
 * e renderização de tabelas e modais.
 */

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Search, Trash2, Edit2, ChevronDown, List, ClipboardCheck } from "lucide-react";
import ModalConfirmacao from "../components/ModalConfirmacao";
import jsPDF from 'jspdf';
import { CHEFIA_DITEL } from '../config/ditel';

interface Equipamento {
  id: string;
  idRadio: string;
  rp: string;
  numSerie: string;
  marca: string;
  modelo: string;
  status: string;
  tipo?: string;
  garantia?: string;
  unidadeId?: string;
  unidade?: {
    id: string;
    nome: string;
  };
  problema?: string;
  solicitante?: string;
  pae?: string;
  analiseTecnica?: string;
  laudoTecnico?: string;
  tecnicoResp?: string;
  dataEntradaLaudo?: string;
  dataSaidaLaudo?: string;
}

interface Unidade {
  id: string;
  nome: string;
}

const Equipamentos: React.FC = () => {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState("Todos - Status");
  const [filtroMarca, setFiltroMarca] = useState("Todos - Marca");
  const [filtroModelo, setFiltroModelo] = useState("Todos - Modelo");
  const [filtroUnidade, setFiltroUnidade] = useState("Todas - Unidade");
  const [busca, setBusca] = useState("");

  const [viewMode, setViewMode] = useState<"form" | "list">("form");
  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [equipamentoDeleteId, setEquipamentoDeleteId] = useState<string | null>(
    null,
  );
  const [equipamentoDeleteRp, setEquipamentoDeleteRp] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [novoEquip, setNovoEquip] = useState({
    id: "",
    numSerie: "",
    idRadio: "",
    rp: "",
    marca: "Motorola",
    modelo: "APX 900",
    status: "OPERACIONAL",
    garantia: "Não",
    unidadeId: "",
    problema: "",
    solicitante: "",
    pae: "",
    analiseTecnica: "",
    laudoTecnico: "",
    tecnicoResp: "",
    dataEntradaLaudo: "",
    dataSaidaLaudo: "",
  });
  const [activeTab, setActiveTab] = useState<'identificacao' | 'laudo'>('identificacao');

  const fetchUnidades = async () => {
    try {
      const res = await axios.get("/api/unidades");
      setUnidades(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEquipamentos = async () => {
    try {
      const res = await axios.get("/api/equipamentos?tipo=RADIO");
      setEquipamentos(res.data);
    } catch (e) {
      console.error(
        "Conexão com a API falhou. Certifique que o backend está rodando.",
        e,
      );
      setEquipamentos([]);
    }
  };

  useEffect(() => {
    fetchEquipamentos();
    fetchUnidades();
  }, []);

  const switchToFormNovo = () => {
    setIsEditing(false);
    setNovoEquip({
      id: "",
      numSerie: "",
      idRadio: "",
      rp: "",
      marca: "Motorola",
      modelo: "APX 900",
      status: "OPERACIONAL",
      garantia: "Não",
      unidadeId: "",
      problema: "",
      solicitante: "",
      pae: "",
      analiseTecnica: "",
      laudoTecnico: "",
      tecnicoResp: "",
      dataEntradaLaudo: "",
      dataSaidaLaudo: "",
    });
    setActiveTab("identificacao");
    setViewMode("form");
  };

  const openEditModal = (eq: Equipamento) => {
    setIsEditing(true);
    setNovoEquip({
      id: eq.id,
      numSerie: eq.numSerie,
      idRadio: eq.idRadio || "",
      rp: eq.rp || "",
      marca: eq.marca || "Motorola",
      modelo: eq.modelo || "APX 900",
      status: eq.status,
      garantia: eq.garantia || "Não",
      unidadeId: eq.unidadeId || "",
      problema: eq.problema || "",
      solicitante: eq.solicitante || "",
      pae: eq.pae || "",
      analiseTecnica: eq.analiseTecnica || "",
      laudoTecnico: eq.laudoTecnico || "",
      tecnicoResp: eq.tecnicoResp || "",
      dataEntradaLaudo: eq.dataEntradaLaudo ? eq.dataEntradaLaudo.substring(0, 10) : "",
      dataSaidaLaudo: eq.dataSaidaLaudo ? eq.dataSaidaLaudo.substring(0, 10) : "",
    });
    setActiveTab("identificacao");
    setViewMode("form");
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

  const gerarLaudoPdf = async (m: Record<string, unknown>) => {
    const doc = new jsPDF();
    
    const drawVia = async (offsetY: number) => {
      try {
        const base64Para = await getBase64ImageFromUrl('/brasao_para.png');
        doc.addImage(base64Para, 'PNG', 14, 5 + offsetY, 20, 22);
      } catch (err) { }
      try {
        const base64Pmpa = await getBase64ImageFromUrl('/brasao_pmpa.png');
        doc.addImage(base64Pmpa, 'PNG', 176, 5 + offsetY, 20, 22);
      } catch (err) { }

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("GOVERNO DO ESTADO DO PARÁ", 105, 8 + offsetY, { align: "center" });
      doc.text("SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA E DEFESA SOCIAL", 105, 11 + offsetY, { align: "center" });
      doc.text("POLÍCIA MILITAR DO PARÁ", 105, 14 + offsetY, { align: "center" });
      doc.text("DEPARTAMENTO GERAL DE ADMINISTRAÇÃO", 105, 17 + offsetY, { align: "center" });
      doc.text("DIRETORIA DE TELEMÁTICA", 105, 20 + offsetY, { align: "center" });

      doc.setFontSize(12);
      doc.text("RELATÓRIO DE LAUDO TÉCNICO", 105, 28 + offsetY, { align: "center" });
      
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(10, 34 + offsetY, 200, 34 + offsetY);

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`Nº: ${m.idRadio ? String(m.idRadio).toUpperCase() : ''}`, 10, 39 + offsetY);
      doc.text(`Suporte: ${m.marca || ''} ${m.modelo || ''}`, 60, 39 + offsetY);
      doc.text(`Telecom: Rádio HT`, 130, 39 + offsetY);

      doc.line(10, 43 + offsetY, 200, 43 + offsetY);

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("UNIDADE", 10, 48 + offsetY);
      doc.text("Nº PAE", 40, 48 + offsetY);
      doc.text("RP/PM", 75, 48 + offsetY);
      doc.text("Nº SÉRIE", 105, 48 + offsetY);
      doc.text("SOLICITANTE", 140, 48 + offsetY);
      doc.text("DATA ENTRADA", 175, 48 + offsetY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const unidadeNome = unidades.find(u => u.id === m.unidadeId)?.nome || "DITEL";
      doc.text(unidadeNome, 10, 53 + offsetY);
      doc.text(m.pae || "-", 40, 53 + offsetY);
      doc.text(m.rp || "-", 75, 53 + offsetY);
      doc.text(m.numSerie || "-", 105, 53 + offsetY);
      doc.text(m.solicitante || "-", 140, 53 + offsetY);
      doc.text(m.dataEntradaLaudo ? new Date(m.dataEntradaLaudo).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : "-", 175, 53 + offsetY);

      doc.setFont("helvetica", "bold");
      doc.text("DEFEITO RECLAMADO:", 10, 61 + offsetY);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(m.problema || "-", 190), 10, 65 + offsetY);

      doc.setFont("helvetica", "bold");
      doc.text("ANÁLISE TÉCNICA:", 10, 75 + offsetY);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(m.analiseTecnica || "Sob análise.", 190), 10, 79 + offsetY);

      doc.setFont("helvetica", "bold");
      doc.text("LAUDO TÉCNICO:", 10, 89 + offsetY);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(m.laudoTecnico || "-", 190), 10, 93 + offsetY);

      doc.setFont("helvetica", "bold");
      doc.text(`DATA DE SAÍDA: ${m.dataSaidaLaudo ? new Date(m.dataSaidaLaudo).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}`, 10, 107 + offsetY);
      doc.text(`TÉCNICO RESP: ${m.tecnicoResp || '-'}`, 130, 107 + offsetY);

      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text('"A Diretoria de Telemática não possui peças de reposição ou suprimento para aquisição destas peças informadas"', 105, 114 + offsetY, { align: "center" });

      doc.setDrawColor(150, 150, 150);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(10, 120 + offsetY, 200, 120 + offsetY);
      doc.setLineDashPattern([], 0); // reset

      doc.setDrawColor(0, 0, 0);
      doc.line(15, 128 + offsetY, 95, 128 + offsetY);
      doc.line(115, 128 + offsetY, 195, 128 + offsetY);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text(CHEFIA_DITEL.assinaturaBase, 55, 131 + offsetY, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.text("RESPONDENDO PELAS SEÇÕES DE TELECOMUNICAÇÃO E SUPORTE AO USUÁRIO", 55, 134 + offsetY, { align: "center" });
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text("RECEBEDOR DO EQUIPAMENTO", 155, 131 + offsetY, { align: "center" });
    };

    await drawVia(0);
    
    // Linha tracejada de corte (meio da página A4)
    doc.setDrawColor(100, 100, 100);
    doc.setLineDashPattern([4, 4], 0);
    doc.line(0, 148.5, 210, 148.5);
    doc.setLineDashPattern([], 0);
    
    await drawVia(148.5);

    window.open(doc.output('bloburl'), '_blank');
  };

  const handleSalvar = async () => {
    try {
      if (isEditing) {
        const res = await axios.put(
          `/api/equipamentos/${novoEquip.id}`,
          novoEquip,
        );
        setEquipamentos(
          equipamentos.map((e) => (e.id === novoEquip.id ? res.data : e)),
        );
        setViewMode("list");
      } else {
        const res = await axios.post("/api/equipamentos", { ...novoEquip, tipo: "RADIO" });
        setEquipamentos([...equipamentos, res.data]);
        alert("Equipamento cadastrado com sucesso!");
        setNovoEquip({
          id: "",
          numSerie: "",
          idRadio: "",
          rp: "",
          marca: "Motorola",
          modelo: "APX 900",
          status: "OPERACIONAL",
          garantia: "Não",
          unidadeId: "",
          problema: "",
          solicitante: "",
          pae: "",
          analiseTecnica: "",
          laudoTecnico: "",
          tecnicoResp: "",
          dataEntradaLaudo: "",
          dataSaidaLaudo: "",
        });
      }
    } catch (e) {
      console.error("Erro ao salvar rádio", e);
      alert("Erro ao salvar. Verifique se o Rádio ou Patrimônio já existem.");
    }
  };

  const openDeleteModal = (id: string, rp: string) => {
    setEquipamentoDeleteId(id);
    setEquipamentoDeleteRp(rp);
    setIsModalDeleteOpen(true);
  };

  const confirmExcluir = async () => {
    if (!equipamentoDeleteId) return;
    try {
      await axios.delete(`/api/equipamentos/${equipamentoDeleteId}`);
      setEquipamentos(equipamentos.filter((e) => e.id !== equipamentoDeleteId));
      setIsModalDeleteOpen(false);
      setEquipamentoDeleteId(null);
    } catch (e) {
      console.error("Erro ao excluir", e);
      alert(
        "Erro ao excluir este equipamento. Ele pode estar atrelado a uma movimentação.",
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "OPERACIONAL":
        return "text-success bg-success/10 border-success/20";
      case "CAUTELADO":
        return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "MANUTENÇÃO":
      case "MANUTENCAO":
        return "text-warning bg-warning/10 border-warning/20";
      case "EXTRAVIADO":
        return "text-danger bg-danger/10 border-danger/20";
      case "TRANSFERIDO":
        return "text-purple-400 bg-purple-400/10 border-purple-400/20";
      case "LAUDO":
        return "text-orange-400 bg-orange-400/10 border-orange-400/20";
      default:
        return "text-gray-400 bg-gray-600/10 border-gray-600/20";
    }
  };

  const equipamentosFiltrados = equipamentos.filter((eq) => {
    let match = true;
    if (
      filtroStatus !== "Todos - Status" &&
      eq.status.toUpperCase() !==
        filtroStatus.toUpperCase().replace("Ç", "C").replace("Ã", "A")
    )
      match = false;
    if (filtroMarca !== "Todos - Marca" && eq.marca !== filtroMarca)
      match = false;
    if (filtroModelo !== "Todos - Modelo" && eq.modelo !== filtroModelo)
      match = false;

    if (
      filtroUnidade !== "Todas - Unidade" &&
      eq.unidade?.nome !== filtroUnidade
    )
      match = false;

    if (busca.trim() !== "") {
      const term = busca.toLowerCase();
      const matchBusca =
        (eq.numSerie && eq.numSerie.toLowerCase().includes(term)) ||
        (eq.rp && eq.rp.toLowerCase().includes(term)) ||
        (eq.idRadio && eq.idRadio.toLowerCase().includes(term));
      if (!matchBusca) match = false;
    }

    return match;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in text-gray-900 dark:text-white h-full flex flex-col relative transition-colors duration-200">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Equipamentos
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gerenciamento de rádios
          </p>
        </div>
        {viewMode === "list" ? (
          <button
            onClick={switchToFormNovo}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-primary/20"
          >
            <Plus size={18} />
            Novo Equipamento
          </button>
        ) : (
          <button
            onClick={() => setViewMode("list")}
            className="flex items-center gap-2 bg-gray-100 dark:bg-surface border border-gray-300 dark:border-[#374151] hover:bg-gray-200 dark:hover:bg-[#1f2937] text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <List size={18} />
            Consultar Registros
          </button>
        )}
      </div>

      {viewMode === "list" ? (
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col overflow-hidden transition-colors">
          <div className="p-4 border-b border-gray-200 dark:border-[#1f2937] flex items-center justify-between gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[250px] max-w-sm">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                size={18}
              />
              <input
                type="text"
                placeholder="Buscar por série, ID, patrimônio..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* Filtros Dropdowns (Design Simulado) */}
            <div className="flex items-center gap-3">
              <div className="relative group cursor-pointer">
                <div className="bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] hover:border-gray-400 dark:hover:border-gray-500 rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between gap-3 min-w-[160px] transition-colors">
                  <span>{filtroStatus}</span>
                  <ChevronDown
                    size={14}
                    className="text-gray-400 dark:text-gray-500"
                  />
                </div>
                <div className="absolute top-full mt-1 w-full bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#374151] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 py-1">
                  <div
                    className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer"
                    onClick={() => setFiltroStatus("Todos - Status")}
                  >
                    Todos - Status
                  </div>
                  <div
                    className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer"
                    onClick={() => setFiltroStatus("Operacional")}
                  >
                    Operacional
                  </div>
                  <div
                    className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer"
                    onClick={() => setFiltroStatus("Cautelado")}
                  >
                    Cautelado
                  </div>
                  <div
                    className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer"
                    onClick={() => setFiltroStatus("Manutenção")}
                  >
                    Manutenção
                  </div>
                  <div
                    className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer"
                    onClick={() => setFiltroStatus("Extraviado")}
                  >
                    Extraviado
                  </div>
                  <div
                    className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer"
                    onClick={() => setFiltroStatus("Laudo")}
                  >
                    Laudo
                  </div>
                </div>
              </div>

              <div className="relative group cursor-pointer">
                <div className="bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] hover:border-gray-400 dark:hover:border-gray-500 rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between gap-3 min-w-[160px] transition-colors">
                  <span>{filtroMarca}</span>
                  <ChevronDown
                    size={14}
                    className="text-gray-400 dark:text-gray-500"
                  />
                </div>
                <div className="absolute top-full mt-1 w-full bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#374151] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 py-1">
                  <div
                    className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer"
                    onClick={() => setFiltroMarca("Todos - Marca")}
                  >
                    Todos - Marca
                  </div>
                  <div
                    className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer"
                    onClick={() => setFiltroMarca("Motorola")}
                  >
                    Motorola
                  </div>
                  <div
                    className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer"
                    onClick={() => setFiltroMarca("Tait")}
                  >
                    Tait
                  </div>
                </div>
              </div>

              <div className="relative group cursor-pointer">
                <div className="bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] hover:border-gray-400 dark:hover:border-gray-500 rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between gap-3 min-w-[160px] transition-colors">
                  <span>{filtroModelo}</span>
                  <ChevronDown
                    size={14}
                    className="text-gray-400 dark:text-gray-500"
                  />
                </div>
                <div className="absolute top-full mt-1 w-full right-0 bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#374151] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 py-1">
                  <div
                    className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer"
                    onClick={() => setFiltroModelo("Todos - Modelo")}
                  >
                    Todos - Modelo
                  </div>
                  <div
                    className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer"
                    onClick={() => setFiltroModelo("APX 900")}
                  >
                    APX 900
                  </div>
                  <div
                    className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer"
                    onClick={() => setFiltroModelo("APX 2000")}
                  >
                    APX 2000
                  </div>
                  <div
                    className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer"
                    onClick={() => setFiltroModelo("TP9400")}
                  >
                    TP9400
                  </div>
                  <div
                    className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer"
                    onClick={() => setFiltroModelo("TP9100")}
                  >
                    TP9100
                  </div>
                </div>
              </div>

              <div className="relative group cursor-pointer">
                <div className="bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] hover:border-gray-400 dark:hover:border-gray-500 rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between gap-3 min-w-[160px] transition-colors">
                  <span>{filtroUnidade}</span>
                  <ChevronDown
                    size={14}
                    className="text-gray-400 dark:text-gray-500"
                  />
                </div>
                <div className="absolute top-full mt-1 w-full right-0 bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#374151] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 py-1 max-h-60 overflow-y-auto">
                  <div
                    className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer"
                    onClick={() => setFiltroUnidade("Todas - Unidade")}
                  >
                    Todas - Unidade
                  </div>
                  {unidades.map((u) => (
                    <div
                      key={u.id}
                      className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer"
                      onClick={() => setFiltroUnidade(u.nome)}
                    >
                      {u.nome}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tabela com scroll horizontal no mobile */}
          <div className="flex-1 overflow-auto overflow-x-auto scrolling-touch">
            <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300 min-w-[800px]">
              <thead className="bg-gray-50 dark:bg-[#0b101a] text-gray-500 dark:text-gray-400 font-medium text-xs sticky top-0 z-0">
                <tr>
                  <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">
                    Nº
                  </th>
                  <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">
                    Número de Série
                  </th>
                  <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">
                    Patrimônio
                  </th>
                  <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">
                    Marca
                  </th>
                  <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">
                    Modelo
                  </th>
                  <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">
                    Status
                  </th>
                  <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">
                    Unidade
                  </th>
                  <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937] text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#1f2937]">
                {equipamentosFiltrados.map((eq) => (
                  <tr
                    key={eq.id}
                    className="hover:bg-gray-50 dark:hover:bg-[#1f2937]/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {eq.idRadio || "-"}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {eq.numSerie}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {eq.rp}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {eq.marca || "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {eq.modelo || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 text-[11px] font-bold tracking-wide rounded-full border ${getStatusColor(eq.status)}`}
                      >
                        {eq.status === "OPERACIONAL"
                          ? "Operacional"
                          : eq.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-primary uppercase">
                      {eq.unidade?.nome || "DITEL"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 text-gray-400 dark:text-gray-500">
                        <button
                          onClick={() => openEditModal(eq)}
                          className="hover:text-gray-900 dark:hover:text-white p-1.5 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-white/5"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(eq.id, eq.rp)}
                          className="hover:text-danger p-1.5 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-danger/10"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col overflow-hidden transition-colors shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-[#1f2937] flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEditing ? "Editar Equipamento" : "Novo Equipamento"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isEditing
                ? "Atualize as informações do rádio."
                : "Preencha as informações abaixo para cadastrar um novo rádio no sistema."}
            </p>
            {isEditing && (
              <div className="flex gap-6 mt-4 border-t border-gray-200 dark:border-[#1f2937] pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('identificacao')}
                  className={`py-2 font-bold text-sm border-b-2 transition-colors outline-none ${activeTab === 'identificacao' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  IDENTIFICAÇÃO
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('laudo')}
                  className={`py-2 font-bold text-sm border-b-2 transition-colors outline-none ${activeTab === 'laudo' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  ANÁLISE & SERVIÇO
                </button>
              </div>
            )}
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {activeTab === 'identificacao' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Nº (Opcional)
                </label>
                <input
                  type="text"
                  value={novoEquip.idRadio}
                  onChange={(e) =>
                    setNovoEquip({ ...novoEquip, idRadio: e.target.value })
                  }
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Número de Série
                </label>
                <input
                  type="text"
                  value={novoEquip.numSerie}
                  onChange={(e) =>
                    setNovoEquip({ ...novoEquip, numSerie: e.target.value })
                  }
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Patrimônio (Opcional)
                </label>
                <input
                  type="text"
                  value={novoEquip.rp}
                  onChange={(e) =>
                    setNovoEquip({ ...novoEquip, rp: e.target.value })
                  }
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Marca
                </label>
                <select
                  value={novoEquip.marca}
                  onChange={(e) =>
                    setNovoEquip({ ...novoEquip, marca: e.target.value })
                  }
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                >
                  <option value="Motorola">Motorola</option>
                  <option value="Tait">Tait</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Modelo
                </label>
                <select
                  value={novoEquip.modelo}
                  onChange={(e) =>
                    setNovoEquip({ ...novoEquip, modelo: e.target.value })
                  }
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                >
                  <option value="APX 900">APX 900</option>
                  <option value="APX 2000">APX 2000</option>
                  <option value="TP9400">TP9400</option>
                  <option value="TP9100">TP9100</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Status
                </label>
                <select
                  value={novoEquip.status}
                  onChange={(e) =>
                    setNovoEquip({ ...novoEquip, status: e.target.value })
                  }
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                >
                  <option value="OPERACIONAL">Operacional</option>
                  <option value="CAUTELADO">Cautelado</option>
                  <option value="MANUTENCAO">Em Manutenção</option>
                  <option value="EXTRAVIADO">Extraviado</option>
                  <option value="LAUDO">Laudo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Garantia
                </label>
                <select
                  value={novoEquip.garantia}
                  onChange={(e) =>
                    setNovoEquip({ ...novoEquip, garantia: e.target.value })
                  }
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                >
                  <option value="Sim">Sim</option>
                  <option value="Não">Não</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Unidade
                </label>
                <select
                  value={novoEquip.unidadeId}
                  onChange={(e) =>
                    setNovoEquip({ ...novoEquip, unidadeId: e.target.value })
                  }
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                >
                  <option value="">Selecione uma Unidade (Opcional)</option>
                  {unidades.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Solicitante (Nome)</label>
                    <input 
                      type="text" 
                      value={novoEquip.solicitante}
                      onChange={(e) => setNovoEquip({ ...novoEquip, solicitante: e.target.value })}
                      placeholder="Ex: SD LAIANE"
                      className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Nº PAE</label>
                    <input 
                      type="text" 
                      value={novoEquip.pae}
                      onChange={(e) => setNovoEquip({ ...novoEquip, pae: e.target.value })}
                      placeholder="Ex: 2025/3481287"
                      className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Data Entrada (Oficina)</label>
                    <input 
                      type="date" 
                      value={novoEquip.dataEntradaLaudo}
                      onChange={(e) => setNovoEquip({ ...novoEquip, dataEntradaLaudo: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Data Saída (Oficina)</label>
                    <input 
                      type="date" 
                      value={novoEquip.dataSaidaLaudo}
                      onChange={(e) => setNovoEquip({ ...novoEquip, dataSaidaLaudo: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Descrição do Problema / Defeito</label>
                  <textarea 
                    rows={3}
                    value={novoEquip.problema}
                    onChange={(e) => setNovoEquip({ ...novoEquip, problema: e.target.value })}
                    placeholder="Descreva detalhadamente o defeito relatado..."
                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Análise Técnica Preliminar</label>
                  <textarea 
                    rows={3}
                    value={novoEquip.analiseTecnica}
                    onChange={(e) => setNovoEquip({ ...novoEquip, analiseTecnica: e.target.value })}
                    placeholder="Descreva a análise técnica preliminar..."
                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Laudo Técnico Final</label>
                  <textarea 
                    rows={3}
                    value={novoEquip.laudoTecnico}
                    onChange={(e) => setNovoEquip({ 
                      ...novoEquip, 
                      laudoTecnico: e.target.value, 
                      status: e.target.value.trim() !== '' ? 'LAUDO' : novoEquip.status 
                    })}
                    placeholder="Descreva o laudo técnico final detalhado..."
                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all"
                  />
                </div>
                
                <div className="md:w-1/2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Técnico Responsável</label>
                  <input 
                    type="text" 
                    value={novoEquip.tecnicoResp}
                    onChange={(e) => setNovoEquip({ ...novoEquip, tecnicoResp: e.target.value })}
                    placeholder="Ex: Subten"
                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-[#1f2937] flex items-center justify-end gap-3 flex-shrink-0 bg-gray-50 dark:bg-[#0b101a]">
            {isEditing && (
              <>
                <button
                  onClick={() => gerarLaudoPdf(novoEquip)}
                  className="px-4 py-2.5 text-sm font-medium text-primary border border-primary hover:bg-primary hover:text-white rounded-lg transition-colors flex items-center gap-2 mr-auto"
                >
                  <ClipboardCheck size={18} /> Imprimir Laudo
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-[#1f2937] rounded-lg transition-colors"
                >
                  Cancelar Edição
                </button>
              </>
            )}
            <button
              onClick={handleSalvar}
              className="px-8 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-lg shadow-primary/20"
            >
              {isEditing ? "Salvar Alterações" : "Criar Registro"}
            </button>
          </div>
        </div>
      )}

      {/* Modal Confirmação Excluir */}
      <ModalConfirmacao
        isOpen={isModalDeleteOpen}
        title="Excluir Equipamento"
        message={`Você está removendo definitivamente o Patrimônio ${equipamentoDeleteRp} do sistema. A ação é irreversível. Confirma?`}
        onConfirm={confirmExcluir}
        onCancel={() => {
          setIsModalDeleteOpen(false);
          setEquipamentoDeleteId(null);
        }}
      />
    </div>
  );
};

export default Equipamentos;
