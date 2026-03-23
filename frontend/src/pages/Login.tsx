import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Radio } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:3333/api/auth/login', {
        email,
        senha
      });

      const { token, usuario } = response.data;
      
      // Salva no LocalStorage
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario));

      // Redireciona para o Dashboard
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao conectar com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1d] flex items-center justify-center p-4 transition-colors">
      
      <div className="max-w-md w-full animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white mx-auto shadow-lg shadow-primary/30 mb-4">
            <Radio size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Controle Patrimonial</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Polícia Militar do Estado do Pará</p>
        </div>

        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Acesso ao Sistema</h2>
            
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@pmpa.pa.gov.br"
                  required
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Senha</label>
                <input 
                  type="password" 
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary bg-gray-50 dark:bg-[#111827] dark:border-[#374151]" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Lembrar-me</span>
                </label>
                <a href="#" className="text-sm font-medium text-primary hover:text-blue-500 transition-colors">Esqueceu a senha?</a>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 flex items-center justify-center text-sm font-bold text-white bg-primary hover:bg-blue-600 rounded-lg transition-colors shadow-lg shadow-blue-600/30 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Autenticando...' : 'Entrar no Sistema'}
              </button>
            </form>
          </div>
          <div className="px-8 py-4 bg-gray-50 dark:bg-[#111827] border-t border-gray-200 dark:border-[#1f2937] text-center">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Sistema Restrito • PMPA {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
