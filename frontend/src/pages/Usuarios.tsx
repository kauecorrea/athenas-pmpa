import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  User, 
  List,
  Key,
  Shield,
  ShieldCheck
} from 'lucide-react';
import ModalConfirmacao from '../components/ModalConfirmacao';

interface Usuario {
  id: string;
  nomeCompleto: string;
  nomeGuerra: string;
  email: string;
  permissao: string;
  posto?: string;
  unidade?: string;
}

const Usuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [busca, setBusca] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    nomeCompleto: '',
    nomeGuerra: '',
    email: '',
    senha: '',
    permissao: 'Operador',
    posto: '',
    unidade: 'DITEL'
  });

  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/usuarios');
      setUsuarios(res.data);
    } catch (e) {
      console.error("Erro ao buscar usuários:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`/api/usuarios/${formData.id}`, formData);
        alert("Dados do operador atualizados!");
      } else {
        await axios.post('/api/usuarios', formData);
        alert("Operador cadastrado com sucesso!");
      }
      resetForm();
      fetchUsuarios();
      setViewMode('list');
    } catch (e: any) {
      console.error(e);
      alert(`Erro ao salvar: ${e.response?.data?.error || e.message}`);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setFormData({ 
      id: '', 
      nomeCompleto: '', 
      nomeGuerra: '', 
      email: '', 
      senha: '', 
      permissao: 'Operador',
      posto: '',
      unidade: 'DITEL'
    });
  };

  const openEdit = (u: Usuario) => {
    setIsEditing(true);
    setFormData({ 
      id: u.id,
      nomeCompleto: u.nomeCompleto,
      nomeGuerra: u.nomeGuerra,
      email: u.email,
      permissao: u.permissao,
      posto: u.posto || '',
      unidade: u.unidade || 'DITEL',
      senha: '' 
    });
    setViewMode('form');
  };

  const confirmExcluir = async () => {
    if (!usuarioToDelete) return;
    try {
      await axios.delete(`/api/usuarios/${usuarioToDelete.id}`);
      setIsModalDeleteOpen(false);
      setUsuarioToDelete(null);
      fetchUsuarios();
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir usuário.");
    }
  };

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(u => 
      u.nomeCompleto.toLowerCase().includes(busca.toLowerCase()) || 
      u.nomeGuerra.toLowerCase().includes(busca.toLowerCase()) ||
      u.email.toLowerCase().includes(busca.toLowerCase())
    );
  }, [usuarios, busca]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in text-gray-900 dark:text-white h-full flex flex-col relative transition-colors duration-200">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-surface p-6 rounded-2xl border border-gray-100 dark:border-[#1f2937] shadow-sm">
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
            className="flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={20} />
            Novo Usuário
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
          <div className="p-4 border-b border-gray-200 dark:border-[#1f2937] flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nome, guerra ou e-mail..." 
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#1f2937] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-primary outline-none transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-[#0b101a] text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Operador</th>
                  <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Posto / Unidade</th>
                  <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">E-mail / Login</th>
                  <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Nível</th>
                  <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937] text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#1f2937]">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center animate-pulse text-gray-400 italic">Carregando usuários...</td></tr>
                ) : (
                  usuariosFiltrados.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2937]/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shadow-inner">
                            {u.nomeGuerra?.charAt(0) || u.nomeCompleto?.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 dark:text-white uppercase leading-tight">{u.nomeGuerra}</span>
                            <span className="text-[10px] text-gray-400 font-medium truncate max-w-[150px]">{u.nomeCompleto}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <span className="text-gray-600 dark:text-gray-400 font-medium">{u.posto || '-'}</span>
                         <span className="block text-[10px] text-gray-400 italic">{u.unidade || 'POLÍCIA MILITAR'}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-500">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-[10px] font-bold tracking-wider rounded-full border flex items-center gap-1 w-fit ${
                          u.permissao === 'Administrador' ? 'bg-danger/10 text-danger border-danger/20' : 'bg-success/10 text-success border-success/20'
                        }`}>
                          {u.permissao === 'Administrador' ? <ShieldCheck size={10} /> : <Shield size={10} />}
                          {u.permissao.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openEdit(u)}
                            className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                            title="Editar Perfil"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => { setUsuarioToDelete(u); setIsModalDeleteOpen(true); }}
                            className="p-2 text-gray-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-all"
                            title="Excluir Usuário"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                {!loading && usuariosFiltrados.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-16 text-center text-gray-500 italic">Nenhum operador encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col overflow-hidden transition-colors shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-[#1f2937] flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEditing ? 'Editar Perfil de Operador' : 'Cadastrar Novo Operador'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure o acesso e permissões para novos usuários do sistema.</p>
          </div>
          
          <form onSubmit={handleSalvar} className="p-8 overflow-y-auto flex-1 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  value={formData.nomeCompleto}
                  onChange={(e) => setFormData({...formData, nomeCompleto: e.target.value.toUpperCase()})}
                  className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#1f2937] rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Nome de Guerra</label>
                <input 
                  type="text" 
                  required
                  value={formData.nomeGuerra}
                  onChange={(e) => setFormData({...formData, nomeGuerra: e.target.value.toUpperCase()})}
                  placeholder="Ex: MAJ QOPM KAUÊ"
                  className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#1f2937] rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">E-mail / Login</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})}
                  className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#1f2937] rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Senha {isEditing && '(Opcional na edição)'}</label>
                <div className="relative">
                  <input 
                    type="password" 
                    required={!isEditing}
                    value={formData.senha}
                    onChange={(e) => setFormData({...formData, senha: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#374151] rounded-lg pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Posto / Graduação</label>
                  <select 
                    required
                    value={formData.posto}
                    onChange={(e) => setFormData({...formData, posto: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#1f2937] rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                  >
                    <option value="">Selecione...</option>
                    <option value="VC">VC (VOLUNTÁRIO CIVIL)</option>
                    <option value="SD">SD (SOLDADO)</option>
                    <option value="CB">CB (CABO)</option>
                    <option value="3º SGT">3º SGT (SARGENTO)</option>
                    <option value="2º SGT">2º SGT (SARGENTO)</option>
                    <option value="1º SGT">1º SGT (SARGENTO)</option>
                    <option value="SUB TEN">SUB TEN (SUBTENENTE)</option>
                    <option value="2º TEN">2º TEN (TENENTE)</option>
                    <option value="1º TEN">1º TEN (TENENTE)</option>
                    <option value="CAP">CAP (CAPITÃO)</option>
                    <option value="MAJ">MAJ (MAJOR)</option>
                    <option value="TC">TC (TENENTE CORONEL)</option>
                    <option value="COL">COL (CORONEL)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Nível de Acesso</label>
                  <select 
                    className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-[#1f2937] rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    value={formData.permissao}
                    onChange={(e) => setFormData({...formData, permissao: e.target.value})}
                  >
                    <option value="Operador">Operador (Limite de acesso)</option>
                    <option value="Administrador">Administrador (Total)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-10 border-t border-gray-100 dark:border-[#1f2937]">
              {isEditing && (
                <button 
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                >
                  Cancelar
                </button>
              )}
              <button 
                type="submit"
                className="px-10 py-3 text-base font-bold text-white bg-primary hover:bg-blue-600 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95"
              >
                {isEditing ? 'Salvar Alterações' : 'Finalizar Cadastro'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ModalConfirmacao 
        isOpen={isModalDeleteOpen}
        title="Excluir Usuário"
        message={`Deseja realmente remover o acesso de ${usuarioToDelete?.nomeGuerra}? Esta ação é irreversível.`}
        onConfirm={confirmExcluir}
        onCancel={() => { setIsModalDeleteOpen(false); setUsuarioToDelete(null); }}
        confirmText="Sim, Excluir"
      />
    </div>
  );
};

export default Usuarios;
