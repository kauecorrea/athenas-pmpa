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
  Settings,
  LogOut,
  Moon,
  Sun
} from 'lucide-react';

const menuPrincipal = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Radio, label: 'Equipamentos', path: '/equipamentos' },
  { icon: Users, label: 'Militares', path: '/militares' },
  { icon: Shield, label: 'Unidades', path: '/unidades' }, // Changed from Building to Shield
  { icon: ClipboardList, label: 'Cautelas', path: '/cautelas' }, // Changed from FileSignature to ClipboardList
  { icon: ArrowRightLeft, label: 'Transferências', path: '/transferencias' }, // Changed from Settings to ArrowRightLeft
  { icon: Wrench, label: 'Manutenção', path: '/manutencao' }, // Changed from AlertTriangle to Wrench
  { icon: AlertTriangle, label: 'Extraviados', path: '/extraviados' },
];

const menuAdmin = [
  { icon: Users, label: 'Usuários', path: '/usuarios' },
  { icon: Settings, label: 'Configurações', path: '/configuracoes' }, // Added Configurações
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [usuario, setUsuario] = React.useState<any>(null);

  const [isDarkMode, setIsDarkMode] = React.useState<boolean>(() => {
    return document.documentElement.className.includes('dark');
  });

  React.useEffect(() => {
    const userStr = localStorage.getItem('usuario');
    if (userStr) setUsuario(JSON.parse(userStr));
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
    <aside className="w-64 bg-white dark:bg-[#0a0f1d] border-r border-gray-200 dark:border-[#1f2937] flex flex-col h-full transition-colors duration-200">
      {/* Logo/Header */}
      <div className="h-20 flex items-center px-6 border-b border-gray-200 dark:border-[#1f2937]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
            <Radio size={18} />
          </div>
          <div>
            <h1 className="text-gray-900 dark:text-white font-bold tracking-wide text-lg leading-tight">Controle</h1>
            <p className="text-primary text-[10px] font-medium tracking-widest uppercase">Patrimonial</p>
          </div>
        </div>
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
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs ring-1 ring-primary/30 shrink-0">
              {usuario?.nomeGuerra ? usuario.nomeGuerra.slice(0, 2).toUpperCase() : 'PM'}
            </div>
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
  );
};

export default Sidebar;
