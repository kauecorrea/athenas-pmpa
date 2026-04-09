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
        fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#0a0f1d] border-r border-gray-200 dark:border-[#1f2937] flex flex-col h-full transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:flex'}
      `}>
        {/* Logo/Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-gray-200 dark:border-[#1f2937]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
              <Radio size={18} />
            </div>
            <div>
              <h1 className="text-gray-900 dark:text-white font-bold tracking-wide text-lg leading-tight uppercase">Athenas</h1>
              <p className="text-primary text-[10px] font-medium tracking-widest uppercase">PMPA</p>
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
          <nav className="space-y-1">
            {menuPrincipal.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-3 text-sm transition-all duration-200 ${
                    isActive 
                      ? 'text-white bg-primary border-l-2 border-blue-400 font-medium' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 border-l-2 border-transparent'
                  }`
                }
              >
                <item.icon size={18} className={location.pathname === item.path ? 'text-white' : ''} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {isAdmin && (
            <>
              <h2 className="px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 mt-6">
                Administração
              </h2>
              <nav className="space-y-1">
                {menuAdmin.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-6 py-3 text-sm transition-all duration-200 ${
                        isActive 
                          ? 'text-white bg-gray-100 dark:bg-white/5 border-l-2 border-primary font-medium' 
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 border-l-2 border-transparent'
                      }`
                    }
                  >
                    <item.icon size={18} className={location.pathname === item.path ? 'text-primary' : ''} />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </>
          )}
        </div>

      {/* User Area & Theme Toggle */}
      <div className="p-4 border-t border-gray-200 dark:border-[#1f2937]">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="w-full mb-4 flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1f2937] rounded-lg transition-colors"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
        </button>

        <NavLink to="/perfil" className="flex items-center justify-between mb-4 px-2 hover:bg-gray-100 dark:hover:bg-[#1f2937] p-2 rounded-lg transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            {avatar ? (
              <img src={avatar} alt="Perfil" className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs ring-1 ring-primary/30 shrink-0">
                {usuario?.nomeGuerra ? usuario.nomeGuerra.slice(0, 2).toUpperCase() : 'PM'}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{usuario?.nomeGuerra || 'Usuário'}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">{usuario?.permissao || 'Operador'}</p>
            </div>
          </div>
        </NavLink>
        
        <button onClick={handleLogout} className="flex w-full items-center gap-2 px-2 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors">
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
