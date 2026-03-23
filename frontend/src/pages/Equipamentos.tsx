import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Trash2, Edit2, ChevronDown } from 'lucide-react';

interface Equipamento {
  id: number;
  idRadio: string;
  rp: string;
  numSerie: string;
  marca: string;
  modelo: string;
  status: string;
}

const Equipamentos: React.FC = () => {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  
  
  // Filtros
  const [filtroStatus, setFiltroStatus] = useState('Todos - Status');
  const [filtroMarca, setFiltroMarca] = useState('Todos - Marca');
  const [filtroModelo, setFiltroModelo] = useState('Todos - Modelo');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [novoEquip, setNovoEquip] = useState({
    id: 0,
    numSerie: '',
    idRadio: '',
    rp: '',
    marca: 'Motorola',
    modelo: 'APX 900',
    status: 'OPERACIONAL'
  });

  useEffect(() => {
    fetchEquipamentos();
  }, []);

  const fetchEquipamentos = async () => {
    try {
      const res = await axios.get('http://localhost:3333/api/equipamentos');
      setEquipamentos(res.data);
    } catch (e) {
      console.error("Conexão com a API falhou. Certifique que o backend está rodando.", e);
      setEquipamentos([]);
    }
  };

  const openNovoModal = () => {
    setIsEditing(false);
    setNovoEquip({ id: 0, numSerie: '', idRadio: '', rp: '', marca: 'Motorola', modelo: 'APX 900', status: 'OPERACIONAL' });
    setIsModalOpen(true);
  };

  const openEditModal = (eq: Equipamento) => {
    setIsEditing(true);
    setNovoEquip({
      id: eq.id,
      numSerie: eq.numSerie,
      idRadio: eq.idRadio || '',
      rp: eq.rp,
      marca: eq.marca || 'Motorola',
      modelo: eq.modelo || 'APX 900',
      status: eq.status
    });
    setIsModalOpen(true);
  };

  const handleSalvar = async () => {
    try {
      if (isEditing) {
        const res = await axios.put(`http://localhost:3333/api/equipamentos/${novoEquip.id}`, novoEquip);
        setEquipamentos(equipamentos.map(e => e.id === novoEquip.id ? res.data : e));
      } else {
        const res = await axios.post('http://localhost:3333/api/equipamentos', novoEquip);
        setEquipamentos([...equipamentos, res.data]);
      }
      setIsModalOpen(false);
    } catch (e) {
      console.error("Erro ao salvar rádio", e);
      alert("Erro ao salvar. Verifique se o Rádio ou Patrimônio já existem.");
    }
  };

  const handleExcluir = async (id: number, rp: string) => {
    const confirmOuCancela = window.confirm(`Tem certeza que deseja excluir permanentemente o rádio Patrimônio ${rp}?`);
    if (confirmOuCancela) {
      try {
        await axios.delete(`http://localhost:3333/api/equipamentos/${id}`);
        setEquipamentos(equipamentos.filter(e => e.id !== id));
      } catch (e) {
        console.error("Erro ao excluir", e);
        alert("Erro ao excluir este equipamento. Ele pode estar atrelado a uma cautela.");
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch(status.toUpperCase()) {
      case 'OPERACIONAL': return 'text-success bg-success/10 border-success/20';
      case 'CAUTELADO': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'MANUTENÇÃO':
      case 'MANUTENCAO': return 'text-warning bg-warning/10 border-warning/20';
      case 'EXTRAVIADO': return 'text-danger bg-danger/10 border-danger/20';
      case 'TRANSFERIDO': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      default: return 'text-gray-400 bg-gray-600/10 border-gray-600/20';
    }
  };

  const equipamentosFiltrados = equipamentos.filter(eq => {
    let match = true;
    if (filtroStatus !== 'Todos - Status' && eq.status.toUpperCase() !== filtroStatus.toUpperCase().replace('Ç', 'C').replace('Ã', 'A')) match = false;
    if (filtroMarca !== 'Todos - Marca' && eq.marca !== filtroMarca) match = false;
    if (filtroModelo !== 'Todos - Modelo' && eq.modelo !== filtroModelo) match = false;
    return match;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in text-gray-900 dark:text-white h-full flex flex-col relative transition-colors duration-200">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Equipamentos</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gerenciamento de rádios</p>
        </div>
        <button 
          onClick={openNovoModal}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-primary/20"
        >
          <Plus size={18} />
          Novo Equipamento
        </button>
      </div>

      <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl flex-1 flex flex-col overflow-hidden transition-colors">
        <div className="p-4 border-b border-gray-200 dark:border-[#1f2937] flex items-center justify-between gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[250px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por série, ID, patrimônio..." 
              className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {/* Filtros Dropdowns (Design Simulado) */}
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer">
              <div className="bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] hover:border-gray-400 dark:hover:border-gray-500 rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between gap-3 min-w-[160px] transition-colors">
                <span>{filtroStatus}</span>
                <ChevronDown size={14} className="text-gray-400 dark:text-gray-500" />
              </div>
              <div className="absolute top-full mt-1 w-full bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#374151] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 py-1">
                <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer" onClick={() => setFiltroStatus('Todos - Status')}>Todos - Status</div>
                <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer" onClick={() => setFiltroStatus('Operacional')}>Operacional</div>
                <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer" onClick={() => setFiltroStatus('Cautelado')}>Cautelado</div>
                <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer" onClick={() => setFiltroStatus('Manutenção')}>Manutenção</div>
                <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer" onClick={() => setFiltroStatus('Extraviado')}>Extraviado</div>
              </div>
            </div>

            <div className="relative group cursor-pointer">
              <div className="bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] hover:border-gray-400 dark:hover:border-gray-500 rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between gap-3 min-w-[160px] transition-colors">
                <span>{filtroMarca}</span>
                <ChevronDown size={14} className="text-gray-400 dark:text-gray-500" />
              </div>
              <div className="absolute top-full mt-1 w-full bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#374151] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 py-1">
                <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer" onClick={() => setFiltroMarca('Todos - Marca')}>Todos - Marca</div>
                <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer" onClick={() => setFiltroMarca('Motorola')}>Motorola</div>
                <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer" onClick={() => setFiltroMarca('Tait')}>Tait</div>
              </div>
            </div>

            <div className="relative group cursor-pointer">
              <div className="bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] hover:border-gray-400 dark:hover:border-gray-500 rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between gap-3 min-w-[160px] transition-colors">
                <span>{filtroModelo}</span>
                <ChevronDown size={14} className="text-gray-400 dark:text-gray-500" />
              </div>
              <div className="absolute top-full mt-1 w-full right-0 bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#374151] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 py-1">
                <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer" onClick={() => setFiltroModelo('Todos - Modelo')}>Todos - Modelo</div>
                <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer" onClick={() => setFiltroModelo('APX 900')}>APX 900</div>
                <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer" onClick={() => setFiltroModelo('APX 2000')}>APX 2000</div>
                <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer" onClick={() => setFiltroModelo('TP9400')}>TP9400</div>
                <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f2937] cursor-pointer" onClick={() => setFiltroModelo('TP9100')}>TP9100</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabela */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-[#0b101a] text-gray-500 dark:text-gray-400 font-medium text-xs sticky top-0 z-0">
              <tr>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Número de Série</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">ID do Rádio</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Patrimônio</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Marca</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Modelo</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">Status</th>
                <th className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1f2937]">
              {equipamentosFiltrados.map((eq) => (
                <tr key={eq.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2937]/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{eq.numSerie}</td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{eq.idRadio || '-'}</td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{eq.rp}</td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{eq.marca || '-'}</td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{eq.modelo || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-[11px] font-bold tracking-wide rounded-full border ${getStatusColor(eq.status)}`}>
                      {eq.status === 'OPERACIONAL' ? 'Operacional' : eq.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 text-gray-400 dark:text-gray-500">
                      <button 
                        onClick={() => openEditModal(eq)}
                        className="hover:text-gray-900 dark:hover:text-white p-1.5 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-white/5"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleExcluir(eq.id, eq.rp)}
                        className="hover:text-danger p-1.5 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-danger/10"
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
      </div>

      {/* Modal Novo Equipamento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-200 dark:border-[#1f2937] flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEditing ? 'Editar Equipamento' : 'Novo Equipamento'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Preencha as informações do rádio</p>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Número de Série</label>
                <input 
                  type="text" 
                  value={novoEquip.numSerie}
                  onChange={e => setNovoEquip({...novoEquip, numSerie: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ID do Rádio</label>
                <input 
                  type="text" 
                  value={novoEquip.idRadio}
                  onChange={e => setNovoEquip({...novoEquip, idRadio: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Número de Patrimônio</label>
                <input 
                  type="text" 
                  value={novoEquip.rp}
                  onChange={e => setNovoEquip({...novoEquip, rp: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Marca</label>
                <select 
                  value={novoEquip.marca}
                  onChange={e => setNovoEquip({...novoEquip, marca: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                >
                  <option value="Motorola">Motorola</option>
                  <option value="Tait">Tait</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Modelo</label>
                <select 
                  value={novoEquip.modelo}
                  onChange={e => setNovoEquip({...novoEquip, modelo: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                >
                  <option value="APX 900">APX 900</option>
                  <option value="APX 2000">APX 2000</option>
                  <option value="TP9400">TP9400</option>
                  <option value="TP9100">TP9100</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                <select 
                  value={novoEquip.status}
                  onChange={e => setNovoEquip({...novoEquip, status: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                >
                  <option value="OPERACIONAL">Operacional</option>
                  <option value="CAUTELADO">Cautelado</option>
                  <option value="MANUTENCAO">Em Manutenção</option>
                  <option value="EXTRAVIADO">Extraviado</option>
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
                className="px-6 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-lg shadow-primary/20"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Equipamentos;
