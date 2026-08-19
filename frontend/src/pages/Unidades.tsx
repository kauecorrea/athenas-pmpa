import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Building2, 
  List,
  MapPin
} from 'lucide-react';
import ModalConfirmacao from '../components/ModalConfirmacao';
import Toast from '../components/Toast';
import type { ToastType } from '../components/Toast';

interface Unidade {
  id: string;
  nome: string;
  coint: string;
  localizacao: string;
  contato: string;
}

const Unidades: React.FC = () => {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'form' | 'list'>('form');
  const [busca, setBusca] = useState('');
  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    nome: '',
    coint: '',
    localizacao: '',
    contato: ''
  });

  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [unidadeToDelete, setUnidadeToDelete] = useState<Unidade | null>(null);

  useEffect(() => {
    fetchUnidades();
  }, []);

  const fetchUnidades = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/unidades');
      setUnidades(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`/api/unidades/${formData.id}`, formData);
        showToast("Unidade atualizada com sucesso!", "success");
      } else {
        await axios.post('/api/unidades', formData);
        showToast("Unidade cadastrada com sucesso!", "success");
      }
      resetForm();
      fetchUnidades();
      setViewMode('list');
    } catch (e: any) {
      console.error(e);
      const errorMessage = e.response?.data?.error || "Erro ao salvar unidade.";
      showToast(errorMessage, "error");
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setFormData({ id: '', nome: '', coint: '', localizacao: '', contato: '' });
  };

  const openEdit = (u: Unidade) => {
    setIsEditing(true);
    setFormData(u);
    setViewMode('form');
  };

  const confirmExcluir = async () => {
    if (!unidadeToDelete) return;
    try {
      await axios.delete(`/api/unidades/${unidadeToDelete.id}`);
      setIsModalDeleteOpen(false);
      setUnidadeToDelete(null);
      fetchUnidades();
      showToast("Unidade excluída com sucesso!", "success");
    } catch (e: any) {
      console.error(e);
      const errorMessage = e.response?.data?.error || "Erro ao excluir unidade. Ela pode estar vinculada a militares ou equipamentos.";
      showToast(errorMessage, "error");
    }
  };

  const unidadesFiltradas = unidades.filter(u => {
    const nomeMatch = u.nome?.toLowerCase().includes(busca.toLowerCase());
    const localizacaoMatch = u.localizacao?.toLowerCase().includes(busca.toLowerCase());
    return nomeMatch || localizacaoMatch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in text-gray-900 dark:text-white h-full flex flex-col relative transition-colors duration-200">
      
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center bg-white dark:bg-surface p-6 rounded-2xl border border-gray-100 dark:border-[#1f2937] shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Building2 className="text-primary" size={32} />
            Unidades da Corporação
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gestão de Batalhões, Companhias e Postos</p>
        </div>
        {viewMode === 'list' ? (
          <button 
            onClick={() => { resetForm(); setViewMode('form'); }}
            className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={20} />
            Nova Unidade
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
          <div className="p-4 border-b border-gray-200 dark:border-[#1f2937] flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nome ou localização..." 
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">

          <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-[#0b101a] text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Nome da Unidade</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">COINT</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Localização</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Contato</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1f2937]">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center animate-pulse">Carregando unidades...</td></tr>
              ) : unidadesFiltradas.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2937]/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">{u.nome.charAt(0)}</div>
                      <span className="font-bold text-gray-900 dark:text-white uppercase">{u.nome}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-500">{u.coint || 'N/A'}</td>
                  <td className="px-6 py-4 text-xs">
                    <div className="flex items-center gap-1">
                      <MapPin size={12} className="text-gray-400" />
                      {u.localizacao || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs italic">{u.contato || 'N/A'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEdit(u)}
                        className="hover:text-primary p-1.5 rounded-lg transition-colors hover:bg-primary/10"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => { setUnidadeToDelete(u); setIsModalDeleteOpen(true); }}
                        className="hover:text-danger p-1.5 rounded-lg transition-colors hover:bg-danger/10"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {unidadesFiltradas.length === 0 && !loading && (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500 italic">Nenhuma unidade encontrada.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col overflow-hidden transition-colors shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-[#1f2937] flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEditing ? 'Editar Unidade' : 'Cadastrar Nova Unidade'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gerencie os pontos de atuação da corporação.</p>
          </div>
          
          <form onSubmit={handleSalvar} className="p-6 overflow-y-auto flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Nome da Unidade <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="EX: 1º BPM, DPT, CPR I"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value.toUpperCase()})}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  COINT (Comando Intermediário) <span className="text-gray-400 font-normal italic">- Opcional</span>
                </label>
                <input 
                  type="text" 
                  placeholder="EX: QCG, CPA, CPC I"
                  value={formData.coint}
                  onChange={(e) => setFormData({...formData, coint: e.target.value.toUpperCase()})}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Localização (Cidade/Bairro)</label>
                <input 
                  type="text" 
                  value={formData.localizacao}
                  onChange={(e) => setFormData({...formData, localizacao: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Contato / Ramal</label>
                <input 
                  type="text" 
                  value={formData.contato}
                  onChange={(e) => setFormData({...formData, contato: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-[#1f2937]">
              {isEditing && (
                <button 
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              )}
              <button 
                type="submit"
                className="px-8 py-2.5 text-sm font-medium text-white bg-primary hover:bg-blue-600 rounded-lg transition-colors shadow-lg shadow-blue-600/20"
              >
                {isEditing ? 'Salvar Alterações' : 'Cadastrar Unidade'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ModalConfirmacao 
        isOpen={isModalDeleteOpen}
        title="Excluir Unidade"
        message={`Você tem certeza que deseja remover a unidade ${unidadeToDelete?.nome}? Esta ação é irreversível.`}
        onConfirm={confirmExcluir}
        onCancel={() => { setIsModalDeleteOpen(false); setUnidadeToDelete(null); }}
      />
    </div>
  );
};

export default Unidades;
