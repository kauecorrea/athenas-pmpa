import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, FileText, ChevronDown, AlertTriangle, Trash2, Search } from 'lucide-react';
import ModalConfirmacao from '../components/ModalConfirmacao';
import jsPDF from 'jspdf';

interface ExtravioRecord {
  id: string;
  equipamento: { rp: string; numSerie: string; idRadio: string };
  militar: { nome: string; posto: string } | null;
  dataExtravio: string;
  local: string | null;
  descricao: string;
  status: string;
}

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
}

const Extraviados: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [radiosDisponiveis, setRadiosDisponiveis] = useState<EquipamentoDisponivel[]>([]);
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [extravios, setExtravios] = useState<ExtravioRecord[]>([]);

  // Form states
  const [equipamentoId, setEquipamentoId] = useState('');
  const [militarId, setMilitarId] = useState('');
  const [dataExtravio, setDataExtravio] = useState('');
  const [local, setLocal] = useState('');
  const [descricao, setDescricao] = useState('');

  // Modal states
  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [isModalEncontradoOpen, setIsModalEncontradoOpen] = useState(false);
  const [isModalBaixarOpen, setIsModalBaixarOpen] = useState(false);
  const [extravioAlvo, setExtravioAlvo] = useState<ExtravioRecord | null>(null);
  const [buscaRadioModal, setBuscaRadioModal] = useState('');

  useEffect(() => {
    fetchExtravios();
  }, []);

  useEffect(() => {
    if (isFormOpen) {
      setBuscaRadioModal('');
      fetchEquipamentosParaExtravio();
      fetchMilitares();
    }
  }, [isFormOpen]);

  const fetchExtravios = async () => {
    try {
      const res = await axios.get('/api/extravios');
      setExtravios(res.data);
    } catch (error) {
      console.error("Erro ao buscar extravios", error);
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

  const fetchEquipamentosParaExtravio = async () => {
    try {
      const res = await axios.get('/api/equipamentos');
      // Qualquer rádio pode ser extraviado (até os operacionais), exceto os que JÁ ESTÃO extraviados
      const disponiveis = res.data.filter((eq: any) => eq.status !== 'EXTRAVIADO');
      setRadiosDisponiveis(disponiveis);
    } catch (error) {
      console.error("Erro ao buscar equipamentos para extravio", error);
    }
  };

  const handleCreateExtravio = async () => {
    if (!equipamentoId || !descricao) {
      alert("Preencha o Rádio e a Descrição/B.O obrigatoriamente.");
      return;
    }

    try {
      await axios.post('/api/extravios', {
        equipamentoId: equipamentoId,
        militarId: militarId ? militarId : null,
        dataExtravio: dataExtravio ? new Date(dataExtravio).toISOString() : new Date().toISOString(),
        local,
        descricao
      });
      setIsFormOpen(false);
      setEquipamentoId('');
      setMilitarId('');
      setDataExtravio('');
      setLocal('');
      setDescricao('');
      fetchExtravios(); // Atualiza a tabela
    } catch (error) {
      console.error("Erro ao registrar extravio", error);
    }
  };

  const handleEncontrado = async () => {
    if (!extravioAlvo) return;
    try {
      await axios.put(`/api/extravios/${extravioAlvo.id}/encontrado`);
      setIsModalEncontradoOpen(false);
      setExtravioAlvo(null);
      fetchExtravios();
    } catch (e) { console.error(e); alert('Erro ao recuperar o rádio.'); }
  };

  const handleBaixar = async () => {
    if (!extravioAlvo) return;
    try {
      await axios.put(`/api/extravios/${extravioAlvo.id}/baixar`);
      setIsModalBaixarOpen(false);
      setExtravioAlvo(null);
      fetchExtravios(); // Atualiza a tabela
    } catch (e) { console.error(e); alert('Erro ao baixar o rádio.'); }
  };

  const handleDelete = async () => {
    if (!extravioAlvo) return;
    try {
      await axios.delete(`/api/extravios/${extravioAlvo.id}`);
      setIsModalDeleteOpen(false);
      setExtravioAlvo(null);
      fetchExtravios(); // Atualiza a tabela
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir o extravio.');
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

  const gerarBoletimPdf = async (e: ExtravioRecord) => {
    const doc = new jsPDF();
    
    // 1. Brasões
    try {
      const base64Para = await getBase64ImageFromUrl('/brasao_para.png');
      doc.addImage(base64Para, 'PNG', 14, 10, 20, 22);
    } catch (err) { console.error('Sem brasao_para.png'); }
    
    try {
      const base64Pmpa = await getBase64ImageFromUrl('/brasao_pmpa.png');
      doc.addImage(base64Pmpa, 'PNG', 176, 10, 20, 22);
    } catch (err) { console.error('Sem brasao_pmpa.png'); }

    // 2. Título Geral e Timbre
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("GOVERNO DO ESTADO DO PARÁ", 105, 15, { align: "center" });
    doc.text("SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA E DEFESA SOCIAL", 105, 20, { align: "center" });
    doc.text("POLÍCIA MILITAR DO PARÁ", 105, 25, { align: "center" });
    doc.text("DEPARTAMENTO GERAL DE ADMINISTRAÇÃO", 105, 30, { align: "center" });
    doc.text("DIRETORIA DE TELEMÁTICA", 105, 35, { align: "center" });

    // 3. Título do Documento
    doc.setFontSize(14);
    doc.text("COMUNICAÇÃO EXTRAORDINÁRIA DE EXTRAVIO", 105, 50, { align: "center" });
    doc.setFontSize(11);
    doc.text("MATERIAL CARGA DE TELECOMUNICAÇÕES", 105, 56, { align: "center" });
    
    // Linha divisória
    doc.setLineWidth(0.5);
    doc.line(14, 62, 196, 62);

    // 4. Qualificação do Fato
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    
    doc.text("1. DADOS DO EQUIPAMENTO", 14, 72);
    doc.setFont("helvetica", "bold");
    doc.text(`Patrimônio (RP): `, 14, 79); doc.setFont("helvetica", "normal"); doc.text(`${e.equipamento.rp}`, 48, 79);
    doc.setFont("helvetica", "bold");
    doc.text(`Número de Série: `, 105, 79); doc.setFont("helvetica", "normal"); doc.text(`${e.equipamento.numSerie}`, 138, 79);
    doc.setFont("helvetica", "bold");
    doc.text(`ID Lógico (Rádio): `, 14, 86); doc.setFont("helvetica", "normal"); doc.text(`${e.equipamento.idRadio || 'N/I'}`, 48, 86);

    doc.setFont("helvetica", "normal");
    doc.text("2. DADOS DO RESPONSÁVEL / DETENTOR", 14, 98);
    const militarNome = e.militar ? `${e.militar.posto} ${e.militar.nome}` : 'NÃO IDENTIFICADO / MATERIAL DE RESERVA BASE';
    doc.setFont("helvetica", "bold");
    doc.text(`Militar Envolvido: `, 14, 105); doc.setFont("helvetica", "normal"); doc.text(`${militarNome}`, 48, 105);

    doc.setFont("helvetica", "normal");
    doc.text("3. CIRCUNSTÂNCIAS DO EVENTO", 14, 117);
    doc.setFont("helvetica", "bold");
    doc.text(`Data da Perda/Dano: `, 14, 124); doc.setFont("helvetica", "normal"); doc.text(`${new Date(e.dataExtravio).toLocaleDateString('pt-BR')}`, 55, 124);
    doc.setFont("helvetica", "bold");
    doc.text(`Localização / Missão: `, 14, 131); doc.setFont("helvetica", "normal"); doc.text(`${e.local || 'Não Informada'}`, 55, 131);
    
    // Quebra de texto grande no Resumo
    doc.setFont("helvetica", "bold");
    doc.text("Síntese do Ocorrido (B.O):", 14, 140);
    doc.setFont("helvetica", "normal");
    const splitDescricao = doc.splitTextToSize(e.descricao, 180);
    doc.text(splitDescricao, 14, 147);

    // 5. Termo de Responsabilidade
    const yTermo = 147 + (splitDescricao.length * 6) + 15;
    doc.setFont("helvetica", "bold");
    doc.text("DECLARAÇÃO:", 14, yTermo);
    doc.setFont("helvetica", "normal");
    const termo = `Participo a Vossa Senhoria o extravio/dano do material público acima especificado, conforme relato em epígrafe. O presente documento visa instruir possível e posterior instauração de Inquérito Policial Militar (IPM) ou Sindicância por parte desta corporação para apuração de responsabilidades institucionais no âmbito do Estado do Pará.`;
    const splitTermo = doc.splitTextToSize(termo, 180);
    doc.text(splitTermo, 14, yTermo + 7);

    // 6. Assinaturas
    const dateHoje = new Date().toLocaleDateString('pt-BR');
    const finalY = yTermo + (splitTermo.length * 5) + 30;
    
    doc.text(`Belém PA, ${dateHoje}`, 14, finalY - 15);

    // Assinatura 1
    doc.line(20, finalY, 90, finalY);
    doc.setFontSize(9);
    doc.text("ASSINATURA DO COMUNICANTE", 55, finalY + 5, { align: "center" });
    if (e.militar) {
       doc.text(`${e.militar.posto} ${e.militar.nome}`, 55, finalY + 10, { align: "center" });
    }

    // Assinatura 2
    doc.line(120, finalY, 190, finalY);
    doc.text("SUPERVISOR", 155, finalY + 5, { align: "center" });
    doc.text("Recebimento do Formulário", 155, finalY + 10, { align: "center" });

    // Endereço Padrão 
    doc.setFontSize(8);
    doc.text("Rod. Augusto Montenegro, Km 9, n°8401, Bairro Parque Guajará/Dist. de Icoaraci - Belém/PA.", 105, 280, { align: "center" });
    doc.text("CEP: 66821-000. Contato: (91) 3258-9818 / E-mail: citel@pm.pa.gov.br", 105, 285, { align: "center" });

    doc.save(`Extravio_RP${e.equipamento.rp}.pdf`);
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
             Extraviados
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Acervo oficial de Furtos, Perdas e Danos Irrecuperáveis</p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20 whitespace-nowrap"
          >
            <Plus size={18} />
            Registrar B.O de Extravio
          </button>
        )}
      </div>

      {/* INLINE FORM: REGISTRAR EXTRAVIO */}
      {isFormOpen && (
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-shrink-0 transition-colors">
          <div className="p-6 border-b border-gray-200 dark:border-[#1f2937]">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Registrar Perda / Extravio</h2>
            <p className="text-sm text-gray-500 mt-1">Ao registrar o rádio sai definitivamente do controle de "Operacionais".</p>
          </div>
          
          <div className="p-6 space-y-4">
            
            {/* Equipamento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Equipamento Ausente</label>
                <div className="border border-gray-300 dark:border-[#374151] bg-gray-50 dark:bg-[#111827] rounded-lg overflow-hidden flex flex-col">
                  {/* Search bar inside block */}
                  <div className="p-2 border-b border-gray-200 dark:border-[#374151] bg-white dark:bg-[#1f2937]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input 
                        type="text"
                        placeholder="Buscar máquina (Série, RP, ID)..."
                        value={buscaRadioModal}
                        onChange={e => setBuscaRadioModal(e.target.value)}
                        className="w-full bg-transparent text-sm text-gray-900 dark:text-white pl-9 pr-3 py-1.5 focus:outline-none placeholder-gray-400"
                      />
                    </div>
                  </div>
                  {/* List of radio buttons */}
                  <div className="max-h-48 overflow-y-auto p-4 space-y-3">
                    {radiosDisponiveisFiltrados.length === 0 ? (
                      <p className="text-sm text-gray-500 italic text-center py-2">Nenhuma máquina encontrada.</p>
                    ) : (
                      radiosDisponiveisFiltrados.map((radio) => (
                        <label key={radio.id} className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative flex items-center justify-center w-4 h-4 rounded-full border border-gray-400 dark:border-gray-500 bg-white dark:bg-surface group-hover:border-primary transition-colors">
                            <input 
                              type="radio" 
                              name="extravioRadioSelect"
                              className="peer w-full h-full opacity-0 cursor-pointer absolute" 
                              checked={equipamentoId === String(radio.id)}
                              onChange={() => setEquipamentoId(String(radio.id))}
                            />
                            <div className="hidden peer-checked:block pointer-events-none absolute w-2 h-2 rounded-full bg-primary" />
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300 select-none font-medium text-left">
                            {radio.rp} - {radio.numSerie} {radio.idRadio ? `(${radio.idRadio})` : ''}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Militar Responsável */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Quem estava responsável?</label>
                <div className="relative">
                  <select 
                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                    value={militarId}
                    onChange={(e) => setMilitarId(e.target.value)}
                  >
                    <option value="">Não informado (ou do Batalhão)</option>
                    {militares.map(m => (
                      <option key={m.id} value={m.id}>{m.posto} {m.nome}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                </div>
              </div>
            </div>

            {/* Data e Local */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Data Crítica (quando ocorreu?)</label>
                <input 
                  type="date"
                  value={dataExtravio}
                  onChange={(e) => setDataExtravio(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Local (Cidade / Rua / Evento)</label>
                <input 
                  type="text"
                  placeholder="Ex: Praça Batista Campos"
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>

            {/* Descrição do Ocorrido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Resumo / Número do B.O / Sindicância</label>
              <textarea 
                rows={3}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Exemplo: Rádio foi subtraído do armário do aloja e a parte confeccionada foi a Num. 3432/2026."
                className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
              />
            </div>

          </div>

          <div className="p-6 pt-2 flex items-center gap-3">
            <button 
              onClick={handleCreateExtravio}
              className="px-6 py-2.5 text-sm font-medium text-white bg-danger hover:bg-red-700 rounded-lg transition-colors shadow-lg shadow-red-600/20"
            >
              Registrar Perda
            </button>
            <button 
              onClick={() => setIsFormOpen(false)}
              className="px-6 py-2.5 text-sm font-medium text-gray-400 border border-[#374151] hover:text-white dark:hover:bg-[#1f2937] hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* TABELA DE EQUIPAMENTOS EXTRAVIADOS */}
      <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col overflow-hidden transition-colors">
        
        <div className="p-5 border-b border-gray-200 dark:border-[#1f2937] flex items-center gap-2">
          <AlertTriangle className="text-danger" size={20} />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Relação de Documentos Físicos de Extravio</h2>
        </div>
        
        {/* TABELA - Responsiva */}
        <div className="flex-1 overflow-auto overflow-x-auto scrolling-touch z-0">
          <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300 min-w-[1000px]">
            <thead className="bg-gray-50 dark:bg-[#0b101a] text-gray-500 dark:text-gray-400 font-medium text-xs sticky top-0 z-0">
              <tr>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">RP / Série</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Oficial Acompanhando</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Data do Evento</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Localização</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Resumo / B.O</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Andamento IPD</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937] text-right">Documentos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1f2937]">
              {extravios.length === 0 ? (
                <tr>
                   <td colSpan={7} className="px-6 py-12 text-center text-gray-500 bg-transparent">
                     Excelente operação! Nenhum equipamento extraviado histórico registrado.
                   </td>
                </tr>
              ) : (
                extravios.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2937]/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                      {e.equipamento?.rp} <br/><span className="text-xs font-normal text-gray-500">{e.equipamento?.numSerie}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {e.militar ? `${e.militar.posto} ${e.militar.nome}` : 'Apurar'}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {new Date(e.dataExtravio).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 truncate max-w-[150px]" title={e.local || ''}>{e.local || '-'}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 truncate max-w-[200px]" title={e.descricao}>{e.descricao}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-[11px] font-bold text-danger bg-danger/10 border border-danger/20 rounded-full uppercase tracking-wider">
                        {e.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 text-gray-400 dark:text-gray-500">
                        {e.status !== 'BAIXADO' && e.status !== 'RECUPERADO' && (
                          <>
                            <button 
                              onClick={() => { setExtravioAlvo(e); setIsModalEncontradoOpen(true); }}
                              className="px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                              Encontrado
                            </button>
                            <button 
                              onClick={() => { setExtravioAlvo(e); setIsModalBaixarOpen(true); }}
                              className="px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                              Baixar
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => { setExtravioAlvo(e); setIsModalDeleteOpen(true); }}
                          className="hover:text-red-500 p-1.5 rounded-lg transition-colors hover:bg-red-500/10" title="Excluir Registro de B.O"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button 
                          onClick={() => gerarBoletimPdf(e)}
                          className="hover:text-gray-900 dark:hover:text-white p-1.5 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-white/5" 
                          title="Baixar Boletim Relatório (PDF Oficial da PMPA)"
                        >
                          <FileText size={16} />
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

      {/* MODAIS DE AÇÃO */}
      <ModalConfirmacao 
        isOpen={isModalEncontradoOpen}
        title="Rádio Encontrado"
        message={`Confirma que o rádio ${extravioAlvo?.equipamento.rp} que estava extraviado foi recuperado? Isto devolverá o rádio ao status OPERACIONAL e encerrará as buscas.`}
        onConfirm={handleEncontrado}
        onCancel={() => { setIsModalEncontradoOpen(false); setExtravioAlvo(null); }}
        confirmText="Confirmar Recuperação"
      />

      <ModalConfirmacao 
        isOpen={isModalBaixarOpen}
        title="Baixa Definitiva do Bem"
        message={`Confirma a baixa definitiva do rádio ${extravioAlvo?.equipamento.rp}? Ele perderá permanentemente seu status ativo e será considerado destruído ou roubado definitivamente.`}
        onConfirm={handleBaixar}
        onCancel={() => { setIsModalBaixarOpen(false); setExtravioAlvo(null); }}
        confirmText="Baixar Material"
      />

      <ModalConfirmacao 
        isOpen={isModalDeleteOpen}
        title="Excluir Histórico de Extravio"
        message="Use apenas em caso de ERRO MATERIAL na hora de registrar (clicou sem querer num B.O falso). O Rádio voltará silenciosamente para o estoque e a ordem militar de extravio deixará de constar no painel. Confirma alteração agressiva de log?"
        onConfirm={handleDelete}
        onCancel={() => { setIsModalDeleteOpen(false); setExtravioAlvo(null); }}
      />
    </div>
  );
};

export default Extraviados;
