import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Radio } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotAlert, setShowForgotAlert] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen w-full flex bg-[#f4f4f0] overflow-hidden font-sans">
      
      {/* LEFT PANE - DARK INSTITUTIONAL */}
      <div className="hidden lg:flex flex-col justify-between w-[60%] bg-[#0f172a] relative p-12 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/20 blur-[120px] animate-pulse delay-700"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        </div>

        <div className="relative z-10">
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">
            ATHENAS
          </h1>
          <p className="text-[10px] font-bold tracking-[0.2em] text-emerald-400 mt-1 uppercase">
            Polícia Militar do Pará • Diretoria de Telemática
          </p>
        </div>

        <div className="relative z-10 max-w-2xl py-12">
          <h2 className="text-5xl xl:text-6xl font-bold text-white tracking-tight leading-[1.05] mb-6">
            Inventário sob controle.<br/>Decisão com contexto.
          </h2>
          <p className="text-lg text-slate-300 font-medium leading-relaxed max-w-xl">
            Acesso institucional ao patrimônio tecnológico, chamados e movimentações das Unidades.
          </p>
        </div>

        {/* Timeline Bottom */}
        <div className="relative z-10 flex items-center gap-3 text-[10px] font-black text-slate-500 tracking-widest uppercase">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/20"></div>
            <span className="text-white">Inventário</span>
          </div>
          <div className="w-16 h-[2px] bg-slate-800"></div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-700"></div>
            <span>Chamados</span>
          </div>
          <div className="w-16 h-[2px] bg-slate-800"></div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-700"></div>
            <span>Movimentações</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANE - LOGIN FORM */}
      <div className="w-full lg:w-[40%] flex flex-col items-center justify-center p-8 sm:p-12 relative bg-white lg:bg-[#f8f9fa]">
        <div className="w-full max-w-sm relative z-10">
          
          <div className="text-center mb-10">
            <img src="/brasao_pmpa.png" alt="PMPA" className="w-16 h-16 mx-auto mb-4 drop-shadow-sm" />
            <p className="text-[10px] font-black tracking-[0.25em] text-primary uppercase mb-6">
              PMPA - DITEL
            </p>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Entrar no Athenas</h2>
            <p className="text-sm text-slate-500">Use seu e-mail e senha institucional.</p>
          </div>

          {showForgotAlert ? (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="p-5 rounded-xl bg-blue-50 border border-blue-100 text-blue-900 mb-6">
                <h3 className="font-bold mb-2 flex items-center gap-2 text-primary">
                  <Radio size={18} />
                  Protocolo Institucional
                </h3>
                <p className="text-sm leading-relaxed opacity-90 text-slate-700">
                  A recuperação de acesso à rede DITEL deve ser solicitada via PAE ou e-mail oficial à Seção de Telemática.
                </p>
                <p className="text-xs mt-4 font-mono font-bold text-slate-800">
                  ditelpmpa@gmail.com
                </p>
              </div>
              <button
                onClick={() => setShowForgotAlert(false)}
                className="w-full py-3 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
              >
                Retornar ao Login
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex items-center gap-3 animate-shake">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></div>
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome.sobrenome@pmpa.pa.gov.br"
                    required
                    className="w-full bg-white border border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-lg px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5 px-1">
                    <label className="block text-xs font-semibold text-slate-600">Senha</label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full bg-white border border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-lg pl-4 pr-20 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary hover:text-blue-700 transition-colors px-2 py-1"
                    >
                      {showPassword ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 px-1">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center group-hover:border-primary transition-colors bg-white">
                      <input
                        type="checkbox"
                        className="w-2.5 h-2.5 appearance-none checked:bg-primary rounded-sm transition-all"
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700 transition-colors">Lembrar de mim</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotAlert(true)}
                    className="text-xs font-bold text-primary hover:text-blue-700 transition-colors"
                  >
                    Suporte Técnico
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 mt-4 flex items-center justify-center text-sm font-bold text-white bg-[#006aff] hover:bg-blue-600 rounded-lg transition-all active:scale-[0.98] shadow-sm disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Entrar'
                  )}
                </button>
              </form>
            </>
          )}

          <div className="mt-12 text-center">
            <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase">
              Ambiente de uso restrito
            </p>
          </div>
        </div>

        {/* VERSION BADGE FOR MOBILE (Hidden on desktop as it doesn't fit the clean look) */}
        <div className="absolute bottom-6 right-6 lg:hidden flex flex-col items-end opacity-40">
          <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">V2.4.0</span>
          <span className="text-[7px] text-primary font-bold">ATHENAS</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
