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
    <div className="min-h-screen w-full flex bg-[#f8f9fa] overflow-hidden font-sans">
      
      {/* LEFT PANE - DARK INSTITUTIONAL (50%) */}
      <div className="hidden lg:flex flex-col justify-between w-[50%] bg-[#0a0f1c] relative p-14 2xl:p-20 overflow-hidden">
        {/* Tech Background Effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Cybernetic Glows */}
          <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full bg-blue-600/10 blur-[140px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-600/10 blur-[140px] animate-pulse delay-1000"></div>
          
          {/* Subtle Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        </div>

        <div className="relative z-10 flex flex-col gap-1">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
            ATHENAS
          </h1>
          <p className="text-[11px] font-bold tracking-[0.25em] text-cyan-400 uppercase">
            Polícia Militar do Pará • Diretoria de Telemática
          </p>
        </div>

        <div className="relative z-10 max-w-2xl py-12">
          <h2 className="text-5xl xl:text-6xl 2xl:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-8">
            Inventário sob controle.<br/>Decisão com contexto.
          </h2>
          <p className="text-lg 2xl:text-xl text-slate-400 font-medium leading-relaxed max-w-xl">
            Acesso institucional ao patrimônio tecnológico, chamados e movimentações das Unidades.
          </p>
        </div>

        {/* Timeline Bottom */}
        <div className="relative z-10 flex items-center gap-4 text-[10px] 2xl:text-xs font-black text-slate-500 tracking-widest uppercase">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-cyan-500 ring-4 ring-cyan-500/20"></div>
            <span className="text-white">Inventário</span>
          </div>
          <div className="w-16 2xl:w-24 h-[2px] bg-slate-800"></div>
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-slate-700"></div>
            <span>Chamados</span>
          </div>
          <div className="w-16 2xl:w-24 h-[2px] bg-slate-800"></div>
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-slate-700"></div>
            <span>Movimentações</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANE - LOGIN FORM (50%) */}
      <div className="w-full lg:w-[50%] flex flex-col items-center justify-center p-8 sm:p-12 2xl:p-20 relative bg-white lg:bg-transparent">
        
        {/* Dot Grid Background for Tech/Minimalist vibe */}
        <div className="absolute inset-0 pointer-events-none hidden lg:block bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-60"></div>
        
        {/* Fade mask for dot grid so it blends smoothly */}
        <div className="absolute inset-0 pointer-events-none hidden lg:block bg-gradient-to-b from-white via-transparent to-[#f8f9fa]"></div>

        <div className="w-full max-w-[440px] 2xl:max-w-lg relative z-10 bg-white/70 backdrop-blur-xl lg:bg-transparent lg:backdrop-blur-none p-6 lg:p-0 rounded-2xl lg:rounded-none">
          
          <div className="text-center mb-12">
            <img src="/brasao_pmpa.png" alt="PMPA" className="w-20 h-20 2xl:w-24 2xl:h-24 mx-auto mb-6 drop-shadow-md" />
            <p className="text-[11px] font-black tracking-[0.3em] text-blue-600 uppercase mb-8">
              PMPA - DITEL
            </p>
            <h2 className="text-3xl 2xl:text-4xl font-bold text-slate-900 mb-3 tracking-tight">Entrar no Athenas</h2>
            <p className="text-base text-slate-500 font-medium">Use seu e-mail e senha institucional.</p>
          </div>

          {showForgotAlert ? (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="p-6 rounded-2xl bg-blue-50/80 border border-blue-100 text-blue-900 mb-8 backdrop-blur-sm">
                <h3 className="font-bold mb-3 flex items-center gap-2 text-blue-700 text-lg">
                  <Radio size={20} />
                  Protocolo Institucional
                </h3>
                <p className="text-sm 2xl:text-base leading-relaxed opacity-90 text-slate-700">
                  A recuperação de acesso à rede DITEL deve ser solicitada via PAE ou e-mail oficial à Seção de Telemática.
                </p>
                <p className="text-sm 2xl:text-base mt-5 font-mono font-bold text-slate-800 bg-white p-3 rounded-lg border border-slate-200 text-center shadow-sm">
                  ditelpmpa@gmail.com
                </p>
              </div>
              <button
                onClick={() => setShowForgotAlert(false)}
                className="w-full py-4 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
              >
                Retornar ao Login
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex items-center gap-3 animate-shake shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6 2xl:space-y-8">
                <div className="group">
                  <label className="block text-xs font-bold text-slate-600 mb-2 ml-1 tracking-wide uppercase transition-colors group-focus-within:text-blue-600">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome.sobrenome@pmpa.pa.gov.br"
                    required
                    className="w-full bg-[#f8fafc] border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-[4px] focus:ring-blue-500/20 rounded-xl px-5 py-4 text-base text-slate-900 placeholder-slate-400 outline-none transition-all shadow-sm"
                  />
                </div>

                <div className="group">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <label className="block text-xs font-bold text-slate-600 tracking-wide uppercase transition-colors group-focus-within:text-blue-600">Senha</label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full bg-[#f8fafc] border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-[4px] focus:ring-blue-500/20 rounded-xl pl-5 pr-24 py-4 text-base text-slate-900 placeholder-slate-400 outline-none transition-all shadow-sm font-medium tracking-wide"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg"
                    >
                      {showPassword ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 px-1">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-5 h-5 rounded border-2 border-slate-300 flex items-center justify-center group-hover:border-blue-500 transition-colors bg-white">
                      <input
                        type="checkbox"
                        className="w-3 h-3 appearance-none checked:bg-blue-600 rounded-[2px] transition-all"
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-500 group-hover:text-slate-800 transition-colors">Lembrar de mim</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotAlert(true)}
                    className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Suporte Técnico
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 mt-6 flex items-center justify-center text-base font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-blue-600/30 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-[3px] border-white/40 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'ENTRAR'
                  )}
                </button>
              </form>
            </>
          )}

          <div className="mt-14 text-center">
            <p className="text-[10px] text-slate-400 font-bold tracking-[0.25em] uppercase">
              Ambiente de uso restrito
            </p>
          </div>
        </div>

        {/* VERSION BADGE */}
        <div className="absolute bottom-6 right-6 lg:bottom-10 lg:right-10 flex flex-col items-end opacity-40">
          <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">V2.4.0</span>
          <span className="text-[7px] text-blue-600 font-bold">ATHENAS</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
