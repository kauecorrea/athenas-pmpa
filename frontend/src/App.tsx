/**
 * @file App.tsx
 * @description Arquivo Core do Frontend (React).
 * Responsável pelo Roteamento (React Router), interceptação de chamadas API (Axios),
 * injeção do Layout base (Sidebar) e proteção de rotas (Protected Routes).
 */

import React from 'react';
// Build trigger: Resync production build v1.0.2 - Force update
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Menu, Radio } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Equipamentos from './pages/Equipamentos';
import EquipamentosDiversos from './pages/EquipamentosDiversos';
import Militares from './pages/Militares';
import Unidades from './pages/Unidades';
import Cautelas from './pages/Cautelas';
import Transferencias from './pages/Transferencias';
import Manutencao from './pages/Manutencao';
import Extraviados from './pages/Extraviados';
import Usuarios from './pages/Usuarios';
import Auditoria from './pages/Auditoria';
import Vtr from './pages/Vtr';
import Perfil from './pages/Perfil';
import Login from './pages/Login';

// ==========================================
// CONFIGURAÇÃO GLOBAL DO AXIOS (API)
// ==========================================

// URL Base global (Evita vazamentos e duplicação). Puxa do .env em Produção.
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

/**
 * Interceptor de Requisições (Request Interceptor)
 * Injeta o Token JWT em TODAS as chamadas HTTP para o Backend automaticamente.
 * Também envia o nome do usuário no Header para facilitar auditoria técnica se necessário.
 */
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  const usuarioInfo = localStorage.getItem('usuario');
  if (usuarioInfo) {
    const usuarioObj = JSON.parse(usuarioInfo);
    config.headers['X-Usuario-Nome'] = `${usuarioObj.posto || ''} ${usuarioObj.nomeGuerra || usuarioObj.nomeCompleto}`.trim();
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

/**
 * Interceptor de Respostas (Response Interceptor)
 * Escuta todas as respostas da API de forma passiva.
 * Se o backend devolver Status 401 (Não Autorizado ou Token Expirado),
 * ele mata a sessão local e redireciona agressivamente para a tela de Login.
 */
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Se o backend jogar um 401 (Token Expired ou sem permissão), desloga a pessoa
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==========================================
// COMPONENTES DE ESTRUTURA E ROTEAMENTO
// ==========================================

/**
 * Componente: ProtectedRoute (Rota Protegida)
 * Envolve (Wrapper) rotas que exigem login.
 * Se o token não existir no Storage, ele bloqueia o render e chuta pro Login.
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

import Toast from './components/Toast';
import type { ToastType } from './components/Toast';

/**
 * Componente: MainLayout
 * Desenha a "casca" do sistema (Sidebar na lateral esquerda e barra superior no celular).
 * Mantém o Toast global no nível mais alto para que ele flutue por cima de todas as telas.
 */
const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [toast, setToast] = React.useState<{ message: string, type: ToastType } | null>(null);

  // Escuta custom events globais do Window para disparar Toasts de qualquer lugar do sistema
  React.useEffect(() => {
    const handler = (e: any) => setToast(e.detail);
    window.addEventListener('showToast', handler);
    return () => window.removeEventListener('showToast', handler);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-background text-gray-900 dark:text-gray-100 overflow-hidden transition-colors duration-200">
      {/* Toast Global Injetado */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      
      {/* Sidebar Controlada */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TopBar Exclusiva para Mobile (Hambúrguer Menu) */}
        <header className="h-16 flex items-center justify-between px-4 bg-white dark:bg-[#0a0f1d] border-b border-gray-200 dark:border-[#1f2937] md:hidden shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white scale-90">
              <Radio size={16} />
            </div>
            <span className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">Athenas</span>
          </div>
          
          <div className="w-10" /> {/* Spacer para manter o logo centralizado */}
        </header>

        {/* Viewport Principal das Páginas (Rolagem vertical fica isolada aqui) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

// ==========================================
// APLICAÇÃO PRINCIPAL (APP)
// ==========================================

const App: React.FC = () => {
  // Easter Egg / Log Técnico para Desenvolvedores
  React.useEffect(() => {
    const s1 = 'background: #1e293b; color: #fff; padding: 5px 10px; border-radius: 4px 0 0 4px; font-weight: bold;';
    const s2 = 'background: #0ea5e9; color: #fff; padding: 5px 10px; border-radius: 0 4px 4px 0; font-weight: bold;';
    const s3 = 'background: #f8fafc; color: #0284c7; padding: 2px 8px; border-radius: 4px; margin-top: 4px; font-weight: bold; font-size: 10px;';
    
    // Obfuscated signature with UTF-8 support
    const sig = decodeURIComponent(escape(window.atob('SGFuZGNyYWZ0ZWQgYnkgS2F1w6ogQ29ycsOqYQ==')));
    
    console.log('%c🚀 DITEL SYSTEM %c%s', s1, s2, sig);
    console.log('%cv1.0.4', s3);
  }, []);

  return (
    <Router>
      <Routes>
        {/* Rota Pública (Tela Cheia, sem Sidebar) */}
        <Route path="/login" element={<Login />} />

        {/* Asterisco (/*) = Capta tudo que não for login e tenta encaixar no Layout Protegido */}
        <Route path="/*" element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/equipamentos" element={<Equipamentos />} />
                <Route path="/equipamentos-diversos" element={<EquipamentosDiversos />} />
                <Route path="/militares" element={<Militares />} />
                <Route path="/unidades" element={<Unidades />} />
                <Route path="/cautelas" element={<Cautelas />} />
                <Route path="/transferencias" element={<Transferencias />} />
                <Route path="/manutencao" element={<Manutencao />} />
                <Route path="/vtr" element={<Vtr />} />
                <Route path="/extraviados" element={<Extraviados />} />
                <Route path="/usuarios" element={<Usuarios />} />
                <Route path="/auditoria" element={<Auditoria />} />
                <Route path="/perfil" element={<Perfil />} />
                {/* Fallback caso a rota não exista: redireciona para a home (Dashboard) */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
};

export default App;
