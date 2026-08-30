import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Radio, Lock, Mail } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotAlert, setShowForgotAlert] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/auth/login', {
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
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 overflow-hidden bg-[#050811]">

      {/* BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px] animate-pulse delay-700"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
      </div>

      <div className="max-w-md w-full animate-fade-in relative z-10">

        {/* LOGO AREA */}
        <div className="text-center mb-8">
          <div className="relative inline-block group">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/40 transition-all duration-500"></div>
            <img
              src="/brasao_pmpa.png"
              alt="PMPA"
              className="w-24 h-24 object-contain relative z-10 transition-transform duration-500 group-hover:scale-110 drop-shadow-2xl"
            />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter mt-4 uppercase italic">
            Athenas
            <span className="block text-xs font-bold tracking-[0.5em] text-primary mt-1 not-italic opacity-80 uppercase">Telecom DITEL</span>
          </h1>
          <div className="w-12 h-1 bg-primary mx-auto mt-4 rounded-full"></div>
        </div>

        {/* LOGIN CARD */}
        <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl shadow-black/50 overflow-hidden">
          <div className="p-8 md:p-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-6 bg-primary rounded-full"></div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Acesso Restrito</h2>
            </div>

            {showForgotAlert ? (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-200 mb-6">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <Radio size={18} className="text-primary" />
                    Protocolo Institucional
                  </h3>
                  <p className="text-sm leading-relaxed opacity-80">
                    A recuperação de acesso à rede DITEL deve ser solicitada via PAE ou e-mail oficial à Seção de Telemática.
                  </p>
                  <p className="text-xs mt-4 font-mono">
                    ditelpmpa@gmail.com
                  </p>
                </div>
                <button
                  onClick={() => setShowForgotAlert(false)}
                  className="w-full py-3 text-sm font-bold text-gray-400 hover:text-white transition-colors"
                >
                  Retornar ao Início
                </button>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm font-bold flex items-center gap-3 animate-shake">
                    <div className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse"></div>
                    {error}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="relative group">
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-primary transition-colors">E-mail Corporativo</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors" size={18} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nome.sobrenome@pmpa.pa.gov.br"
                        required
                        className="w-full bg-white/5 border border-white/5 group-focus-within:border-primary/50 group-focus-within:bg-white/10 rounded-[1.25rem] pl-12 pr-4 py-4 text-sm text-white placeholder-gray-600 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="relative group">
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-primary transition-colors">Chave de Acesso</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors" size={18} />
                      <input
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full bg-white/5 border border-white/5 group-focus-within:border-primary/50 group-focus-within:bg-white/10 rounded-[1.25rem] pl-12 pr-4 py-4 text-sm text-white placeholder-gray-600 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 px-1">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="w-5 h-5 rounded-md border border-white/10 flex items-center justify-center group-hover:border-primary/50 transition-colors">
                        <input
                          type="checkbox"
                          className="w-3 h-3 appearance-none checked:bg-primary rounded-sm transition-all"
                        />
                      </div>
                      <span className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors">Memorizar sessão</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotAlert(true)}
                      className="text-xs font-bold text-primary hover:text-blue-400 transition-colors"
                    >
                      Suporte Técnico
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full relative py-4 px-4 flex items-center justify-center text-base font-black text-white bg-gradient-to-r from-primary to-blue-700 hover:from-blue-600 hover:to-blue-800 rounded-[1.25rem] transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      'VALIDAR ACESSO'
                    )}
                  </button>
                </form>
              </>
            )}
          </div>

          <div className="px-8 py-5 bg-white/5 border-t border-white/5 text-center flex flex-col gap-1">
            <p className="text-[10px] text-gray-600 font-bold tracking-widest uppercase">
              Polícia Militar do Pará • DITEL
            </p>
          </div>
        </div>

      </div>

      {/* VERSION BADGE */}
      <div className="absolute bottom-10 right-10 flex flex-col items-end opacity-20 hover:opacity-100 transition-opacity">
        <span className="text-[10px] font-black tracking-widest text-white uppercase">V2.4.0 (Stable)</span>
        <span className="text-[8px] text-primary font-bold">ATHENAS OS</span>
      </div>

    </div>
  );
};

export default Login;
