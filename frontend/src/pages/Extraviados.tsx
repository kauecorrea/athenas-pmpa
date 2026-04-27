import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Search, 
  Trash2, 
  ShieldOff, 
  List,
  User,
  Radio
} from 'lucide-react';
import ModalConfirmacao from '../components/ModalConfirmacao';

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

interface Extraviado {
  id: string;
  dataRegistro: string;
  boNumero: string;
  descricao: string;
  status: string;
  militar: Militar;
  equipamento: Equipamento;
}

const Extraviados: React.FC = () => {
  const [extraviados, setExtraviados] = useState<Extraviado[]>([]);
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState<'form' | 'list'>('form');
  const [busca, setBusca] = useState('');
  const [buscaMilitar, setBuscaMilitar] = useState('');
  const [buscaEquipamento, setBuscaEquipamento] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    militarId: '',
    equipamentoId: '',
    boNumero: '',
    descricao: '',
    dataRegistro: new Date().toISOString().split('T')[0]
  });

  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Busca independente para não travar
      const fetchExt = axios.get('/api/extraviados').catch(err => { console.error("Erro ao buscar extraviados", err); return { data: [] }; });
      const fetchMil = axios.get('/api/militares').catch(err => { console.error("Erro ao buscar militares", err); return { data: [] }; });
      const fetchEq = axios.get('/api/equipamentos').catch(err => { console.error("Erro ao buscar equipamentos", err); return { data: [] }; });

      const [extRes, milRes, eqRes] = await Promise.all([fetchExt, fetchMil, fetchEq]);
      
      if (extRes.data) setExtraviados(extRes.data);
      if (milRes.data) setMilitares(milRes.data);
      if (eqRes.data) setEquipamentos(eqRes.data);
    } catch (e) {
      console.error("Erro crítico no fetchData", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.militarId || !formData.equipamentoId) {
      alert("Por favor, selecione um militar e um equipamento.");
      return;
    }
    try {
      await axios.post('/api/extraviados', formData);
      alert("Registro de extravio criado com sucesso!");
      setFormData({
        militarId: '',
        equipamentoId: '',
        boNumero: '',
        descricao: '',
        dataRegistro: new Date().toISOString().split('T')[0]
      });
      fetchData();
      setViewMode('list');
    } catch (e) {
      console.error(e);
      alert("Erro ao criar registro.");
    }
  };

  const confirmDelete = async () => {
    if (!idToDelete) return;
    try {
      await axios.delete(`/api/extraviados/${idToDelete}`);
      setIsModalDeleteOpen(false);
      setIdToDelete(null);
      fetchData();
    } catch (e) {
      console.error(e);
    }
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
      return ex.militar.nome.toLowerCase().includes(term) || 
             ex.equipamento.rp?.toLowerCase().includes(term) ||
             ex.equipamento.numSerie?.toLowerCase().includes(term) ||
             ex.boNumero.toLowerCase().includes(term);
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
            onClick={() => { setViewMode('form'); setBuscaMilitar(''); setBuscaEquipamento(''); }}
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
                  <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937] text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#1f2937]">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center animate-pulse text-gray-400 italic">Carregando dados...</td></tr>
                ) : extraviadosFiltrados.map(ex => (
                  <tr key={ex.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2937]/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-danger uppercase">{ex.equipamento.rp || 'S/RP'}</span>
                        <span className="text-[10px] text-gray-400 font-mono uppercase">{ex.equipamento.numSerie}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="text-gray-900 dark:text-white font-medium uppercase">{ex.militar.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{ex.boNumero}</td>
                    <td className="px-6 py-4 text-xs font-medium">
                      {new Date(ex.dataRegistro).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => { setIdToDelete(ex.id); setIsModalDeleteOpen(true); }}
                        className="text-gray-400 hover:text-danger p-2 rounded-lg transition-colors hover:bg-danger/10 opacity-0 group-hover:opacity-100"
                        title="Remover Registro"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {extraviadosFiltrados.length === 0 && !loading && (
                  <tr><td colSpan={5} className="px-6 py-16 text-center text-gray-500 italic">Nenhum registro encontrado.</td></tr>
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
              
              {/* PESQUISA MILITAR */}
              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <User size={16} />
                  1. Militar Responsável
                </label>
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Pesquisar militar (Nome ou RG)..." 
                      className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#1f2937] rounded-lg pl-9 pr-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      value={buscaMilitar}
                      onChange={(e) => setBuscaMilitar(e.target.value)}
                    />
                  </div>
                  <div className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#1f2937] rounded-lg h-48 overflow-y-auto p-1 space-y-1">
                    {militaresFiltrados.map(m => (
                      <div 
                        key={m.id}
                        onClick={() => setFormData({...formData, militarId: m.id})}
                        className={`px-3 py-2 text-xs rounded-lg cursor-pointer transition-all border ${formData.militarId === m.id ? 'bg-primary/20 border-primary font-bold text-primary shadow-sm' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                      >
                        {m.rg} - {m.nome}
                      </div>
                    ))}
                    {militaresFiltrados.length === 0 && <div className="p-4 text-center text-gray-500 text-[10px] italic">Nenhum militar encontrado</div>}
                  </div>
                </div>
              </div>

              {/* PESQUISA EQUIPAMENTO */}
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
                      className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#1f2937] rounded-lg pl-9 pr-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
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
                          <span className="text-[9px] opacity-60 font-normal">RP: {eq.rp || 'S/RP'} | {eq.modelo}</span>
                        </div>
                      );
                    })}
                    {equipamentosFiltrados.length === 0 && <div className="p-4 text-center text-gray-500 text-[10px] italic">Nenhum rádio encontrado</div>}
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
                  className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#1f2937] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">4. Data do Registro</label>
                <input 
                  type="date" 
                  required
                  value={formData.dataRegistro}
                  onChange={(e) => setFormData({...formData, dataRegistro: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">5. Descrição do Ocorrido</label>
                <textarea 
                  rows={4}
                  placeholder="Detalhe as circunstâncias do extravio, local e envolvidos..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#1f2937] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
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
        title="Remover Registro de Extravio"
        message="Tem certeza que deseja remover este registro? O equipamento voltará a aparecer na listagem geral. Esta ação não apaga o B.O, apenas remove o status de extraviado do sistema."
        onConfirm={confirmDelete}
        onCancel={() => { setIsModalDeleteOpen(false); setIdToDelete(null); }}
      />
    </div>
  );
};

export default Extraviados;
