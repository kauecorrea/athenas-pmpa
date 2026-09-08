import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Upload, Shield, Lock, User } from 'lucide-react';

const Perfil: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);

  // Basico
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [nomeGuerra, setNomeGuerra] = useState('');
  const [posto, setPosto] = useState('');
  const [unidade, setUnidade] = useState('DITEL');

  // Autenticação
  const [loginAtual, setLoginAtual] = useState('');
  const [emailContato, setEmailContato] = useState('');

  // Senha
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  // Avatar
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Carregar os dados logados do session
    const userStr = localStorage.getItem('usuario');
    if (userStr) {
      const u = JSON.parse(userStr);
      setUserId(u.id);
      setNomeCompleto(u.nomeCompleto || '');
      setNomeGuerra(u.nomeGuerra || '');
      setPosto(u.posto || '');
      setUnidade(u.unidade || 'DITEL');
      setLoginAtual(u.login || '');
      setEmailContato(u.email || '');
      
      // Recuperar avatar (UI Local)
      const savedAvatar = localStorage.getItem(`avatar_${u.id}`);
      if (savedAvatar) setAvatar(savedAvatar);
    }
  }, []);

  const getInitials = () => {
    if (!nomeGuerra && !nomeCompleto) return 'U';
    return (nomeGuerra || nomeCompleto).charAt(0).toUpperCase();
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("A imagem excede o tamanho máximo de 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatar(base64String);
        if (userId) {
          localStorage.setItem(`avatar_${userId}`, base64String); // Salvar localmente vinculado ao perfil
        }
        window.dispatchEvent(new Event('avatar-updated'));
      };
      reader.readAsDataURL(file);
    }
  };

  const syncLocalUsuario = (updatedProps: any) => {
    const userStr = localStorage.getItem('usuario');
    if (userStr) {
      const u = JSON.parse(userStr);
      const newU = { ...u, ...updatedProps };
      localStorage.setItem('usuario', JSON.stringify(newU));
      
      // Emit events so Header could theoretically pick it up if needed.
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleSalvarBasico = async () => {
    if (!userId) return;
    try {
      await axios.put(`/api/usuarios/me`, {
        nomeCompleto,
        nomeGuerra
      });
      syncLocalUsuario({ nomeCompleto, nomeGuerra });
      alert("Informações atualizadas com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar informações básicas.");
    }
  };

  const handleSalvarAutenticacao = async () => {
    if (!userId) return;
    
    try {
      await axios.put(`/api/usuarios/me`, {
        email: emailContato
      });
      syncLocalUsuario({ email: emailContato });
      alert("Autenticação atualizada com sucesso!");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Erro ao alterar autenticação.");
    }
  };

  const handleAlterarSenha = async () => {
    if (!userId) return;
    if (novaSenha.length < 10) {
      alert("A senha deve ter no mínimo 10 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      alert("As senhas não coincidem!");
      return;
    }
    try {
      await axios.put(`/api/usuarios/me`, {
        senha: novaSenha
      });
      setNovaSenha('');
      setConfirmarSenha('');
      alert("Senha alterada com extrema segurança!");
    } catch (err) {
      console.error(err);
      alert("Erro ao tentar alterar senha.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in text-gray-900 dark:text-white h-full flex flex-col transition-colors duration-200 pb-10">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Meu Perfil</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie suas informações pessoais e configurações</p>
      </div>

      <div className="space-y-6">
        
        {/* CARD FOTO DE PERFIL */}
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl p-6 transition-colors">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
               <User className="text-gray-400 dark:text-gray-500" size={20} />
               Foto de Perfil
            </h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 -mt-4">Escolha uma foto para personalizar seu perfil</p>
          
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-[#1e293b] flex items-center justify-center text-white text-2xl font-medium shrink-0 overflow-hidden shadow-inner">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                getInitials()
              )}
            </div>
            <div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-gray-100 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] hover:bg-gray-200 dark:hover:bg-[#1f2937] text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors mb-2"
              >
                <Upload size={16} />
                Escolher Foto
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-500">JPG, PNG ou GIF. Tamanho máximo: 2MB</p>
            </div>
          </div>
        </div>

        {/* CARD INFORMAÇÕES PESSOAIS */}
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl p-6 transition-colors">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="text-gray-400 dark:text-gray-500" size={20} />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Informações Pessoais</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 -mt-4">Atualize suas informações de identificação</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome Completo</label>
              <input 
                type="text" 
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome de Guerra</label>
              <input 
                type="text" 
                value={nomeGuerra}
                onChange={(e) => setNomeGuerra(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Posto/Graduação
                <span className="text-[10px] bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 px-2 py-0.5 rounded-full">Não Editável</span>
              </label>
              <div className="relative">
                <select 
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none appearance-none opacity-60 cursor-not-allowed"
                  value={posto}
                  onChange={(e) => setPosto(e.target.value)}
                  disabled={true}
                >
                  <option value="">Selecione...</option>
                  <option value="Coronel PM">Coronel PM</option>
                  <option value="Tenente-Coronel PM">Tenente-Coronel PM</option>
                  <option value="Major PM">Major PM</option>
                  <option value="Capitão PM">Capitão PM</option>
                  <option value="1º Tenente PM">1º Tenente PM</option>
                  <option value="2º Tenente PM">2º Tenente PM</option>
                  <option value="Aspirante-a-Oficial PM">Aspirante-a-Oficial PM</option>
                  <option value="Subtenente PM">Subtenente PM</option>
                  <option value="1º Sargento PM">1º Sargento PM</option>
                  <option value="2º Sargento PM">2º Sargento PM</option>
                  <option value="3º Sargento PM">3º Sargento PM</option>
                  <option value="Cabo PM">Cabo PM</option>
                  <option value="Soldado PM">Soldado PM</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Unidade Principal
                <span className="text-[10px] bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 px-2 py-0.5 rounded-full">Não Editável</span>
              </label>
              <div className="relative">
                <select 
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none appearance-none opacity-60 cursor-not-allowed"
                  value={unidade}
                  onChange={(e) => setUnidade(e.target.value)}
                  disabled={true}
                >
                  <option value="DITEL">DITEL</option>
                  <option value="CIEPAS">CIEPAS</option>
                  <option value="BOPE">BOPE</option>
                  <option value="CHOQUE">CHOQUE</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={handleSalvarBasico}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-lg shadow-blue-600/20"
          >
            Salvar Alterações
          </button>
        </div>

        {/* CARD ALTERAR AUTENTICAÇÃO */}
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl p-6 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="text-gray-400 dark:text-gray-500" size={20} />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Autenticação (Login)</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">Login atual: <span className="text-primary">{loginAtual || 'Carregando...'}</span></p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Identificador de Login</label>
            <input 
              type="text" 
              value={loginAtual}
              disabled
              title="Para alterar sua matrícula/login, solicite à Administração."
              className="w-full md:w-1/2 min-w-[300px] bg-gray-100 dark:bg-[#111827]/50 border border-gray-200 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">O login não pode ser alterado por motivos de segurança.</p>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">E-mail de Contato (Opcional)</label>
            <input 
              type="text" 
              value={emailContato}
              onChange={(e) => setEmailContato(e.target.value.toLowerCase())}
              placeholder="E-mail opcional"
              className="w-full md:w-1/2 min-w-[300px] bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <button 
            onClick={handleSalvarAutenticacao}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-lg shadow-blue-600/20"
          >
            Salvar Autenticação
          </button>
        </div>

        {/* CARD ALTERAR SENHA */}
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl p-6 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="text-gray-400 dark:text-gray-500" size={20} />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Segurança Operacional</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Escolha uma senha blindada para proteger sua matrícula</p>
          
          <div className="space-y-4 mb-6 md:w-1/2 min-w-[300px]">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nova Senha</label>
              <input 
                type="password" 
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirmar Nova Senha</label>
              <input 
                type="password" 
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Digite a senha novamente"
                className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>
          <button 
            onClick={handleAlterarSenha}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-lg shadow-blue-600/20"
          >
            Renovar Senha
          </button>
        </div>

      </div>

    </div>
  );
};

export default Perfil;
