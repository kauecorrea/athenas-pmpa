import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Edit2, Trash2, ChevronDown } from 'lucide-react';
import ModalConfirmacao from '../components/ModalConfirmacao';

interface Unidade {
  id: number;
  nome: string;
  sigla: string;
  coint?: string;
  localizacao?: string;
  _count?: {
    militares: number;
  };
}

const Unidades: React.FC = () => {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [unidadeDeleteId, setUnidadeDeleteId] = useState<number | null>(null);
  const [unidadeDeleteNome, setUnidadeDeleteNome] = useState('');
  
  const [buscaTratada, setBuscaTratada] = useState('');
  const [filtroLocalizacao, setFiltroLocalizacao] = useState('Todos - Localização');
  
  const [novaUnidade, setNovaUnidade] = useState<Partial<Unidade>>({
    nome: '',
    sigla: '',
    coint: '',
    localizacao: ''
  });

  useEffect(() => {
    fetchUnidades();
  }, []);

  const fetchUnidades = async () => {
    try {
      const res = await axios.get('http://localhost:3333/api/unidades');
      setUnidades(res.data);
    } catch (error) {
      console.error("Erro ao carregar unidades", error);
      // Fallback em caso de API offline
      setUnidades([
        { id: 1, nome: '25° CIPM', sigla: '25 CIPM', coint: 'XIV', localizacao: 'ELDORADO DOS CARAJÁS', _count: { militares: 0 } },
        { id: 2, nome: '40° BPM', sigla: '40 BPM', coint: 'XIV', localizacao: 'CANAÃ DOS CARAJÁS', _count: { militares: 0 } },
      ]);
    }
  };

  const openNovoModal = () => {
    setIsEditing(false);
    setNovaUnidade({ nome: '', sigla: '', coint: '', localizacao: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (unidade: Unidade) => {
    setIsEditing(true);
    setNovaUnidade({ ...unidade });
    setIsModalOpen(true);
  };

  const handleSalvar = async () => {
    if (!novaUnidade.nome) {
      alert("Preencha ao menos o campo Unidade (Nome)!");
      return;
    }
    
    // Auto-preencher sigla se vazio
    if (!novaUnidade.sigla) {
      novaUnidade.sigla = novaUnidade.nome.replace('°', '');
    }

    try {
      if (isEditing) {
        await axios.put(`http://localhost:3333/api/unidades/${novaUnidade.id}`, novaUnidade);
      } else {
        await axios.post('http://localhost:3333/api/unidades', novaUnidade);
      }
      setIsModalOpen(false);
      fetchUnidades();
    } catch (error) {
      console.error("Erro ao salvar unidade", error);
      alert("Ocorreu um erro ao salvar a unidade. Tente novamente.");
    }
  };

  const openDeleteModal = (id: number, nome: string) => {
    setUnidadeDeleteId(id);
    setUnidadeDeleteNome(nome);
    setIsModalDeleteOpen(true);
  };

  const confirmExcluir = async () => {
    if (!unidadeDeleteId) return;
    try {
      await axios.delete(`http://localhost:3333/api/unidades/${unidadeDeleteId}`);
      fetchUnidades();
    } catch (error: any) {
      console.error("Erro ao excluir", error);
      if (error.response && error.response.status === 400) {
        alert("Erro: Não é possível excluir uma unidade que possui militares cadastrados.");
      } else {
        alert("Erro ao excluir. Tente novamente.");
      }
    } finally {
      setIsModalDeleteOpen(false);
      setUnidadeDeleteId(null);
    }
  };

  // Obter todas as localizações únicas para o filtro
  const localizacoes = Array.from(new Set(unidades.map(u => u.localizacao).filter(Boolean))) as string[];

  // Lógica de Filtros
  const unidadesFiltradas = unidades.filter(u => {
    // Check Localização
    if (filtroLocalizacao !== 'Todos - Localização' && u.localizacao !== filtroLocalizacao) {
      return false;
    }

    // Check Busca Textual (por nome, sigla, localização ou coint)
    if (buscaTratada) {
      const searchStr = buscaTratada.toLowerCase();
      return (
        u.nome.toLowerCase().includes(searchStr) ||
        (u.sigla && u.sigla.toLowerCase().includes(searchStr)) ||
        (u.localizacao && u.localizacao.toLowerCase().includes(searchStr)) ||
        (u.coint && u.coint.toLowerCase().includes(searchStr))
      );
    }
    
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in text-gray-900 dark:text-white h-full flex flex-col transition-colors duration-200">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
             Unidades
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gerenciamento de unidades militares</p>
        </div>
        <button 
          onClick={openNovoModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus size={18} />
          Nova Unidade
        </button>
      </div>

      <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col overflow-hidden transition-colors">
        <div className="p-4 border-b border-gray-200 dark:border-[#1f2937] flex items-center justify-between gap-4 flex-wrap">
          
          <div className="relative flex-1 min-w-[300px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome, código, localização..." 
              value={buscaTratada}
              onChange={(e) => setBuscaTratada(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Filtro de Localização */}
            <div className="relative group cursor-pointer z-50">
              <div className="bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] hover:border-gray-400 dark:hover:border-gray-500 rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between gap-3 min-w-[200px] transition-colors">
                <span className="truncate">{filtroLocalizacao}</span>
                <ChevronDown size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
              </div>
              <div className="absolute top-full mt-1 w-full right-0 bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#374151] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-1 max-h-60 overflow-y-auto">
                <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer" onClick={() => setFiltroLocalizacao('Todos - Localização')}>Todos - Localização</div>
                {localizacoes.map(loc => (
                  <div key={loc} className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer" onClick={() => setFiltroLocalizacao(loc)}>
                    {loc}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
        
        <div className="flex-1 overflow-auto z-0">
          <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-[#0b101a] text-gray-500 dark:text-gray-400 font-medium text-xs sticky top-0 z-0">
              <tr>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Unidade</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Coint</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Localização</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Militares</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1f2937]">
              {unidadesFiltradas.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                     Nenhuma unidade encontrada.
                   </td>
                </tr>
              ) : (
                unidadesFiltradas.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2937]/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{u.nome}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-medium">{u.coint || '-'}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{u.localizacao || '-'}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      <span className="text-primary font-medium text-xs bg-primary/10 px-2 py-1 rounded-full">
                        {u._count?.militares || 0} militares
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 text-gray-400 dark:text-gray-500">
                        <button 
                          onClick={() => openEditModal(u)}
                          className="hover:text-gray-900 dark:hover:text-white p-1.5 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-white/5"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => openDeleteModal(u.id, u.nome)}
                          className="hover:text-danger p-1.5 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-danger/10"
                        >
                          <Trash2 size={16} />
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

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-200 dark:border-[#1f2937] flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEditing ? 'Editar Unidade' : 'Nova Unidade'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Preencha as informações da unidade</p>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Unidade</label>
                <input 
                  type="text" 
                  value={novaUnidade.nome}
                  onChange={e => setNovaUnidade({...novaUnidade, nome: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Coint</label>
                <input 
                  type="text" 
                  value={novaUnidade.coint}
                  onChange={e => setNovaUnidade({...novaUnidade, coint: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Localização</label>
                <input 
                  type="text" 
                  value={novaUnidade.localizacao}
                  onChange={e => setNovaUnidade({...novaUnidade, localizacao: e.target.value})}
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
                onClick={handleSalvar}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-blue-600 rounded-lg transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      <ModalConfirmacao 
        isOpen={isModalDeleteOpen}
        title="Excluir Unidade"
        message={`Tem certeza que deseja excluir a unidade ${unidadeDeleteNome}? Esta ação não pode ser desfeita.`}
        onConfirm={confirmExcluir}
        onCancel={() => { setIsModalDeleteOpen(false); setUnidadeDeleteId(null); }}
      />
    </div>
  );
};

export default Unidades;
