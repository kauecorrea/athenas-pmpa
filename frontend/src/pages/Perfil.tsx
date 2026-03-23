import React from 'react';
import { Upload, Shield, Mail, Lock } from 'lucide-react';

const Perfil: React.FC = () => {
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
               <svg xmlns="http://www.w3.org/-2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 dark:text-gray-500"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
               Foto de Perfil
            </h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 -mt-4">Escolha uma foto para personalizar seu perfil</p>
          
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-[#1e293b] flex items-center justify-center text-white text-2xl font-medium shrink-0">
              K
            </div>
            <div>
              <button className="flex items-center gap-2 bg-gray-100 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] hover:bg-gray-200 dark:hover:bg-[#1f2937] text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors mb-2">
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
                defaultValue="Kauê Henrique Corrêa Palheta"
                className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome de Guerra</label>
              <input 
                type="text" 
                defaultValue="Kauê"
                className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Posto/Graduação</label>
              <input 
                type="text" 
                placeholder="Ex: 1º Sargento"
                className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Unidade</label>
              <div className="relative">
                <select 
                  className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                  defaultValue="DITEL"
                >
                  <option value="DITEL">DITEL</option>
                  <option value="CIEPAS">CIEPAS</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>
          </div>
          <button className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-lg shadow-blue-600/20">
            Salvar Alterações
          </button>
        </div>

        {/* CARD ALTERAR EMAIL */}
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl p-6 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="text-gray-400 dark:text-gray-500" size={20} />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Alterar Email</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Email atual: kauehenrique08@gmail.com</p>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Novo Email</label>
            <input 
              type="email" 
              placeholder="Digite o novo email"
              className="w-full md:w-1/2 min-w-[300px] bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <button className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-lg shadow-blue-600/20">
            Alterar Email
          </button>
        </div>

        {/* CARD ALTERAR SENHA */}
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937] rounded-xl p-6 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="text-gray-400 dark:text-gray-500" size={20} />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Alterar Senha</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Escolha uma senha forte para proteger sua conta</p>
          
          <div className="space-y-4 mb-6 md:w-1/2 min-w-[300px]">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nova Senha</label>
              <input 
                type="password" 
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirmar Nova Senha</label>
              <input 
                type="password" 
                placeholder="Digite a senha novamente"
                className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>
          <button className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-lg shadow-blue-600/20">
            Alterar Senha
          </button>
        </div>

      </div>

    </div>
  );
};

export default Perfil;
