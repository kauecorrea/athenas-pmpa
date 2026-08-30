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

      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario));

      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao conectar com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#030712] relative overflow-hidden font-sans p-4 sm:p-8">
      
      {/* 1. UNIFIED BACKGROUND (Tech Dark) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Deep Glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-600/10 blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/10 blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Tech Dot Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:24px_24px] opacity-70"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
      </div>

      {/* 2. UNIFIED GLASS PANEL */}
      <div className="w-full max-w-[1100px] relative z-10 flex flex-col lg:flex-row bg-[#0f172a]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden">
        
        {/* LEFT INSIDE PANEL - INSTITUTIONAL */}
        <div className="w-full lg:w-1/2 p-10 sm:p-14 lg:p-16 border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col justify-between relative bg-gradient-to-br from-white/[0.02] to-transparent">
          
          <div className="relative z-10 flex flex-col gap-1 mb-12">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
              ATHENAS
            </h1>
            <p className="text-[10px] font-bold tracking-[0.25em] text-cyan-400 uppercase">
              Polícia Militar do Pará • DITEL
            </p>
          </div>

          <div className="relative z-10 max-w-sm mb-16 lg:mb-32">
            <h2 className="text-4xl xl:text-5xl font-bold text-white tracking-tight leading-[1.15] mb-6">
              Inventário sob controle.<br/>Decisão com contexto.
            </h2>
            <p className="text-base text-slate-400 font-medium leading-relaxed">
              Acesso institucional ao patrimônio tecnológico, chamados e movimentações das Unidades.
            </p>
          </div>

          {/* Timeline */}
          <div className="relative z-10 flex items-center gap-3 text-[9px] font-black text-slate-500 tracking-widest uppercase">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 ring-4 ring-cyan-400/20 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
              <span className="text-slate-300">Inventário</span>
            </div>
            <div className="w-10 h-[1px] bg-slate-700"></div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
              <span>Chamados</span>
            </div>
            <div className="w-10 h-[1px] bg-slate-700"></div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
              <span>Movimentações</span>
            </div>
          </div>
        </div>

        {/* RIGHT INSIDE PANEL - LOGIN FORM */}
        <div className="w-full lg:w-1/2 p-10 sm:p-14 lg:p-16 flex flex-col justify-center bg-black/20">
          
          <div className="w-full max-w-sm mx-auto relative z-10">
            <div className="text-center mb-10">
              <div className="inline-block p-4 rounded-2xl bg-white/5 border border-white/10 shadow-inner mb-6 backdrop-blur-md">
                <img src="/brasao_pmpa.png" alt="PMPA" className="w-16 h-16 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Bem-vindo</h2>
              <p className="text-sm text-slate-400 font-medium">Use seu e-mail e senha institucional.</p>
            </div>

            {showForgotAlert ? (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="p-5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-100 mb-6 backdrop-blur-md">
                  <h3 className="font-bold mb-3 flex items-center gap-2 text-cyan-400">
                    <Radio size={18} />
                    Protocolo Institucional
                  </h3>
                  <p className="text-sm leading-relaxed opacity-90 text-slate-300">
                    A recuperação de acesso à rede DITEL deve ser solicitada via PAE ou e-mail oficial à Seção de Telemática.
                  </p>
                  <p className="text-sm mt-4 font-mono font-bold text-white bg-black/40 p-3 rounded-lg border border-white/10 text-center">
                    ditelpmpa@gmail.com
                  </p>
                </div>
                <button
                  onClick={() => setShowForgotAlert(false)}
                  className="w-full py-3 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Retornar ao Login
                </button>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold flex items-center gap-3 animate-shake">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                    {error}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="group">
                    <label className="block text-xs font-bold text-slate-400 mb-2 ml-1 tracking-wide uppercase transition-colors group-focus-within:text-cyan-400">E-mail</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nome.sobrenome@pmpa.pa.gov.br"
                      required
                      className="w-full bg-white/5 border border-white/10 focus:bg-white/10 focus:border-cyan-400 focus:ring-[3px] focus:ring-cyan-400/20 rounded-xl px-5 py-3.5 text-sm text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                    />
                  </div>

                  <div className="group">
                    <div className="flex items-center justify-between mb-2 px-1">
                      <label className="block text-xs font-bold text-slate-400 tracking-wide uppercase transition-colors group-focus-within:text-cyan-400">Senha</label>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full bg-white/5 border border-white/10 focus:bg-white/10 focus:border-cyan-400 focus:ring-[3px] focus:ring-cyan-400/20 rounded-xl pl-5 pr-20 py-3.5 text-sm text-white placeholder-slate-500 outline-none transition-all shadow-inner font-medium tracking-widest"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg"
                      >
                        {showPassword ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-1 px-1">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="w-4 h-4 rounded-[4px] border border-white/20 flex items-center justify-center group-hover:border-cyan-400 transition-colors bg-black/20">
                        <input
                          type="checkbox"
                          className="w-2.5 h-2.5 appearance-none checked:bg-cyan-400 rounded-sm transition-all shadow-[0_0_5px_rgba(34,211,238,0.5)]"
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors">Lembrar de mim</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotAlert(true)}
                      className="text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors"
                    >
                      Suporte Técnico
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 mt-6 flex items-center justify-center text-sm font-black text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all active:scale-[0.98] shadow-[0_4px_20px_rgba(37,99,235,0.4)] disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      'VALIDAR ACESSO'
                    )}
                  </button>
                </form>
              </>
            )}

            <div className="mt-12 text-center">
              <p className="text-[9px] text-slate-500 font-bold tracking-[0.3em] uppercase">
                Ambiente de uso restrito
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* VERSION BADGE - FLOATING */}
      <div className="absolute bottom-6 right-6 lg:bottom-8 lg:right-8 flex flex-col items-end opacity-50 hover:opacity-100 transition-opacity z-0">
        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">V2.4.0</span>
        <span className="text-[8px] text-cyan-500 font-bold tracking-widest">ATHENAS OS</span>
      </div>
    </div>
  );
};

export default Login;
