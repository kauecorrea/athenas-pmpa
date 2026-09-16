/**
 * @file Acessorios.tsx
 * @description Componente de Cadastro de Acessórios por Quantidade.
 */

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Plus, Search, Trash2, Edit2, ChevronDown, List, Server } from "lucide-react";
import ModalConfirmacao from "../components/ModalConfirmacao";
import { emitToast } from "../utils/toast";

interface Acessorio {
  id: string;
  marca: string;
  modelo: string;
  quantidade: number;
  unidadeId?: string;
  unidade?: {
    id: string;
    nome: string;
  };
}

interface Unidade {
  id: string;
  nome: string;
}

const Acessorios: React.FC = () => {
  const [acessorios, setAcessorios] = useState<Acessorio[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);

  // Filtros
  const [filtroUnidade, setFiltroUnidade] = useState("Todas - Unidade");
  const [busca, setBusca] = useState("");

  const [viewMode, setViewMode] = useState<"form" | "list">("form");
  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [acessorioDeleteId, setAcessorioDeleteId] = useState<string | null>(null);
  const [acessorioDeleteName, setAcessorioDeleteName] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    marca: "",
    modelo: "",
    quantidade: "",
    unidadeId: "",
  });

  const [loading, setLoading] = useState(true);

  const isAdmin = () => {
    const userStr = localStorage.getItem('usuario');
    if (!userStr) return false;
    const user = JSON.parse(userStr);
    return user.permissao === 'Administrador';
  };

  useEffect(() => {
    fetchAcessorios();
    fetchUnidades();
  }, []);

  const fetchAcessorios = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/acessorios");
      setAcessorios(res.data);
    } catch (error) {
      console.error("Erro ao buscar acessórios", error);
      emitToast("Erro ao carregar acessórios.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnidades = async () => {
    try {
      const res = await axios.get("/api/unidades");
      setUnidades(res.data);
    } catch (error) {
      console.error("Erro ao buscar unidades", error);
    }
  };

  const unidadesUnicas = useMemo(() => {
    const un = acessorios.map((a) => a.unidade?.nome).filter(Boolean) as string[];
    return ["Todas - Unidade", ...Array.from(new Set(un))];
  }, [acessorios]);

  const acessoriosFiltrados = useMemo(() => {
    return acessorios.filter((a) => {
      const matchBusca = a.modelo.toLowerCase().includes(busca.toLowerCase());
      const matchUnidade =
        filtroUnidade === "Todas - Unidade" || a.unidade?.nome === filtroUnidade;

      return matchBusca && matchUnidade;
    });
  }, [acessorios, busca, filtroUnidade]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/acessorios/${editingId}`, {
          ...formData,
          quantidade: Number(formData.quantidade),
        });
        emitToast("Acessório atualizado com sucesso!", "success");
      } else {
        await axios.post("/api/acessorios", {
          ...formData,
          quantidade: Number(formData.quantidade),
        });
        emitToast("Acessório criado com sucesso!", "success");
      }
      setFormData({
        marca: "",
        modelo: "",
        quantidade: "",
        unidadeId: "",
      });
      setEditingId(null);
      fetchAcessorios();
      setViewMode("list");
    } catch (error) {
      console.error("Erro ao salvar acessório", error);
      emitToast("Erro ao salvar acessório.", "error");
    }
  };

  const openDeleteModal = (id: string, name: string) => {
    setAcessorioDeleteId(id);
    setAcessorioDeleteName(name);
    setIsModalDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!acessorioDeleteId) return;
    try {
      await axios.delete(`/api/acessorios/${acessorioDeleteId}`);
      emitToast("Acessório excluído com sucesso!", "success");
      fetchAcessorios();
      if (acessoriosFiltrados.length === 1 && viewMode === "list") {
        setViewMode("form");
      }
    } catch (error) {
      console.error("Erro ao excluir acessório", error);
      emitToast("Erro ao excluir acessório.", "error");
    } finally {
      setIsModalDeleteOpen(false);
      setAcessorioDeleteId(null);
    }
  };

  const handleEdit = (a: Acessorio) => {
    setEditingId(a.id);
    setFormData({
      marca: a.marca,
      modelo: a.modelo,
      quantidade: String(a.quantidade),
      unidadeId: a.unidadeId || "",
    });
    setViewMode("form");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Acessórios
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Controle de estoque de acessórios gerais (baterias, fontes, etc).
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              setViewMode("list");
              setEditingId(null);
            }}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
              viewMode === "list"
                ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                : "bg-white dark:bg-[#1a2332] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <List size={18} />
            <span className="hidden sm:inline">Consultar Registros</span>
          </button>
          
          {(isAdmin() || viewMode === "list") && (
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  marca: "",
                  modelo: "",
                  quantidade: "",
                  unidadeId: "",
                });
                setViewMode("form");
              }}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold transition-all shadow-md ${
                viewMode === "form" && !editingId
                  ? "bg-primary text-white shadow-blue-500/25"
                  : "bg-primary text-white hover:bg-blue-600 shadow-blue-500/20"
              }`}
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Novo Acessório</span>
            </button>
          )}
        </div>
      </div>

      {viewMode === "form" ? (
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden animate-slide-up">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {editingId ? "Editar Acessório" : "Novo Acessório"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Preencha as informações abaixo para cadastrar um novo lote de acessório.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Marca</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Motorola, Intelbras..."
                  value={formData.marca}
                  onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all px-4 py-3 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Modelo</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Bateria NNTN, Fonte 12V..."
                  value={formData.modelo}
                  onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all px-4 py-3 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Quantidade</label>
                <input
                  required
                  type="number"
                  min="0"
                  placeholder="Ex: 50"
                  value={formData.quantidade}
                  onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all px-4 py-3 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Unidade (Opcional)</label>
                <div className="relative">
                  <select
                    value={formData.unidadeId}
                    onChange={(e) => setFormData({ ...formData, unidadeId: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-[#0b101a] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all px-4 py-3 appearance-none outline-none"
                  >
                    <option value="">Selecione uma Unidade (Opcional)</option>
                    {unidades.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                type="submit"
                className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 focus:ring-4 focus:ring-blue-500/20 transition-all shadow-lg shadow-blue-500/30 w-full md:w-auto"
              >
                {editingId ? "Salvar Alterações" : "Criar Registro"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden animate-slide-up">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col md:flex-row gap-4 bg-gray-50/50 dark:bg-white/5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por modelo do acessório..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0b101a] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
              />
            </div>
            
            <div className="relative min-w-[200px]">
              <select
                value={filtroUnidade}
                onChange={(e) => setFiltroUnidade(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-[#0b101a] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary appearance-none outline-none transition-all dark:text-white"
              >
                {unidadesUnicas.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700/80">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Marca</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Modelo</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Quantidade</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unidade</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {acessoriosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Server size={32} className="opacity-20 mb-2" />
                          <p>Nenhum acessório encontrado.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    acessoriosFiltrados.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {a.marca}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600 dark:text-gray-300 font-medium">
                            {a.modelo}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            {a.quantidade}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {a.unidade ? (
                              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{a.unidade.nome}</span>
                            ) : (
                              <span className="text-sm text-gray-400 dark:text-gray-500 italic">Geral</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isAdmin() && (
                              <>
                                <button
                                  onClick={() => handleEdit(a)}
                                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                  title="Editar"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button
                                  onClick={() => openDeleteModal(a.id, a.modelo)}
                                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                  title="Excluir"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <ModalConfirmacao
        isOpen={isModalDeleteOpen}
        title="Excluir Acessório"
        message={`Tem certeza que deseja excluir o acessório "${acessorioDeleteName}"? Esta ação não poderá ser desfeita e os estoques serão perdidos.`}
        onConfirm={handleDelete}
        onCancel={() => setIsModalDeleteOpen(false)}
      />
    </div>
  );
};

export default Acessorios;
