/**
 * @file Sidebar.tsx
 * @description Componente de Navegação Principal do Sistema.
 * Apresenta o menu lateral que permite transitar entre as telas (Dashboard, Cautelas, Militares, etc.).
 * Implementa controle de estado para Colapso (Menu Minificado) e Tema (Dark/Light Mode).
 * 
 * Regra de Negócio PMPA: 
 * - O menu "Administração" (Usuários e Auditoria) só é exibido se o usuário 
 *   tiver a permissão "Administrador".
 */

import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Radio, 
  Users, 
  Shield, 
  ClipboardList, 
  ArrowRightLeft, 
  Wrench, 
  AlertTriangle,
  Activity,
  LogOut,
  Moon,
  Sun,
  X,
  Car,
  ChevronLeft,
  ChevronRight,
  Server
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean; // Controla se o menu hambúrguer está aberto no Mobile
  onClose: () => void; // Função para fechar o menu no Mobile
}

// Configuração estática do Menu de Operadores Padrão
const menuPrincipal = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Radio, label: 'Rádios', path: '/equipamentos' },
  { icon: Server, label: 'Equipamentos', path: '/equipamentos-diversos' },
  { icon: Users, label: 'Militares', path: '/militares' },
  { icon: Shield, label: 'Unidades', path: '/unidades' },
  { icon: ClipboardList, label: 'Cautelas', path: '/cautelas' },
  { icon: ArrowRightLeft, label: 'Transferências', path: '/transferencias' },
  { icon: Wrench, label: 'Manutenção', path: '/manutencao' },
  { icon: Car, label: 'VTR', path: '/vtr' },
  { icon: AlertTriangle, label: 'Extraviados', path: '/extraviados' },
];

