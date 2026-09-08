# Guia de Arquitetura e Handoff Técnico - ATHENAS

Este documento é destinado à equipe de **Engenharia de Software e TI da Polícia Militar do Pará (PMPA)**. Ele reflete o estado atual, real e testado da aplicação após auditoria de segurança rigorosa, delimitando claramente o que está protegido e o que precisa ser assumido como dívida técnica ou pauta gerencial pela corporação.

---

## 1. Stack Tecnológica Base

### 1.1. Frontend
* **Core:** React 19 via Vite.
* **Linguagem:** TypeScript (Strict Mode).
* **Estilização:** Tailwind CSS (Dark Mode nativo).
* **Comunicação:** `axios` com injeção automática de Token JWT via Interceptors. O Token fica alocado no `localStorage`.
* **Geração de Relatórios:** Totalmente Client-Side via `jspdf` e `jspdf-autotable`.

### 1.2. Backend
* **Core:** Node.js (v18+) com Express.
* **Linguagem:** TypeScript.
* **Banco de Dados:** MongoDB (Requer Replica Set ativado para Transações).
* **ORM:** Prisma Client.
* **Segurança Base:** 
  * `bcryptjs` (salt 10) para Hash.
  * JWT Stateless (24h de duração) para sessões.
  * `express-rate-limit`, `helmet` e `express-mongo-sanitize`.

---

## 2. Topologia do Monorepo

```text
athenas-pmpa/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma         # Modelagem do DB. Default fallback = Operador.
│   ├── src/
│   │   ├── middlewares/          # auth.middleware.ts e admin.middleware.ts
│   │   ├── routes/               # Controladores CRUD isolados por domínio
│   │   ├── utils/                # Utilitários (Ex: log em tabela de auditoria)
│   │   └── index.ts              # Ponto de entrada (Dotenv configurado na Linha 1)
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/                # Telas UI (Ex: Perfil.tsx com blindagem de edição)
│   │   └── App.tsx               # Roteador e Interceptor de Autenticação
│   ├── tailwind.config.js
│   └── package.json
```

---

## 3. Riscos de Segurança Corrigidos (V1 Stable)

As seguintes vulnerabilidades críticas foram rastreadas e bloqueadas no código-fonte atual:

1. **Auto-Promoção e Alteração Funcional:** A rota `/api/usuarios/me` ignora completamente qualquer tentativa de alteração de *Posto* e *Unidade*. No frontend (`Perfil.tsx`), os campos estão visualmente desativados incondicionalmente para todos.
2. **Fallback Conservador de Privilégios:** O modelo de banco de dados (`schema.prisma`) e a rota de criação de usuários foram atualizados para atribuir `Operador` como permissão padrão caso a requisição falhe em explicitar o nível de acesso.
3. **Deleções Acidentais / Cascata Oculta:** O destrutivo efeito-colateral da rota `GET /api/transferencias` foi completamente removido. O sistema não exclui mais dados patrimoniais de forma automatizada e autônoma, garantindo que o histórico permaneça intacto.
4. **Vazamento Involuntário de JWT Secret:** Variáveis de ambiente configuradas na primeira linha de carregamento, e remoção de chaves falsas em middlewares, prevenindo que o sistema inicie "inseguro por padrão".
5. **Interceptação de E-mails Duplicados:** O Backend captura erros únicos do Prisma (`P2002`) em atualizações e criações, retornando `Status 400` amigável em vez de colapso genérico `500`.

---

## 4. Riscos Técnicos Pendentes (Engenharia)

A equipe técnica que assumir a manutenção deve planejar atuar nos seguintes vetores de código:

1. **Tokens JWT Expostos (LocalStorage):** Atualmente o Access Token reside em formato aberto no `localStorage` do navegador do usuário, vulnerável a XSS. Recomenda-se migrar para Cookies `HttpOnly / Secure`.
2. **Ausência de Revogação de Sessões:** Como a sessão é Stateless, um JWT ativo é válido por 24h. Um admin rebaixado para operador mantém poderes por algumas horas até o token expirar. Não existe um "Kill-Switch" de sessões (`tokenVersion`).
3. **Validação de Mass Assignment (VTR):** O módulo de Viatura (OS) propaga expansões diretas de payload (`...req.body`). Recomenda-se adotar imediatamente `Zod` ou `Joi` em todos os Controllers.
4. **Colisão de Numeração Sequencial:** Ordens de Serviço leem a última numeração e somam `+1`. Dois usuários clicando "Salvar" no exato mesmo milissegundo podem gerar OS com numerações repetidas.
5. **Auditoria Fragilizada:** A auditoria atual salva Strings (nomes amigáveis) e não força dependências duras na transação de banco. Um log de deleção não guarda o JSON/Snapshot do dado deletado, impossibilitando um rollback forense puro.
6. **Ausência de Testes Automatizados:** O repositório carece integralmente de scripts `Jest`, `Cypress` ou `Playwright`.

---

## 5. Decisões Estratégicas Dependentes da PMPA

Os pontos abaixo não são problemas de código, mas sim de **Política de Acesso Corporativo**. A DITEL precisará mapeá-los antes de exigir mudanças técnicas:

1. **Matriz de Permissões Oficial (RBAC):** Hoje o Operador consegue cadastrar e editar diversos patrimônios livremente. Se a política exigir que "Somente Administrador cria Equipamentos", os controladores precisam ser alterados.
2. **Isolamento de Visibilidade (Filtros Regionais):** A consulta patrimonial atual é Estadual. Qualquer operador vê a listagem de qualquer unidade. Para isolar o quartel X do quartel Y, é necessário plugar o ID da OPM na cláusula `WHERE` global de cada Rota GET.
3. **Políticas de Retenção de LOGs (LGPD):** É necessário definir por quanto tempo a tabela de Auditoria deve guardar informações.
4. **Validação e Fluxo do Rádio na Viatura:** O vínculo atual entre Rádio e VTR é temporal e flexível, exigindo definições institucionais se isso deve virar um bloqueio fixo no modelo relacional.

---

## 6. Critérios Obrigatórios Antes de Entrar em Produção

⚠️ **Atenção: Não coloque o ATHENAS no ar sem antes aplicar o Checklist:**

- [ ] **Bootstrap do Administrador Primário:** A rota de criação de usuários é protegida por `adminMiddleware`. Em um banco recém formatado/zerado, é impossível usar a UI. Será necessário que o DBA rode um *Seed Script* no servidor ou injete o primeiro usuário via interface de linha de comando.
- [ ] **Replica Set no MongoDB:** O Prisma necessita de Replica Sets para executar transações seguras (como o rollback de transferências). Se o MongoDB da PMPA for apenas Node Standalone, a aplicação irá crashear nas rotas de Cautelas/Devoluções.
- [ ] **Cofre de Segredos:** Retirar a senha do banco (`DATABASE_URL`) e `JWT_SECRET` de arquivos abertos `.env` e gerenciar via Docker Secrets ou AWS Secrets Manager.
- [ ] **Política de Backups a Quente:** Programar snapshots do Atlas, cronjobs de Dump diários e validá-los em ambiente de SandBox trimestralmente.
- [ ] **Pipeline CI/CD:** Instaurar Github Actions/Gitlab CI que rode Linting estrito e barragem de PRs contendo senhas vazadas.
