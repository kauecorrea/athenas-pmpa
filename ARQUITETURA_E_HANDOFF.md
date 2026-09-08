# Guia de Arquitetura e Handoff Técnico - ATHENAS

Este documento é destinado exclusivamente à equipe de **Engenharia de Software e TI da Polícia Militar do Pará (PMPA)**. Ele descreve a arquitetura, as decisões de design, a estrutura de pastas e fornece um guia de resolução de problemas (Troubleshooting) para facilitar a manutenção e evolução do código-fonte do Sistema ATHENAS.

---

## 1. Stack Tecnológica Base

### 1.1. Frontend
* **Core:** React 19 executado via Vite.
* **Linguagem:** TypeScript (Strict Mode ativado).
* **Estilização:** Tailwind CSS (focado no padrão Dark Mode e Glassmorphism).
* **Roteamento:** `react-router-dom` (SPA).
* **Comunicação de Rede:** `axios` com uso de Interceptors para injeção de Token JWT.
* **Geração de Relatórios:** `jspdf` e `jspdf-autotable` (Processamento totalmente Client-Side).
* **Ícones e Gráficos:** `lucide-react` e `recharts`.

### 1.2. Backend
* **Core:** Node.js (v18+) com Express.
* **Linguagem:** TypeScript (compilado via `tsc`).
* **Banco de Dados:** MongoDB (NoSQL).
* **ORM:** Prisma Client (`prisma` e `@prisma/client`).
* **Segurança:** 
  * `bcryptjs` para Hash de senhas (salt 10 rounds).
  * `jsonwebtoken` para controle de sessão sem estado (Stateless).
  * `express-rate-limit` contra ataques de força bruta.
  * `helmet` e `express-mongo-sanitize` na raiz para proteção de cabeçalhos e injeções NoSQL.

---

## 2. Topologia do Monorepo

O projeto está configurado como um monorepo simples contendo duas aplicações principais isoladas:

```text
athenas-pmpa/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma         # Modelagem central do Banco de Dados. ÚNICA fonte de verdade.
│   ├── src/
│   │   ├── middlewares/          # auth.middleware.ts (Verifica JWT) e admin.middleware.ts (Nível de Acesso)
│   │   ├── routes/               # Controladores CRUD (separados por domínio: equipamentos, usuários, etc.)
│   │   ├── utils/                # Utilitários globais (Ex: auditoria.ts para logs imutáveis)
│   │   └── index.ts              # Ponto de entrada do Express (Configuração de CORS, Helmet e inicialização)
│   ├── .env.example              # Chaves necessárias (DATABASE_URL, JWT_SECRET)
│   └── package.json
│
├── frontend/
│   ├── public/                   # Imagens base, Brasão da PMPA, fontes.
│   ├── src/
│   │   ├── components/           # Componentes reutilizáveis (Sidebar, Modal, Toast)
│   │   ├── pages/                # Telas completas roteáveis (Ex: Cautelas.tsx, Dashboard.tsx)
│   │   ├── App.tsx               # Entrypoint do roteador e Interceptor Global do Axios
│   │   └── main.tsx              # Ponto de montagem no DOM
│   ├── .env.example              # VITE_API_URL (Aponta para o Backend)
│   ├── tailwind.config.js        # Tokens de design do Tailwind
│   └── package.json
```

---

## 3. Padrões de Arquitetura e Decisões de Design

### 3.1. Autenticação e Interceptação (Frontend)
A autenticação não utiliza cookies. Em vez disso, o token JWT recebido no login é salvo no `localStorage`.
**Como funciona:** O arquivo `App.tsx` possui um interceptor global do Axios. **Todas** as requisições que saem do frontend automaticamente ganham o cabeçalho `Authorization: Bearer <token>`.
Se o backend responder com Status `401 Unauthorized` (ex: o token expirou), o interceptor captura o erro centralizadamente, apaga o cache local e joga o usuário brutalmente para a tela `/login`.

### 3.2. Middleware de Proteção (Backend)
Toda rota que exige login no Express (`backend/src/routes`) passa pela `auth.middleware.ts`. 
Esta middleware extrai o JWT, verifica a validade criptográfica e injeta o `req.usuario` contendo o ID e Permissão do policial. Rotas destrutivas (ex: `router.delete`) passam por uma segunda camada, a `admin.middleware.ts`, que interrompe a requisição se a permissão não for "Administrador".

