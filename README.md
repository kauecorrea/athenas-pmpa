<div align="center">
  <img src="./assets/banner.jpg" alt="Athenas PMPA Banner" style="border-radius: 10px; width: 100%; max-width: 800px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">

  <br />
  <br />

  # 🛡️ ATHENAS - Gestão Patrimonial e Logística
  
  **Plataforma Corporativa da Polícia Militar do Pará (PMPA)**

  <p>
    <img src="https://img.shields.io/badge/React-19-0ea5e9?style=for-the-badge&logo=react" alt="React 19">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
    <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma">
    <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  </p>
  
  *Um sistema centralizado, moderno e seguro para substituição de planilhas manuais, garantindo alta integridade operacional.*
</div>

---

## 📋 Objetivos do Sistema

- 📻 **Inventário de Radiocomunicação:** Registro e acompanhamento do ciclo de vida de rádios móveis e portáteis (Motorola, Tait, etc.) rastreados por número de série, RP (Registro de Patrimônio) e ID virtual.
- 💻 **Equipamentos Diversos:** Cadastro unificado de periféricos, fontes, carregadores, bases e estações fixas.
- 📜 **Cautelas de Equipamentos:** Emissão eletrônica, gerenciamento de empréstimos, controle de devoluções e alertas automáticos de prazos vencidos.
- 🖨️ **Geração de Termos Oficiais (PDF):** Exportação imediata de PDFs com layout institucional da PMPA, configurados para assinatura física e controle burocrático (Gerados direto no Cliente).
- 🚓 **Manutenção de Viaturas (VTR):** Acompanhamento técnico de instalações, remoções e reparos em carros oficiais, incluindo controle de Prefixos e Placas.
- 📦 **Transferência de Cargas:** Registro oficial do envio e recebimento de lotes patrimoniais entre as Unidades Regionais.
- 🕵️ **Auditoria Integrada e Extravios:** Rastreamento inalterável (logs) das ações dos operadores e documentação formal de processos de perda ou furto.

---

## 🛠️ Stack Tecnológica e Arquitetura

O **Athenas** utiliza as tecnologias web mais avançadas do mercado, divididas em uma arquitetura limpa:

### 🎨 Frontend (Interface do Usuário)
- **React 19 & TypeScript:** Construção de componentes SPA robustos.
- **Vite:** Empacotador e servidor de desenvolvimento super veloz.
- **Tailwind CSS & Glassmorphism:** Design tático e imersivo (Dark Mode nativo) focado em micro-transições elegantes e alta legibilidade.
- **Recharts & Lucide Icons:** Dashboards interativos e iconografia moderna.
- **jsPDF + AutoTable:** Motor avançado para desenhar documentos policiais oficias totalmente no front-end.

### ⚙️ Backend (API RESTful)
- **Node.js + Express:** Servidor back-end não bloqueante e leve.
- **Prisma ORM:** Modelagem de dados declarativa e tipagem estrita com TypeScript de ponta a ponta.
- **Autenticação (JWT + Bcrypt):** Proteção sólida de sessões de usuário e senhas criptografadas nativamente.
- **MongoDB:** Banco de dados NoSQL resiliente para comportar alto tráfego e estruturas flexíveis.

---

## 📂 Estrutura do Monorepo

Para simplificar implantação e versionamento, o projeto segue um padrão monorepo:

```text
athenas-pmpa/
├── assets/             # Imagens, banners institucionais e logos (README)
├── backend/            # Lógica do servidor (Express, Prisma, Auth, Controllers)
│   ├── prisma/         # Schema do Banco de Dados
│   ├── src/routes/     # Rotas da API (Documentadas detalhadamente em JSDoc)
│   └── .env.example    # Template de variáveis de ambiente seguras
├── frontend/           # Aplicação Cliente (Vite + React)
│   ├── public/         # Ativos estáticos e Fontes base para o PDF
│   ├── src/pages/      # Páginas da aplicação (Dashboard, Cautelas, Manutenção, etc.)
│   └── .env.example    # Configuração de espelho da API para Produção
└── INICIAR_SISTEMA.bat # Orquestrador local para subir o projeto no Windows
```

---

## 🛡️ Segurança & Confiabilidade (SecAudit)

O ambiente policial exige tolerância zero a falhas ou invasões. O **Athenas** integra medidas rígidas:
1. **Auditoria Anti-Forgery:** Os Logs de Auditoria usam o token inalterável da sessão (decodificado pela Middleware) em vez de cabeçalhos fáceis de manipular.
2. **Mitigação de Injeção de Banco (NoSQLi/SQLi):** Uso de ORM fortemente tipado isola a entrada de dados.
3. **SSRF Blocker:** O fardo de gerar e baixar PDFs institucionais cai 100% sobre o navegador web, mantendo o servidor principal imune.
4. **Proteção Anti-DDoS:** Limitação baseada em IP implementada nas rotas principais usando o `express-rate-limit`.

---

## 🚀 Guia Rápido de Instalação

### Pré-requisitos Básicos
- Node.js (v18+)
- MongoDB Community Server (v6+) executando na porta `27017`.

### Passo a Passo

#### 1. Configure os Ambientes (Variáveis Globais)
Dentro da pasta `backend/` e da pasta `frontend/`, você encontrará arquivos chamados **`.env.example`**.
Duplique-os e renomeie-os para **`.env`**, certificando-se de alinhar a porta da API e o Secret do JWT.

#### 2. Inicie o Banco e Dependências
Abra um terminal na pasta `/backend`:
```bash
npm install
npx prisma generate
npm run dev
```
O servidor da API iniciará em `http://localhost:3333`.

#### 3. Inicie o Frontend Visual
Abra um novo terminal na pasta `/frontend`:
```bash
npm install
npm run dev
```
A plataforma visual ficará disponível no seu navegador em `http://localhost:5173`.

> 💡 **Usuários Windows:** 
> Você pode dar um simples duplo-clique no arquivo `INICIAR_SISTEMA.bat` na raiz do projeto para subir simultaneamente o Back e o Front!

---

<div align="center">
  <p><i>Código desenvolvido sob a máxima precisão arquitetural. Handoff finalizado para a PMPA.</i></p>
</div>
