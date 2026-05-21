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
  Car
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuPrincipal = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Radio, label: 'Equipamentos', path: '/equipamentos' },
  { icon: Users, label: 'Militares', path: '/militares' },
  { icon: Shield, label: 'Unidades', path: '/unidades' }, // Changed from Building to Shield
  { icon: ClipboardList, label: 'Cautelas', path: '/cautelas' }, // Changed from FileSignature to ClipboardList
  { icon: ArrowRightLeft, label: 'Transferências', path: '/transferencias' }, // Changed from Settings to ArrowRightLeft
  { icon: Wrench, label: 'Manutenção', path: '/manutencao' }, // Changed from AlertTriangle to Wrench
  { icon: Car, label: 'VTR', path: '/vtr' },
  { icon: AlertTriangle, label: 'Extraviados', path: '/extraviados' },
];

const menuAdmin = [
  { icon: Users, label: 'Usuários', path: '/usuarios' },
  { icon: Activity, label: 'Auditoria', path: '/auditoria' }, // Changed from Configurações
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [usuario, setUsuario] = React.useState<any>(null);
  const [avatar, setAvatar] = React.useState<string | null>(null);

  const [isDarkMode, setIsDarkMode] = React.useState<boolean>(() => {
    return document.documentElement.className.includes('dark');
  });

  React.useEffect(() => {
    let currentUser: any = null;
    const userStr = localStorage.getItem('usuario');
    if (userStr) {
      currentUser = JSON.parse(userStr);
      setUsuario(currentUser);

      const savedAvatar = localStorage.getItem(`avatar_${currentUser.id}`);
      if (savedAvatar) setAvatar(savedAvatar);
    }

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  const toggleTheme = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    if (nextTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white/90 dark:bg-surface/80 border-r border-gray-200/50 dark:border-white/5 backdrop-blur-xl flex flex-col h-full transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:flex'}
      `}>
        {/* Logo/Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-gray-200/50 dark:border-white/5">
          <div className="flex items-center gap-3">
            <img src="/brasao_pmpa.png" alt="PMPA Logo" className="w-10 h-10 object-contain drop-shadow-sm transition-transform duration-500 hover:rotate-[360deg]" />
            <div>
              <h1 className="text-gray-900 dark:text-white font-extrabold tracking-wider text-lg leading-tight uppercase bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Athenas</h1>
              <p className="text-blue-500 dark:text-blue-400 text-[10px] font-black tracking-widest uppercase">PMPA</p>
            </div>
          </div>
          
          {/* Close button for mobile */}
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-900 dark:hover:text-white md:hidden"
          >
            <X size={20} />
          </button>
        </div>

      <div className="flex-1 overflow-y-auto py-6">
          <h2 className="px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Menu Principal
          </h2>
          <nav className="space-y-1 px-3">
            {menuPrincipal.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-300 transform active:scale-95 ${
                    isActive 
                      ? 'active-gradient shadow-md' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100/70 dark:hover:bg-white/5 hover:translate-x-1'
                  }`
                }
              >
                <item.icon size={18} className={`transition-transform duration-300 group-hover:scale-110 ${location.pathname === item.path ? 'text-white' : 'text-gray-400 dark:text-gray-500'}`} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {isAdmin && (
            <>
              <h2 className="px-6 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 mt-6">
                Administração
              </h2>
              <nav className="space-y-1 px-3">
                {menuAdmin.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-300 transform active:scale-95 ${
                        isActive 
                          ? 'bg-gray-100 dark:bg-white/5 border-l-4 border-blue-500 text-gray-900 dark:text-white font-semibold' 
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100/70 dark:hover:bg-white/5 hover:translate-x-1'
                      }`
                    }
                  >
                    <item.icon size={18} className={`transition-transform duration-300 ${location.pathname === item.path ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`} />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </>
          )}
        </div>

      {/* User Area & Theme Toggle */}
      {/* User Area & Theme Toggle */}
      <div className="p-4 border-t border-gray-200/50 dark:border-white/5">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="w-full mb-3 flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100/70 dark:hover:bg-surface-hover rounded-xl transition-all duration-300 transform active:scale-98"
        >
          {isDarkMode ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-indigo-400" />}
          <span className="font-medium">{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
        </button>

        <NavLink to="/perfil" className="flex items-center justify-between mb-3 px-3 py-2.5 hover:bg-gray-100/70 dark:hover:bg-surface-hover rounded-xl transition-all duration-300 cursor-pointer border border-transparent hover:border-gray-200/30 dark:hover:border-white/5 shadow-sm hover:shadow">
          <div className="flex items-center gap-3 overflow-hidden">
            {avatar ? (
              <img src={avatar} alt="Perfil" className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-700 object-cover shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400 font-bold text-xs ring-2 ring-blue-500/20 dark:ring-blue-500/10 shrink-0">
                {usuario?.nomeGuerra ? usuario.nomeGuerra.slice(0, 2).toUpperCase() : 'PM'}
              </div>
            )}
            <div className="truncate">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{usuario?.nomeGuerra || 'Usuário'}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-wider truncate">{usuario?.permissao || 'Operador'}</p>
            </div>
          </div>
        </NavLink>
        
        <button onClick={handleLogout} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-gray-500 hover:text-danger hover:bg-danger/10 rounded-xl transition-all duration-300 transform active:scale-98">
          <LogOut size={16} />
          <span className="font-medium">Sair do Sistema</span>
        </button>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
