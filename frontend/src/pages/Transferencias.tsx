import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Search, 
  Trash2, 
  ArrowRightLeft, 
  List
} from 'lucide-react';
import ModalConfirmacao from '../components/ModalConfirmacao';

interface Equipamento {
  id: string;
  rp: string;
  numSerie: string;
  marca: string;
  modelo: string;
  status: string;
}

interface Unidade {
  id: string;
  nome: string;
}

interface Transferencia {
  id: string;
  dataTransferencia: string;
  motivo: string;
  unidadeDestino: Unidade;
  equipamento: Equipamento;
}

const Transferencias: React.FC = () => {
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState<'form' | 'list'>('form');
  const [busca, setBusca] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    unidadeDestinoId: '',
    equipamentoId: '',
    motivo: '',
    dataTransferencia: new Date().toISOString().split('T')[0]
  });

  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transRes, uniRes, eqRes] = await Promise.all([
        axios.get('/api/transferencias'),
        axios.get('/api/unidades'),
        axios.get('/api/equipamentos?status=OPERACIONAL')
      ]);
      setTransferencias(transRes.data);
      setUnidades(uniRes.data);
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
      await axios.post('/api/transferencias', formData);
      alert("Transferência registrada com sucesso!");
      setFormData({
        unidadeDestinoId: '',
        equipamentoId: '',
        motivo: '',
        dataTransferencia: new Date().toISOString().split('T')[0]
      });
      fetchData();
      setViewMode('list');
    } catch (e) {
      console.error(e);
      alert("Erro ao registrar transferência.");
    }
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

  const transferenciasFiltradas = transferencias.filter(t => {
    return t.unidadeDestino.nome.toLowerCase().includes(busca.toLowerCase()) || 
           t.equipamento.rp.toLowerCase().includes(busca.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in text-gray-900 dark:text-white h-full flex flex-col relative transition-colors duration-200">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white dark:bg-surface p-6 rounded-2xl border border-gray-100 dark:border-[#1f2937] shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <ArrowRightLeft className="text-primary" size={32} />
            Transferências de Carga
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Movimentação oficial de equipamentos entre unidades</p>
        </div>
        {viewMode === 'list' ? (
          <button 
            onClick={() => setViewMode('form')}
            className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={20} />
            Nova Transferência
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
                placeholder="Buscar por unidade ou patrimônio..." 
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-[#0b101a] text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Equipamento</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Destino</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Data</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Motivo</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1f2937]">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center animate-pulse">Carregando dados...</td></tr>
              ) : transferenciasFiltradas.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2937]/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 dark:text-white uppercase">{t.equipamento.rp}</span>
                      <span className="text-[10px] text-gray-500">{t.equipamento.marca} {t.equipamento.modelo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-primary uppercase">{t.unidadeDestino.nome}</td>
                  <td className="px-6 py-4 font-mono text-xs">
                    {new Date(t.dataTransferencia).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-xs italic text-gray-500 max-w-[200px] truncate">{t.motivo}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => { setIdToDelete(t.id); setIsModalDeleteOpen(true); }}
                      className="text-gray-400 hover:text-danger p-2 rounded-lg transition-colors hover:bg-danger/10 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {transferenciasFiltradas.length === 0 && !loading && (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500 italic">Nenhum registro encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col overflow-hidden transition-colors shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-[#1f2937] flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Registrar Transferência</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Selecione o destino e o equipamento para movimentar a carga.</p>
          </div>
          
          <form onSubmit={handleCreate} className="p-6 overflow-y-auto flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Unidade de Destino</label>
                <select 
                  required
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm"
                  value={formData.unidadeDestinoId}
                  onChange={(e) => setFormData({...formData, unidadeDestinoId: e.target.value})}
                >
                  <option value="">Selecione a unidade</option>
                  {unidades.map(u => (
                    <option key={u.id} value={u.id}>{u.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Equipamento (Patrimônio)</label>
                <select 
                  required
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm"
                  value={formData.equipamentoId}
                  onChange={(e) => setFormData({...formData, equipamentoId: e.target.value})}
                >
                  <option value="">Selecione o rádio</option>
                  {equipamentos.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.rp} - {eq.marca} {eq.modelo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Data da Transferência</label>
                <input 
                  type="date" 
                  required
                  value={formData.dataTransferencia}
                  onChange={(e) => setFormData({...formData, dataTransferencia: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Motivo / Documento de Referência</label>
                <textarea 
                  rows={3}
                  placeholder="Informe o motivo ou número do ofício..."
                  value={formData.motivo}
                  onChange={(e) => setFormData({...formData, motivo: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-[#1f2937]">
              <button 
                type="submit"
                className="px-8 py-2.5 text-sm font-medium text-white bg-primary hover:bg-blue-600 rounded-lg transition-colors shadow-lg shadow-blue-600/20"
              >
                Confirmar Transferência
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL EXCLUIR */}
      <ModalConfirmacao 
        isOpen={isModalDeleteOpen}
        title="Estornar Transferência"
        message="Deseja realmente cancelar este registro de transferência? O rádio retornará ao status operacional na unidade de origem."
        onConfirm={confirmDelete}
        onCancel={() => { setIsModalDeleteOpen(false); setIdToDelete(null); }}
      />
    </div>
  );
};

export default Transferencias;