// Configuração estática do Menu de Administradores
const menuAdmin = [
  { icon: Users, label: 'Usuários', path: '/usuarios' },
  { icon: Activity, label: 'Auditoria', path: '/auditoria' },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Estados para gerenciar as credenciais logadas e o visual do usuário
  const [usuario, setUsuario] = React.useState<any>(null);
  const [avatar, setAvatar] = React.useState<string | null>(null);

  // Estado para injetar a classe 'dark' no HTML
  const [isDarkMode, setIsDarkMode] = React.useState<boolean>(() => {
    return document.documentElement.className.includes('dark');
  });

  // Estado de Colapso persistido no LocalStorage para que o usuário não tenha que 
  // encolher a barra toda vez que der F5 na página
  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  // useEffect para carregar o perfil do usuário logo no carregamento do componente
  React.useEffect(() => {
    let currentUser: any = null;
    const userStr = localStorage.getItem('usuario');
    if (userStr) {
      currentUser = JSON.parse(userStr);
      setUsuario(currentUser);

      const savedAvatar = localStorage.getItem(`avatar_${currentUser.id}`);
      if (savedAvatar) setAvatar(savedAvatar);
    }

    // Escuta eventos personalizados disparados pela tela "Perfil"
    // para atualizar a fotinha da sidebar em tempo real sem precisar de F5
    const handleAvatarUpdate = () => {
      if (currentUser) {
        const updatedAvatar = localStorage.getItem(`avatar_${currentUser.id}`);
        if (updatedAvatar) setAvatar(updatedAvatar);
      }
    };
    window.addEventListener('avatar-updated', handleAvatarUpdate);
    return () => window.removeEventListener('avatar-updated', handleAvatarUpdate);
  }, []);

  const isAdmin = usuario?.permissao === 'Administrador';

  // Função para Matar a Sessão
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  // Alterna as classes do CSS Global
  const toggleTheme = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    if (nextTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleCollapse = () => {
    const nextValue = !isCollapsed;
    setIsCollapsed(nextValue);
    localStorage.setItem('sidebar_collapsed', String(nextValue));
  };

  return (
    <>
      {/* Overlay escuro para mobile quando o menu está aberto */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* 
        Container Principal da Sidebar 
        Utiliza classes mágicas do Tailwind para lidar com largura dinâmica baseada no estado isCollapsed
      */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-white/90 dark:bg-surface/80 border-r border-gray-200/50 dark:border-white/5 backdrop-blur-xl flex flex-col h-full transition-all duration-300 ease-in-out md:relative md:translate-x-0 md:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:flex'}
        ${isCollapsed ? 'w-72 md:w-20' : 'w-72 md:w-72'}
      `}>
        {/* Botão Flutuante (Desktop) para Recolher/Expandir */}
        <button
          onClick={toggleCollapse}
          title={isCollapsed ? "Expandir Menu" : "Recolher Menu"}
          className="hidden md:flex absolute top-7 -right-3.5 w-7 h-7 bg-white dark:bg-[#111827] border border-gray-200/80 dark:border-white/10 rounded-full items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white cursor-pointer shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 z-50"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Logo PMPA / Cabeçalho */}
        <div className={`h-20 flex items-center border-b border-gray-200/50 dark:border-white/5 transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'justify-between px-6'}`}>
          <div className="flex items-center gap-3">
            <img src="/brasao_pmpa.png" alt="PMPA Logo" className="w-10 h-10 object-contain drop-shadow-sm transition-transform duration-500 hover:rotate-[360deg] shrink-0" />
            {!isCollapsed && (
              <div className="animate-fade-in-fast">
                <h1 className="text-gray-900 dark:text-white font-extrabold tracking-wider text-lg leading-tight uppercase bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Athenas</h1>
                <p className="text-blue-500 dark:text-blue-400 text-[10px] font-black tracking-widest uppercase">PMPA</p>
              </div>
            )}
          </div>
          
          {/* Botão de Fechar no Mobile (X) */}
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-900 dark:hover:text-white md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo Rolável com os Menus */}
        <div className="flex-1 overflow-y-auto py-6">
          {!isCollapsed ? (
            <h2 className="px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 animate-fade-in-fast">
              Menu Principal
            </h2>
          ) : (
            <div className="mx-4 my-2 border-b border-gray-200/30 dark:border-white/5" />
          )}
          
          {/* Renderização do Menu Público */}
          <nav className="space-y-1 px-2">
            {menuPrincipal.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center rounded-xl text-sm transition-all duration-300 transform active:scale-95 ${
                    isCollapsed ? 'justify-center p-3 mx-1' : 'gap-3 px-4 py-2.5 mx-2'
                  } ${
                    isActive 
                      ? 'active-gradient shadow-md' 
                      : `text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100/70 dark:hover:bg-white/5 ${!isCollapsed ? 'hover:translate-x-1' : ''}`
                  }`
                }
              >
                <item.icon size={18} className={`transition-transform duration-300 group-hover:scale-110 shrink-0 ${location.pathname === item.path ? 'text-white' : 'text-gray-400 dark:text-gray-500'}`} />
                {!isCollapsed && <span className="animate-fade-in-fast whitespace-nowrap">{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Renderização Condicional do Menu de Administração */}
          {isAdmin && (
            <>
              {!isCollapsed ? (
                <h2 className="px-6 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 mt-6 animate-fade-in-fast">
                  Administração
                </h2>
              ) : (
                <div className="mx-4 my-4 border-b border-gray-200/30 dark:border-white/5" />
              )}
              
              <nav className="space-y-1 px-2">
                {menuAdmin.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    title={isCollapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center rounded-xl text-sm transition-all duration-300 transform active:scale-95 ${
                        isCollapsed ? 'justify-center p-3 mx-1' : 'gap-3 px-4 py-2.5 mx-2'
                      } ${
                        isActive 
                          ? 'bg-gray-100 dark:bg-white/5 border-l-4 border-blue-500 text-gray-900 dark:text-white font-semibold' 
                          : `text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100/70 dark:hover:bg-white/5 ${!isCollapsed ? 'hover:translate-x-1' : ''}`
                      }`
                    }
                  >
                    <item.icon size={18} className={`transition-transform duration-300 shrink-0 ${location.pathname === item.path ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`} />
                    {!isCollapsed && <span className="animate-fade-in-fast whitespace-nowrap">{item.label}</span>}
                  </NavLink>
                ))}
              </nav>
            </>
          )}
        </div>

        {/* Rodapé da Sidebar: Tema e Perfil */}
        <div className="p-3 border-t border-gray-200/50 dark:border-white/5">
          {/* Botão Alternar Tema Escuro */}
          <button 
            onClick={toggleTheme}
            title={isCollapsed ? (isDarkMode ? 'Modo Claro' : 'Modo Escuro') : undefined}
            className={`w-full mb-3 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100/70 dark:hover:bg-surface-hover rounded-xl transition-all duration-300 transform active:scale-98 ${
              isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-2.5'
            }`}
          >
            {isDarkMode ? <Sun size={18} className="text-amber-500 shrink-0" /> : <Moon size={18} className="text-indigo-400 shrink-0" />}
            {!isCollapsed && <span className="font-medium animate-fade-in-fast whitespace-nowrap">{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span>}
          </button>

          {/* Atalho para o Perfil do Usuário */}
          <NavLink 
            to="/perfil" 
            title={isCollapsed ? (usuario?.nomeGuerra || 'Perfil') : undefined}
            className={`flex items-center mb-3 hover:bg-gray-100/70 dark:hover:bg-surface-hover rounded-xl transition-all duration-300 cursor-pointer border border-transparent hover:border-gray-200/30 dark:hover:border-white/5 shadow-sm hover:shadow ${
              isCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-2.5'
            }`}
          >
            <div className={`flex items-center overflow-hidden ${isCollapsed ? 'justify-center shrink-0' : 'gap-3'}`}>
              {avatar ? (
                <img src={avatar} alt="Perfil" className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-700 object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400 font-bold text-xs ring-2 ring-blue-500/20 dark:ring-blue-500/10 shrink-0">
                  {usuario?.nomeGuerra ? usuario.nomeGuerra.slice(0, 2).toUpperCase() : 'PM'}
                </div>
              )}
              {!isCollapsed && (
                <div className="truncate animate-fade-in-fast">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{usuario?.nomeGuerra || 'Usuário'}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-wider truncate">{usuario?.permissao || 'Operador'}</p>
                </div>
              )}
            </div>
          </NavLink>
          
          {/* Logout */}
          <button 
            onClick={handleLogout} 
            title={isCollapsed ? 'Sair do Sistema' : undefined}
            className={`flex w-full items-center text-gray-500 hover:text-danger hover:bg-danger/10 rounded-xl transition-all duration-300 transform active:scale-98 ${
              isCollapsed ? 'justify-center p-3' : 'gap-2 px-3 py-2.5'
            }`}
          >
            <LogOut size={16} className="shrink-0" />
            {!isCollapsed && <span className="font-medium animate-fade-in-fast whitespace-nowrap">Sair do Sistema</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