### 3.3. Log de Auditoria Imutável
A rastreabilidade não depende do frontend. O backend utiliza um serviço em `backend/src/utils/auditoria.ts`.
Toda vez que uma rota de Criação, Atualização ou Exclusão (CUD) é disparada com sucesso, esse script lê o ID do usuário direto do token validado (`req.usuario`) e salva no MongoDB um registro imutável com Ação, Alvo e Timestamp. *Nunca confie no frontend para dizer "quem" está fazendo a ação.*

### 3.4. Geração de PDF no Cliente
Para não sobrecarregar o servidor Node.js com processamento binário ou depender de bibliotecas como o Puppeteer (que consomem muita RAM), todo o processo de gerar **Termos de Responsabilidade** foi transferido para o navegador do cliente usando a biblioteca `jspdf`. As funções de desenho (`gerarPDF`) ficam embutidas nas páginas React (Ex: `Cautelas.tsx`).

---

## 4. Dívida Técnica Mapeada e Limitações Atuais

A equipe que assumir o sistema deve estar ciente das seguintes características/limitações da V1:

1. **Separação por Unidade (OPM):** O banco de dados salva a unidade dos equipamentos e usuários, mas as Consultas (GET) atuais no backend trazem dados globais. Ou seja, um operador do Batalhão X consegue visualizar a lista de rádios do Batalhão Y. Caso o Comando decida por um isolamento regional estrito, será necessário alterar as queries do Prisma nos arquivos `.routes.ts` para filtrar usando o `req.usuario.unidade`.
2. **Backlog Institucional (Aprovação Superior Necessária):**
   - **Matriz de Permissões:** Hoje a regra é simples (Operador faz quase tudo operacionalmente, Admin exclui e gerencia contas). Para um controle mais granular, a corporação precisa elaborar a "Matriz Oficial de Acesso" e implementar as amarras nas respectivas rotas de Controller.
   - **Bateria de Testes:** Não há testes E2E (`Cypress`/`Playwright`) ou unitários (`Jest`) automatizados na CI/CD do sistema.
   - **Políticas de Retenção de LOG:** Há a tabela `auditoria`, mas ainda não existe um processo em lote agendado para arquivá-los a longo prazo ou varrer itens deletados de acordo com a LGPD/Protocolo PMPA.
3. **Módulo VTR sem Vínculo Permanente:** O banco de dados trata a VTR como uma ordem de serviço (registro de instalação temporal), e não como uma entidade rígida (Carro -> Rádio). Isso facilita a flexibilidade, mas impede relatórios de frota a longo prazo.

---

## 5. Guia de Resolução de Problemas (Troubleshooting)

### Problema: "Erro de Prisma / Não encontra Modelos"
* **Causa:** O schema do MongoDB foi alterado (adicionado um campo novo) e o Prisma Client que roda dentro de `node_modules` está desatualizado.
* **Solução:** Acesse a pasta `/backend` e rode:
  ```bash
  npx prisma generate
  ```

### Problema: "Frontend não conecta no Backend (Network Error)"
* **Causa:** O Vite está tentando bater em `localhost:3333` mas o Node.js caiu, ou o sistema foi levado para Produção e o `.env` do Frontend não foi atualizado.
* **Solução:** Crie o arquivo `frontend/.env` e especifique a variável `VITE_API_URL="http://IP-DO-SERVIDOR-AQUI"`. Recompile o frontend (`npm run build`).

### Problema: "Migrações e Limpeza Geral do Banco"
Como o MongoDB é NoSQL, o Prisma não usa comandos tradicionais de `migrate`. Se você precisar "limpar" o banco (Drop) durante o desenvolvimento para recomeçar do zero:
* **Solução:** Entre no MongoDB Compass, acesse o banco `athenas`, selecione todas as coleções e clique no ícone de lixeira. Reinicie a aplicação backend e crie um usuário via Postman na rota `POST /api/usuarios` para ter o primeiro admin.

---

## 6. Fluxo de Publicação (Deploy)

Recomendações para hospedar o Athenas:
1. **Banco de Dados:** Utilizar o MongoDB Atlas (Cloud) ou um cluster Docker interno da PM.
2. **Backend:** Subir a pasta `backend` através de um container Docker ou usar um gerenciador de processos como `PM2` (Ex: `pm2 start dist/index.js --name athenas-api`).
3. **Frontend:** Compilar os arquivos estáticos (`npm run build` dentro da pasta frontend) e hospedar o conteúdo gerado na pasta `dist/` usando o NGINX, Apache, ou enviá-los para um serviço como Vercel/Netlify. Não use `npm run dev` em produção!
