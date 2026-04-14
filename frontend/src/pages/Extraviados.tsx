import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Search, 
  Trash2, 
  ShieldOff, 
  List
} from 'lucide-react';
import ModalConfirmacao from '../components/ModalConfirmacao';

interface Equipamento {
  id: string;
  rp: string;
  numSerie: string;
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
      const [extRes, milRes, eqRes] = await Promise.all([
        axios.get('/api/extraviados'),
        axios.get('/api/militares'),
        axios.get('/api/equipamentos')
      ]);
      setExtraviados(extRes.data);
      setMilitares(milRes.data);
      setEquipamentos(eqRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const extraviadosFiltrados = extraviados.filter(ex => {
    return ex.militar.nome.toLowerCase().includes(busca.toLowerCase()) || 
           ex.equipamento.rp.toLowerCase().includes(busca.toLowerCase()) ||
           ex.boNumero.includes(busca);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in text-gray-900 dark:text-white h-full flex flex-col relative transition-colors duration-200">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white dark:bg-surface p-6 rounded-2xl border border-gray-100 dark:border-[#1f2937] shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <ShieldOff className="text-danger" size={32} />
            Equipamentos Extraviados
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Controle e rastreio de bens não localizados ou com B.O de extravio</p>
        </div>
        {viewMode === 'list' ? (
          <button 
            onClick={() => setViewMode('form')}
            className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={20} />
            Registrar Extravio
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

      {viewMode === 'list' ? (
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col overflow-hidden transition-colors">
          <div className="p-4 border-b border-gray-200 dark:border-[#1f2937] flex items-center justify-between gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[300px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por militar, patrimônio ou B.O..." 
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-[#0b101a] text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Patrimônio</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Militar Responsável</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Nº do B.O</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Data do Registro</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1f2937]">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center animate-pulse">Carregando dados...</td></tr>
              ) : extraviadosFiltrados.map(ex => (
                <tr key={ex.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2937]/30 transition-colors group">
                  <td className="px-6 py-4 font-bold text-danger uppercase">{ex.equipamento.rp}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium uppercase">{ex.militar.nome}</td>
                  <td className="px-6 py-4 font-mono text-xs">{ex.boNumero}</td>
                  <td className="px-6 py-4 text-xs">
                    {new Date(ex.dataRegistro).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => { setIdToDelete(ex.id); setIsModalDeleteOpen(true); }}
                      className="text-gray-400 hover:text-danger p-2 rounded-lg transition-colors hover:bg-danger/10 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {extraviadosFiltrados.length === 0 && !loading && (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500 italic">Nenhum registro encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col overflow-hidden transition-colors shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-[#1f2937] flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Registrar Novo Extravio</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Informe os dados do militar e do equipamento para baixa por extravio ou perda.</p>
          </div>
          
          <form onSubmit={handleCreate} className="p-6 overflow-y-auto flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Militar Responsável</label>
                <select 
                  required
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  value={formData.militarId}
                  onChange={(e) => setFormData({...formData, militarId: e.target.value})}
                >
                  <option value="">Selecione o militar</option>
                  {militares.map(m => (
                    <option key={m.id} value={m.id}>{m.rg} - {m.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Equipamento (Patrimônio)</label>
                <select 
                  required
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  value={formData.equipamentoId}
                  onChange={(e) => setFormData({...formData, equipamentoId: e.target.value})}
                >
                  <option value="">Selecione o equipamento</option>
                  {equipamentos.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.rp} - {eq.marca} {eq.modelo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Número do B.O</label>
                <input 
                  type="text" 
                  required
                  placeholder="EX: 00123/2023.100456-7"
                  value={formData.boNumero}
                  onChange={(e) => setFormData({...formData, boNumero: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Data do Registro</label>
                <input 
                  type="date" 
                  required
                  value={formData.dataRegistro}
                  onChange={(e) => setFormData({...formData, dataRegistro: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descrição do Ocorrido</label>
                <textarea 
                  rows={4}
                  placeholder="Detalhe as circunstâncias do extravio..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-[#1f2937]">
              <button 
                type="submit"
                className="px-8 py-2.5 text-sm font-medium text-white bg-primary hover:bg-blue-600 rounded-lg transition-colors shadow-lg shadow-blue-600/20"
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
