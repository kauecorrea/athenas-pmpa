import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Edit2, Trash2, ChevronDown } from 'lucide-react';
import ModalConfirmacao from '../components/ModalConfirmacao';

interface Unidade {
  id: string;
  nome: string;
  sigla: string;
}

interface Militar {
  id: string;
  nome: string;
  rg: string;
  contato: string;
  posto: string; // Patente
  unidadeId: string;
  unidade?: Unidade;
}

const Militares: React.FC = () => {
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [militarDeleteId, setMilitarDeleteId] = useState<string | null>(null);
  const [militarDeleteNome, setMilitarDeleteNome] = useState('');
  const [filtroUnidade, setFiltroUnidade] = useState('Todos - Unidade');
  const [filtroPatente, setFiltroPatente] = useState('Todos - Patente');
  const [buscaTratada, setBuscaTratada] = useState('');

  const [novoMilitar, setNovoMilitar] = useState<Partial<Militar>>({
    nome: '',
    rg: '',
    contato: '',
    posto: '',
    unidadeId: undefined
  });

  const patentes = [
    'Soldado', 'Cabo', '3° Sargento', '2° Sargento', '1° Sargento', 
    'Sub Tenente', '2° Tenente', '1° Tenente', 'Capitão', 'Major',
    'Tenente-Coronel', 'Coronel'
  ];

  useEffect(() => {
    fetchMilitares();
    fetchUnidades();
  }, []);

  const fetchMilitares = async () => {
    try {
      const res = await axios.get('/api/militares');
      setMilitares(res.data);
    } catch (error) {
      console.error("Erro ao carregar militares", error);
      // Fallback em caso de falha temporária
      setMilitares([
        {
          id: '1',
          nome: 'Mario',
          rg: '56848',
          contato: '65564.56432',
          posto: '2° Tenente',
          unidadeId: '1',
          unidade: { id: '1', nome: 'CIEPAS', sigla: 'CIEPAS' }
        }
      ]);
    }
  };

  const fetchUnidades = async () => {
    try {
      const res = await axios.get('/api/unidades');
      setUnidades(res.data);
    } catch {
      // Fallback 
      setUnidades([
        { id: '1', nome: 'CIEPAS', sigla: 'CIEPAS' },
        { id: '2', nome: '1° BME', sigla: '1BME' },
        { id: '3', nome: '1° BPM', sigla: '1BPM' }
      ]);
    }
  };

  const openNovoModal = () => {
    setIsEditing(false);
    setNovoMilitar({ nome: '', rg: '', contato: '', posto: '', unidadeId: undefined });
    setIsModalOpen(true);
  };

  const openEditModal = (militar: Militar) => {
    setIsEditing(true);
    setNovoMilitar({ ...militar });
    setIsModalOpen(true);
  };

  const handleSalvar = async () => {
    if (!novoMilitar.nome || !novoMilitar.rg || !novoMilitar.posto || !novoMilitar.unidadeId) {
      alert("Preencha todos os campos obrigatórios (Nome, RG, Patente e Unidade)!");
      return;
    }

    try {
      if (isEditing) {
        await axios.put(`/api/militares/${novoMilitar.id}`, novoMilitar);
      } else {
        await axios.post('/api/militares', novoMilitar);
      }
      setIsModalOpen(false);
      fetchMilitares(); // Atualiza a lista
    } catch (error) {
      console.error("Erro ao salvar militar", error);
      alert("Ocorreu um erro ao salvar o militar. Verifique se o RG já não está cadastrado.");
    }
  };

  const openDeleteModal = (id: string, nome: string) => {
    setMilitarDeleteId(id);
    setMilitarDeleteNome(nome);
    setIsModalDeleteOpen(true);
  };

  const confirmExcluir = async () => {
    if (!militarDeleteId) return;
    try {
      await axios.delete(`/api/militares/${militarDeleteId}`);
      fetchMilitares();
    } catch (error) {
      console.error("Erro ao excluir", error);
      alert("Erro ao excluir. Este militar pode estar vinculado a cautelas ativas.");
    } finally {
      setIsModalDeleteOpen(false);
      setMilitarDeleteId(null);
    }
  };

  // Lógica de Filtros
  const militaresFiltrados = militares.filter(m => {
    const nomeUnidade = m.unidade?.sigla || m.unidade?.nome || '';
    
    // Check de Patente
    if (filtroPatente !== 'Todos - Patente' && m.posto !== filtroPatente) {
      return false;
    }

    // Check de Unidade
    if (filtroUnidade !== 'Todos - Unidade' && nomeUnidade !== filtroUnidade) {
      return false;
    }

    // Check de Busca Textual
    if (buscaTratada) {
      const searchStr = buscaTratada.toLowerCase();
      return (
        m.nome.toLowerCase().includes(searchStr) ||
        (m.rg && m.rg.toLowerCase().includes(searchStr)) ||
        (m.contato && m.contato.toLowerCase().includes(searchStr))
      );
    }
    
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in text-gray-900 dark:text-white h-full flex flex-col transition-colors duration-200">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
             Militares
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gerenciamento de militares</p>
        </div>
        <button 
          onClick={openNovoModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus size={18} />
          Novo Militar
        </button>
      </div>

      {/* FILTER BOX */}
      <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col overflow-hidden transition-colors">
        <div className="p-4 border-b border-gray-200 dark:border-[#1f2937] flex items-center justify-between gap-4 flex-wrap">
          
          <div className="relative flex-1 min-w-[300px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome, RG, contato..." 
              value={buscaTratada}
              onChange={(e) => setBuscaTratada(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Filtro de Unidade */}
            <div className="relative group cursor-pointer z-50">
              <div className="bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] hover:border-gray-400 dark:hover:border-gray-500 rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between gap-3 min-w-[160px] transition-colors">
                <span>{filtroUnidade}</span>
                <ChevronDown size={14} className="text-gray-400 dark:text-gray-500" />
              </div>
              <div className="absolute top-full mt-1 w-full right-0 bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#374151] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-1 max-h-60 overflow-y-auto">
                <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer" onClick={() => setFiltroUnidade('Todos - Unidade')}>Todos - Unidade</div>
                {unidades.map(u => (
                  <div key={u.id} className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer" onClick={() => setFiltroUnidade(u.sigla || u.nome)}>
                    {u.sigla || u.nome}
                  </div>
                ))}
              </div>
            </div>

            {/* Filtro de Patente */}
            <div className="relative group cursor-pointer z-40">
              <div className="bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] hover:border-gray-400 dark:hover:border-gray-500 rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between gap-3 min-w-[170px] transition-colors">
                <span>{filtroPatente}</span>
                <ChevronDown size={14} className="text-gray-400 dark:text-gray-500" />
              </div>
              <div className="absolute top-full mt-1 w-full right-0 bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#374151] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-1 max-h-60 overflow-y-auto">
                <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer flex items-center gap-2" onClick={() => setFiltroPatente('Todos - Patente')}>
                  Todos - Patente
                </div>
                {patentes.map(patente => (
                  <div key={patente} className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer" onClick={() => setFiltroPatente(patente)}>
                    {patente}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* TABELA - Responsiva */}
        <div className="flex-1 overflow-auto overflow-x-auto scrolling-touch z-0">
          <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300 min-w-[800px]">
            <thead className="bg-gray-50 dark:bg-[#0b101a] text-gray-500 dark:text-gray-400 font-medium text-xs sticky top-0 z-0">
              <tr>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Nome de Guerra</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Patente</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">RG</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Contato</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Unidade</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1f2937]">
              {militaresFiltrados.length === 0 ? (
                <tr>
                   <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                     Nenhum militar encontrado.
                   </td>
                </tr>
              ) : (
                militaresFiltrados.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2937]/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{m.nome}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{m.posto}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{m.rg || '-'}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{m.contato || '-'}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{m.unidade?.sigla || m.unidade?.nome || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 text-gray-400 dark:text-gray-500">
                        <button 
                          onClick={() => openEditModal(m)}
                          className="hover:text-gray-900 dark:hover:text-white p-1.5 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-white/5"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => openDeleteModal(m.id, m.nome)}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl w-full max-w-lg shadow-2xl flex flex-col my-auto max-h-[95vh]">
            <div className="p-6 border-b border-gray-200 dark:border-[#1f2937] flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEditing ? 'Editar Militar' : 'Novo Militar'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Preencha as informações do militar</p>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome de Guerra</label>
                <input 
                  type="text" 
                  value={novoMilitar.nome}
                  onChange={e => setNovoMilitar({...novoMilitar, nome: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">RG</label>
                <input 
                  type="text" 
                  value={novoMilitar.rg}
                  onChange={e => setNovoMilitar({...novoMilitar, rg: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Número de Contato</label>
                <input 
                  type="text" 
                  value={novoMilitar.contato}
                  onChange={e => setNovoMilitar({...novoMilitar, contato: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Patente</label>
                <select 
                  value={novoMilitar.posto || ''}
                  onChange={e => setNovoMilitar({...novoMilitar, posto: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                >
                  <option value="" disabled>Selecione uma patente</option>
                  {patentes.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Unidade</label>
                <select 
                  value={novoMilitar.unidadeId || ''}
                  onChange={e => setNovoMilitar({...novoMilitar, unidadeId: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                >
                  <option value="" disabled>Selecione uma unidade</option>
                  {unidades.map(u => (
                    <option key={u.id} value={u.id}>{u.nome}</option>
                  ))}
                </select>
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
        title="Excluir Fornecimento Militar"
        message={`Tem certeza que deseja excluir a conta de armaria do militar ${militarDeleteNome}?`}
        onConfirm={confirmExcluir}
        onCancel={() => { setIsModalDeleteOpen(false); setMilitarDeleteId(null); }}
      />
    </div>
  );
};

export default Militares;
