import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, ShieldOff, Shield, Trash2, List } from 'lucide-react';
import ModalConfirmacao from '../components/ModalConfirmacao';

interface Usuario {
  id: string;
  nomeCompleto: string;
  nomeGuerra: string;
  email: string;
  permissao: string;
  dataCadastro: string;
}

const Usuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [viewMode, setViewMode] = useState<'form' | 'list'>('form');
  
  // Create Form States
  const [novoUsuario, setNovoUsuario] = useState({
    nomeCompleto: '',
    nomeGuerra: '',
    email: '',
    senha: '',
    permissao: 'Administrador'
  });

  // Delete Modal States
  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [usuarioDeleteId, setUsuarioDeleteId] = useState<string | null>(null);
  const [usuarioDeleteNome, setUsuarioDeleteNome] = useState('');

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const res = await axios.get('/api/usuarios');
      setUsuarios(res.data);
    } catch (error) {
      console.error("Erro ao buscar usuários", error);
    }
  };

  const handleCreate = async () => {
    if (!novoUsuario.nomeCompleto || !novoUsuario.nomeGuerra || !novoUsuario.email || !novoUsuario.senha) {
      alert("Preencha todos os campos obrigatórios!");
      return;
    }
    try {
      await axios.post('/api/usuarios', novoUsuario);
      alert("Usuário registrado com sucesso!");
      setNovoUsuario({ nomeCompleto: '', nomeGuerra: '', email: '', senha: '', permissao: 'Administrador' });
      fetchUsuarios();
    } catch (error: any) {
      console.error("Erro ao criar", error);
      alert(error.response?.data?.error || "Erro ao criar usuário.");
    }
  };

  const handleTogglePermissao = async (id: string, currentPerm: string) => {
    const newPerm = currentPerm === 'Administrador' ? 'Comum' : 'Administrador';
    try {
      await axios.put(`/api/usuarios/${id}`, { permissao: newPerm });
      fetchUsuarios();
    } catch (error) {
      console.error("Erro ao alterar permissão", error);
    }
  };

  const openDeleteModal = (id: string, nome: string) => {
    setUsuarioDeleteId(id);
    setUsuarioDeleteNome(nome);
    setIsModalDeleteOpen(true);
  };

  const confirmExcluir = async () => {
    if (!usuarioDeleteId) return;
    try {
      await axios.delete(`/api/usuarios/${usuarioDeleteId}`);
      fetchUsuarios();
    } catch (error) {
      console.error("Erro ao excluir", error);
    } finally {
      setIsModalDeleteOpen(false);
      setUsuarioDeleteId(null);
    }
  };



  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in text-gray-900 dark:text-white h-full flex flex-col transition-colors duration-200">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
             Gerenciamento de Usuários
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie permissões e acesso dos usuários</p>
        </div>
        {viewMode === 'list' ? (
          <button 
            onClick={() => setViewMode('form')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus size={18} />
            Novo Usuário
          </button>
        ) : (
          <button 
            onClick={() => setViewMode('list')}
            className="flex items-center gap-2 bg-gray-100 dark:bg-surface border border-gray-300 dark:border-[#374151] hover:bg-gray-200 dark:hover:bg-[#1f2937] text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
          >
            <List size={18} />
             Consultar Registros
          </button>
        )}
      </div>

      {viewMode === 'list' ? (

      {/* TABELA DE USUÁRIOS */}
      <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col overflow-hidden transition-colors">
        {/* TABELA - Responsiva */}
        <div className="flex-1 overflow-auto overflow-x-auto scrolling-touch z-0">
          <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300 min-w-[700px]">
            <thead className="bg-gray-50 dark:bg-[#0b101a] text-gray-500 dark:text-gray-400 font-medium text-xs sticky top-0 z-0">
              <tr>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Nome Completo</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Nome de Guerra</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Permissão</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Data de Cadastro</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1f2937]">
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Nenhum usuário cadastrado.</td>
                </tr>
              ) : (
                usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2937]/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{u.nomeCompleto}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{u.nomeGuerra}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                        u.permissao === 'Administrador' 
                          ? 'text-blue-600 bg-blue-500/10 border border-blue-500/20' 
                          : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700'
                      }`}>
                        {u.permissao}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {new Date(u.dataCadastro).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3 text-gray-400 dark:text-gray-500">
                        <button 
                          onClick={() => handleTogglePermissao(u.id, u.permissao)}
                          className="flex items-center w-32 justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-[#374151] hover:bg-gray-100 dark:hover:bg-[#1f2937] rounded transition-colors"
                        >
                          {u.permissao === 'Administrador' ? (
                            <><ShieldOff size={14} /> Remover Admin</>
                          ) : (
                            <><Shield size={14} /> Tornar Admin</>
                          )}
                        </button>
                        <button 
                          onClick={() => openDeleteModal(u.id, u.nomeGuerra)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-danger bg-danger/10 hover:bg-danger hover:text-white border border-danger/20 rounded transition-colors"
                        >
                          <Trash2 size={14} />
                          Excluir
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

      </div>
      ) : (

        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col transition-colors">
          <div className="p-6 border-b border-gray-200 dark:border-[#1f2937] flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Criar Novo Usuário</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Adicione um novo usuário ao sistema. Apenas administradores podem criar contas.</p>
          </div>
          
          <div className="p-6 overflow-y-auto space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome Completo</label>
                <input 
                  type="text" 
                  value={novoUsuario.nomeCompleto}
                  onChange={(e) => setNovoUsuario({...novoUsuario, nomeCompleto: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome de Guerra</label>
                <input 
                  type="text" 
                  value={novoUsuario.nomeGuerra}
                  onChange={(e) => setNovoUsuario({...novoUsuario, nomeGuerra: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email / Login</label>
                <input 
                  type="email" 
                  placeholder="usuario@pm.pa.gov.br"
                  value={novoUsuario.email}
                  onChange={(e) => setNovoUsuario({...novoUsuario, email: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Senha</label>
                  <input 
                    type="password"
                    value={novoUsuario.senha}
                    onChange={(e) => setNovoUsuario({...novoUsuario, senha: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nível de Acesso</label>
                  <select
                    value={novoUsuario.permissao}
                    onChange={(e) => setNovoUsuario({...novoUsuario, permissao: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Comum">Usuário Comum</option>
                  </select>
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-gray-200 dark:border-[#1f2937] flex items-center justify-end gap-3 flex-shrink-0 bg-gray-50 dark:bg-[#0b101a]">
              <button 
                onClick={handleCreate}
                className="px-8 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-lg shadow-blue-600/20"
              >
                Criar Usuário
              </button>
            </div>
        </div>
      )}

      {/* MODAL DE EXCLUSÃO */}
      <ModalConfirmacao 
        isOpen={isModalDeleteOpen}
        title="Excluir Usuário"
        message={`Tem certeza que deseja banir o acesso do usuário ${usuarioDeleteNome} ao Sistema Athenas?`}
        onConfirm={confirmExcluir}
        onCancel={() => { setIsModalDeleteOpen(false); setUsuarioDeleteId(null); }}
      />
    </div>
  );
};

export default Usuarios;
