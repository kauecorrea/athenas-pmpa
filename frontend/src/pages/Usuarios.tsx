import React, { useState } from 'react';
import { Plus, ShieldOff, Trash2 } from 'lucide-react';

interface MockUsuario {
  id: number;
  nomeCompleto: string;
  nomeGuerra: string;
  permissao: string;
  dataCadastro: string;
}

const Usuarios: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mocks explicitly matching the provided image
  const usuariosPlaceholder: MockUsuario[] = [
    {
      id: 1,
      nomeCompleto: 'Kauê Henrique Corrêa Palheta',
      nomeGuerra: 'Kauê',
      permissao: 'Administrador',
      dataCadastro: '12/11/2025'
    },
    {
      id: 2,
      nomeCompleto: 'Mauro Antônio Da Gama Lopes',
      nomeGuerra: 'Mauro Lopes',
      permissao: 'Administrador',
      dataCadastro: '12/11/2025'
    },
    {
      id: 3,
      nomeCompleto: 'Andrew Lameira Batista',
      nomeGuerra: 'Lameira',
      permissao: 'Administrador',
      dataCadastro: '12/11/2025'
    },
    {
      id: 4,
      nomeCompleto: 'Marcos André Ramos De Souza',
      nomeGuerra: 'Marcos',
      permissao: 'Administrador',
      dataCadastro: '30/10/2025'
    }
  ];

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
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus size={18} />
          Novo Usuário
        </button>
      </div>

      {/* TABELA DE USUÁRIOS */}
      <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col overflow-hidden transition-colors">
        <div className="flex-1 overflow-auto z-0">
          <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
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
              {usuariosPlaceholder.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2937]/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{u.nomeCompleto}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{u.nomeGuerra}</td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                    <span className="px-3 py-1 text-xs font-bold text-blue-600 bg-blue-500/10 border border-blue-500/20 rounded-full">
                      {u.permissao}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{u.dataCadastro}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3 text-gray-400 dark:text-gray-500">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-[#374151] hover:bg-gray-100 dark:hover:bg-[#1f2937] rounded transition-colors">
                        <ShieldOff size={14} />
                        Remover Admin
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-danger bg-danger/10 hover:bg-danger hover:text-white border border-danger/20 rounded transition-colors">
                        <Trash2 size={14} />
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NOVO USUÁRIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl w-full max-w-[500px] shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-[#1f2937] flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Criar Novo Usuário</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Adicione um novo usuário ao sistema. Apenas administradores podem criar contas.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome Completo</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome de Guerra</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                <input 
                  type="email" 
                  placeholder="usuario@email.com"
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Senha</label>
                <input 
                  type="password"
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

            </div>

            <div className="p-6 border-t border-gray-200 dark:border-[#1f2937] flex items-center justify-end gap-3 flex-shrink-0">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#1f2937] rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-lg shadow-blue-600/20"
              >
                Criar Usuário
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Usuarios;
