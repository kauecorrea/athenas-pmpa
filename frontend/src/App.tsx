import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Equipamentos from './pages/Equipamentos';
import Militares from './pages/Militares';
import Unidades from './pages/Unidades';
import Cautelas from './pages/Cautelas';
import Transferencias from './pages/Transferencias';
import Manutencao from './pages/Manutencao';
import Extraviados from './pages/Extraviados';
import Usuarios from './pages/Usuarios';
import Perfil from './pages/Perfil';
import Login from './pages/Login';

// Componente para Proteger as Rotas Internas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Layout Padrão com Sidebar para as Telas Internas
const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-background text-gray-900 dark:text-gray-100 overflow-hidden transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto w-full">
        <main className="flex-1 p-4 md:p-6 w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Rota Pública: Login sem Sidebar */}
        <Route path="/login" element={<Login />} />

        {/* Rotas Protegidas com Layout Inteiro */}
        <Route path="/*" element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/equipamentos" element={<Equipamentos />} />
                <Route path="/militares" element={<Militares />} />
                <Route path="/unidades" element={<Unidades />} />
                <Route path="/cautelas" element={<Cautelas />} />
                <Route path="/transferencias" element={<Transferencias />} />
                <Route path="/manutencao" element={<Manutencao />} />
                <Route path="/extraviados" element={<Extraviados />} />
                <Route path="/usuarios" element={<Usuarios />} />
                <Route path="/perfil" element={<Perfil />} />
                {/* Fallback 404 interno */}
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
