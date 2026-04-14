import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  List,
  Shield
} from 'lucide-react';
import ModalConfirmacao from '../components/ModalConfirmacao';

interface Militar {
  id: string;
  rg: string;
  nome: string;
  cpf: string;
  graduacao: string;
  contato: string;
}

const Militares: React.FC = () => {
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'form' | 'list'>('form');
  const [busca, setBusca] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    rg: '',
    nome: '',
    cpf: '',
    graduacao: 'SD PM',
    contato: ''
  });

  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [militarToDelete, setMilitarToDelete] = useState<Militar | null>(null);

  useEffect(() => {
    fetchMilitares();
  }, []);

  const fetchMilitares = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/militares');
      setMilitares(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`/api/militares/${formData.id}`, formData);
        alert("Dados do militar atualizados!");
      } else {
        await axios.post('/api/militares', formData);
        alert("Militar cadastrado com sucesso!");
      }
      resetForm();
      fetchMilitares();
      setViewMode('list');
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar militar. Verifique se o RG ou CPF já existem.");
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setFormData({ id: '', rg: '', nome: '', cpf: '', graduacao: 'SD PM', contato: '' });
  };

  const openEdit = (m: Militar) => {
    setIsEditing(true);
    setFormData(m);
    setViewMode('form');
  };

  const confirmExcluir = async () => {
    if (!militarToDelete) return;
    try {
      await axios.delete(`/api/militares/${militarToDelete.id}`);
      setIsModalDeleteOpen(false);
      setMilitarToDelete(null);
      fetchMilitares();
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir militar. Ele pode estar vinculado a cautelas.");
    }
  };

  const militaresFiltrados = militares.filter(m => 
    m.nome.toLowerCase().includes(busca.toLowerCase()) || 
    m.rg.includes(busca) || 
    m.cpf.includes(busca)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in text-gray-900 dark:text-white h-full flex flex-col relative transition-colors duration-200">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white dark:bg-surface p-6 rounded-2xl border border-gray-100 dark:border-[#1f2937] shadow-sm transition-colors">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Shield className="text-primary" size={32} />
            Efetivo de Militares
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Cadastro de policiais para cautelas e Transferências</p>
        </div>
        {viewMode === 'list' ? (
          <button 
            onClick={() => { resetForm(); setViewMode('form'); }}
            className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={20} />
            Cadastrar Militar
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
                placeholder="Buscar por nome, RG ou CPF..." 
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>

          <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-[#0b101a] text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Posto/Grad</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">RG</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Nome Completo</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Contato</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1f2937]">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center animate-pulse">Carregando efetivo...</td></tr>
              ) : militaresFiltrados.map(m => (
                <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2937]/30 transition-colors group">
                  <td className="px-6 py-4 font-bold text-primary">{m.graduacao}</td>
                  <td className="px-6 py-4 font-mono text-xs">{m.rg}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white uppercase">{m.nome}</td>
                  <td className="px-6 py-4 text-xs">{m.contato || 'N/A'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEdit(m)}
                        className="hover:text-primary p-1.5 rounded-lg transition-colors hover:bg-primary/10"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => { setMilitarToDelete(m); setIsModalDeleteOpen(true); }}
                        className="hover:text-danger p-1.5 rounded-lg transition-colors hover:bg-danger/10"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {militaresFiltrados.length === 0 && !loading && (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500 italic">Nenhum militar encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col overflow-hidden transition-colors shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-[#1f2937] flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEditing ? 'Editar Militar' : 'Cadastrar Novo Militar'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Preencha os dados de identificação do policial.</p>
          </div>
          
          <form onSubmit={handleSalvar} className="p-6 overflow-y-auto flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">RG PM</label>
                <input 
                  type="text" 
                  required
                  value={formData.rg}
                  onChange={(e) => setFormData({...formData, rg: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">CPF</label>
                <input 
                  type="text" 
                  required
                  value={formData.cpf}
                  onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value.toUpperCase()})}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Posto / Graduação</label>
                <select 
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm"
                  value={formData.graduacao}
                  onChange={(e) => setFormData({...formData, graduacao: e.target.value})}
                >
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Contato (Telefone/WhatsApp)</label>
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
                {isEditing ? 'Salvar Alterações' : 'Cadastrar Militar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ModalConfirmacao 
        isOpen={isModalDeleteOpen}
        title="Excluir Militar"
        message={`Você tem certeza que deseja remover ${militarToDelete?.nome} do sistema? Esta ação é irreversível.`}
        onConfirm={confirmExcluir}
        onCancel={() => { setIsModalDeleteOpen(false); setMilitarToDelete(null); }}
      />
    </div>
  );
};

export default Militares;
