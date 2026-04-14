import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  User, 
  List,
  Key
} from 'lucide-react';
import ModalConfirmacao from '../components/ModalConfirmacao';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: string;
}

const Usuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'form' | 'list'>('form');
  const [busca, setBusca] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    nome: '',
    email: '',
    password: '',
    role: 'USER'
  });

  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/users');
      setUsuarios(res.data);
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
        await axios.put(`/api/users/${formData.id}`, formData);
        alert("Usuário atualizado!");
      } else {
        await axios.post('/api/users', formData);
        alert("Usuário cadastrado com sucesso!");
      }
      resetForm();
      fetchUsuarios();
      setViewMode('list');
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar usuário.");
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setFormData({ id: '', nome: '', email: '', password: '', role: 'USER' });
  };

  const openEdit = (u: Usuario) => {
    setIsEditing(true);
    setFormData({ ...u, password: '' });
    setViewMode('form');
  };

  const confirmExcluir = async () => {
    if (!usuarioToDelete) return;
    try {
      await axios.delete(`/api/users/${usuarioToDelete.id}`);
      setIsModalDeleteOpen(false);
      setUsuarioToDelete(null);
      fetchUsuarios();
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir usuário.");
    }
  };

  const usuariosFiltrados = usuarios.filter(u => 
    u.nome.toLowerCase().includes(busca.toLowerCase()) || 
    u.email.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in text-gray-900 dark:text-white h-full flex flex-col relative transition-colors duration-200">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white dark:bg-surface p-6 rounded-2xl border border-gray-100 dark:border-[#1f2937] shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <User className="text-primary" size={32} />
            Gestão de Usuários
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Administração de operadores e permissões do sistema</p>
        </div>
        {viewMode === 'list' ? (
          <button 
            onClick={() => { resetForm(); setViewMode('form'); }}
            className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={20} />
            Novo Usuário
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
            <div className="relative flex-1 max-md:hidden max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nome ou e-mail..." 
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>

          <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-[#0b101a] text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Operador</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">E-mail / Login</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Nível</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1f2937]">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center animate-pulse">Carregando usuários...</td></tr>
              ) : usuariosFiltrados.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2937]/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">{u.nome.charAt(0)}</div>
                      <span className="font-bold text-gray-900 dark:text-white uppercase">{u.nome}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-full border ${
                      u.role === 'ADMIN' ? 'bg-danger/10 text-danger border-danger/20' : 'bg-success/10 text-success border-success/20'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEdit(u)}
                        className="hover:text-primary p-1.5 rounded-lg transition-colors hover:bg-primary/10"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => { setUsuarioToDelete(u); setIsModalDeleteOpen(true); }}
                        className="hover:text-danger p-1.5 rounded-lg transition-colors hover:bg-danger/10"
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
      ) : (
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col overflow-hidden transition-colors shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-[#1f2937] flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEditing ? 'Editar Perfil de Operador' : 'Cadastrar Novo Operador'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure o acesso e permissões para novos usuários do sistema.</p>
          </div>
          
          <form onSubmit={handleSalvar} className="p-6 overflow-y-auto flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">E-mail / Login</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Senha {isEditing && '(Deixe em branco para manter)'}</label>
                <div className="relative">
                  <input 
                    type="password" 
                    required={!isEditing}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg pl-10 pr-4 py-2.5 text-sm"
                  />
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nível de Acesso</label>
                <select 
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="USER">Operador (USER)</option>
                  <option value="ADMIN">Administrador (ADMIN)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-[#1f2937]">
              {isEditing && (
                <button 
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors font-bold"
                >
                  Cancelar
                </button>
              )}
              <button 
                type="submit"
                className="px-8 py-2.5 text-sm font-medium text-white bg-primary hover:bg-blue-600 rounded-lg transition-colors shadow-lg shadow-blue-600/20 font-bold"
              >
                {isEditing ? 'Salvar Alterações' : 'Cadastrar Usuário'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ModalConfirmacao 
        isOpen={isModalDeleteOpen}
        title="Excluir Usuário"
        message={`Deseja realmente remover o acesso de ${usuarioToDelete?.nome}? ele não poderá mais logar no sistema.`}
        onConfirm={confirmExcluir}
        onCancel={() => { setIsModalDeleteOpen(false); setUsuarioToDelete(null); }}
      />
    </div>
  );
};

export default Usuarios;
