# 🛡️ ATHENAS - Sistema de Gestão Patrimonial e Logística (PMPA)

O **ATHENAS** é uma plataforma corporativa desenvolvida sob medida para a **Polícia Militar do Pará (PMPA)**. Seu objetivo estratégico é substituir planilhas e processos manuais de organização patrimonial por um sistema centralizado, moderno e de alta integridade operacional.

O sistema atua diretamente na governança de equipamentos de radiocomunicação, transferências de cargas, cautelas eletrônicas, termos de cautela oficiais e ordens de serviço para radiocomunicação de viaturas (VTR).

---

## 📋 Objetivos do Sistema

* **Inventário de Radiocomunicação:** Registro e acompanhamento do ciclo de vida de rádios móveis e portáteis (Motorola, Tait, etc.), rastreados por número de série, RP (Registro de Patrimônio) e ID virtual.
* **Cautelas de Equipamentos:** Emissão eletrônica e gerenciamento de cautelas ativas, vencidas ou devolvidas vinculadas diretamente a militares cadastrados.
* **Geração de Termos Oficiais:** Exportação em tempo de execução de PDFs no modelo oficial padrão da PMPA, prontos para assinatura física/digital do militar responsável pelas cargas.
* **Manutenção de VTR (Ordens de Serviço):** Acompanhamento técnico de instalações, remoções e reparos de radiocomunicação instalados nas viaturas, contendo km, prefixo, placa, serviços executados e laudo técnico.
* **Transferência de Cargas:** Registro e trâmite oficial de envio e recebimento de lotes de equipamentos entre Unidades/Coint da corporação.
* **Auditoria Integrada:** Rastreamento inalterável de todas as ações executadas na plataforma pelos operadores para fins de segurança operacional.

---

## 🛠️ Stack Tecnológica

### Frontend (Interface do Usuário)
* **React 19 & TypeScript:** Construção de componentes SPA robustos e fortemente tipados.
* **Vite:** Empacotador e servidor de desenvolvimento ágil.
* **Tailwind CSS & Glassmorphic Design:** Visual moderno, escuro e translúcido, focado em micro-transições elegantes e alta legibilidade de dados.
* **Recharts:** Gráficos interativos para tomada de decisão (fluxo semanal e capacidade operativa).
* **jsPDF & jsPDF-AutoTable:** Geração de laudos e termos de cautela institucionais diretamente no cliente, livre de processamento em servidor.

### Backend (API RESTful)
* **Node.js & Express:** Servidor de rotas e processamento assíncrono leve.
* **Prisma ORM:** Abstração e modelagem estruturada de dados.
* **Criptografia & Sessão:** Hash de senhas com `bcryptjs` e emissão de tokens de sessão criptografados com `JSON Web Tokens` (JWT).
* **Segurança contra DDoS:** `express-rate-limit` integrado nas rotas `/api`.

### Banco de Dados
* **MongoDB:** Banco de dados NoSQL escalável e resiliente baseado em documentos.

---

## 📂 Estrutura do Projeto

A raiz do projeto é organizada como um monorepo simples e de fácil portabilidade, isolando as responsabilidades de forma clara e limpa:

```text
athenas-pmpa/
├── backend/            # API RESTful, modelos Prisma e lógica de banco (Node.js/Prisma)
│   ├── prisma/         # Arquivo schema.prisma e scripts de inicialização
│   └── src/            # Controladores, rotas e middlewares (auth e logs de auditoria)
├── frontend/           # Interface SPA em React 19, TypeScript e Tailwind CSS v3
│   ├── public/         # Ativos estáticos e brasão oficial PMPA
│   └── src/            # Componentes visuais premium, páginas e utilitários
├── mongodb_data/       # Diretório local opcional dos dados do MongoDB (Ignorado no Git)
├── INICIAR_SISTEMA.bat # Script batch automatizado para Windows (Ignorado no Git)
└── package.json        # Scripts utilitários globais de automação do monorepo
```

> [!NOTE]
> Para garantir a integridade da arquitetura e evitar redundâncias, o ecossistema de estilos (Tailwind CSS e PostCSS) é gerenciado nativamente dentro do diretório `/frontend`. A raiz do monorepo abriga estritamente scripts facilitadores de orquestração global. Arquivos e logs residuais temporários de desenvolvimento foram totalmente expurgados, deixando apenas o estritamente necessário no padrão corporativo.

---

## 🛡️ Políticas de Segurança & Auditoria (SecAudit)

Após auditoria rigorosa contra vulnerabilidades críticas (OWASP Top 10), o ATHENAS conta com os seguintes pilares de segurança implementados:

1. **Prevenção contra Log Forgery e Personificação:** A gravação de logs de auditoria no banco de dados [auditoria.ts](backend/src/utils/auditoria.ts) utiliza como fonte primária a assinatura digital inalterável decodificada do token JWT (`req.usuario`), impedindo que cabeçalhos HTTP customizados alterem a identidade do operador do log.
2. **Mitigação Total de Injeções (SQL/NoSQL):** O uso do Prisma ORM tipado sem requisições cruas isola nativamente o banco de dados MongoDB contra tentativas de bypass de login ou injeções de filtros.
3. **Segurança de Geração de Documentos:** A geração de laudos em PDF é processada totalmente no navegador do cliente (client-side), blindando o servidor backend contra ataques de Server-Side Request Forgery (SSRF).
4. **Prevenção de Ataques de Força Bruta:** Limitação automatizada de 300 requisições a cada 15 minutos em todos os endpoints para inviabilizar ataques de dicionário na rota de Login.

---

## 🚀 Como Instalar e Executar

### Pré-requisitos
* Node.js v18.0 ou superior instalado.
* MongoDB rodando localmente (padrão na porta `27017`) ou uma string de conexão de cluster válida (`DATABASE_URL`).

### ⚡ Modo Rápido (Apenas Windows)
Se estiver em ambiente Windows com o MongoDB rodando como serviço local, você pode usar o arquivo utilitário **`INICIAR_SISTEMA.bat`** localizado na raiz do projeto. 
* Dê dois cliques no arquivo: ele iniciará automaticamente o backend e o frontend simultaneamente em abas dedicadas do terminal.

---

### 💻 Inicialização Manual

#### 1. Configurando o Banco de Dados (Backend)
Abra uma janela de terminal no diretório `/backend`:
1. Copie o arquivo `.env.example` (se disponível) para `.env` e configure sua URL de conexão MongoDB:
   ```env
   DATABASE_URL="mongodb://localhost:27017/athenas"
   JWT_SECRET="insira-um-segredo-forte-aqui-em-producao"
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Gere o Prisma Client correspondente:
   ```bash
   npx prisma generate
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
O backend estará de pé na porta `http://localhost:3333`.

#### 2. Configurando a Interface (Frontend)
Abra uma nova janela de terminal no diretório `/frontend`:
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o servidor local do Vite:
   ```bash
   npm run dev
   ```
A interface do usuário estará online em `http://localhost:5173`.
