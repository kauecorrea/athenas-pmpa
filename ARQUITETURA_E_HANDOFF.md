# Guia de Arquitetura e Handoff Técnico - ATHENAS

Este documento é destinado à equipe de **Engenharia de Software e TI da Polícia Militar do Pará (PMPA)**. Ele reflete o estado atual do código após revisão estática e verificações de compilação, delimitando claramente o que está protegido e o que precisa ser assumido como dívida técnica ou pauta gerencial pela corporação.

---

## 1. Stack Tecnológica Base

### 1.1. Frontend
* **Core:** React 19 via Vite. (Requer Node.js >=22.12.0 ou ^20.19.0).
* **Linguagem:** TypeScript (Strict Mode).
* **Estilização:** Tailwind CSS (Dark Mode nativo).
* **Comunicação:** `axios` com injeção automática de Token JWT via Interceptors. O Token fica alocado no `localStorage`.
* **Geração de Relatórios:** Totalmente Client-Side via `jspdf` e `jspdf-autotable`.

### 1.2. Backend
* **Core:** Node.js (Requer Node.js >=22.12.0 ou ^20.19.0) com Express.
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
4. **Vazamento Involuntário de JWT Secret:** Importação configurada rigorosamente no arquivo de entrada.
5. **Interceptação de E-mails Duplicados:** O Backend captura erros únicos do Prisma (`P2002`) nas rotas de Perfil (`/me`), Criação (`POST`) e Atualização (`PUT`), retornando padronizadamente o `Status 409 Conflict` de forma amigável e segura.
6. **Hardcoded Admin Password Removida:** Os scripts JavaScript legados foram excluídos, e o seed TypeScript (`seed.ts`) foi reescrito para exigir que as credenciais administrativas sejam providas via variáveis de ambiente globais (`ADMIN_LOGIN` e `ADMIN_PASSWORD`), blindando o repositório contra invasões óbvias.

---

## 4. Riscos Técnicos Pendentes (Engenharia)

A equipe técnica que assumir a manutenção deve planejar atuar nos seguintes vetores de código:

1. **Tokens JWT Expostos (LocalStorage):** Atualmente o Access Token reside em formato aberto no `localStorage` do navegador do usuário. Embora configurado em SPA, ele é vulnerável a XSS (Cross-Site Scripting). Recomenda-se migrar para Cookies `HttpOnly / Secure`.
2. **Ausência de Revogação de Sessões:** Como a sessão é Stateless, um JWT ativo é válido por 24h. Um admin rebaixado para operador mantém poderes por algumas horas até o token expirar. Não existe um "Kill-Switch" de sessões limitadas (como `tokenVersion`).
3. **Validação de Mass Assignment (VTR):** O módulo de Viatura (OS) propaga expansões diretas de payload (`...req.body`). O sistema permite envio de campos espúrios. Recomenda-se adotar imediatamente uma biblioteca de validação esquemática como `Zod` ou `Joi` em todos os Controllers.
4. **Colisão de Numeração Sequencial:** Ordens de Serviço leem a última numeração e somam `+1`. Duas chamadas simultâneas podem gerar OS com numerações repetidas. Necessita de contador atômico.
5. **Auditoria Sensível:** A auditoria salva dados, mas não é estritamente imutável (pode ser editada no MongoDB via terminal) nem atrelada duramente em transações multi-stage, impossibilitando rollbacks forenses automáticos (Event Sourcing puro).
6. **Ausência de Testes Automatizados:** O repositório carece integralmente de scripts `Jest`, `Cypress` ou `Playwright` para validar as regras de negócio de ponta a ponta, dependendo unicamente do compilador do TypeScript.
7. **Troca Obrigatória de Senha Inicial:** Atualmente, a senha injetada via Seed pode permanecer indefinidamente. Recomenda-se adicionar o booleano `deveTrocarSenha` no Prisma, forçando o Administrador a alterar sua credencial no primeiro login.

---

## 5. Decisões Estratégicas Dependentes da PMPA

Os pontos abaixo não são problemas de código, mas sim de **Política de Acesso Corporativo**. A corporação precisará mapeá-los antes de exigir mudanças técnicas:

1. **Matriz de Permissões Oficial (RBAC):** Hoje o Operador consegue cadastrar e editar diversos patrimônios livremente. É necessária uma documentação formal de autorização antes de reescrever as rotas de backend.
2. **Isolamento de Visibilidade (Filtros Regionais):** A consulta patrimonial atual é Estadual. Qualquer operador vê a listagem de qualquer unidade. Para isolar por batalhão, é necessário plugar o ID da OPM na cláusula `WHERE` global de cada Rota GET.
3. **Políticas de Retenção de LOGs (LGPD):** É necessário definir por quanto tempo a tabela de Auditoria deve guardar informações.
4. **Backup e Desastres (DRP):** É obrigatório estruturar uma política de Dumps MongoDB em repositório externo, testando scripts de reidratação de banco.

---

## 6. Critérios Obrigatórios Antes de Entrar em Produção

⚠️ **Atenção: Não coloque o ATHENAS no ar sem antes aplicar o Checklist:**

- [ ] **Bootstrap Seguro do Admin:** Ao rodar `npx prisma db seed`, injete no ambiente hospedeiro do servidor Node as variáveis `ADMIN_LOGIN` e `ADMIN_PASSWORD`. O sistema se recusará a subir o Seed caso elas não existam ou a senha contenha menos de 10 caracteres (Nota: o tamanho mínimo não garante força criptográfica, recomenda-se adicionar complexidade no futuro).
- [ ] **Replica Set no MongoDB:** As operações que dependem de transações falharão caso o Mongo rode em Standalone. Transações de Cautela e Transferências exibirão erro 500 sem persistência. Habilite Replica Sets no cluster.
- [ ] **Cofre Institucional de Segredos:** Retirar a senha do banco (`DATABASE_URL`) e `JWT_SECRET` de arquivos `.env` soltos e passar o gerenciamento para Docker Secrets, HashiCorp Vault ou equivalente homologado pela TI da PMPA.
- [ ] **Rede HTTPS/TLS Habilitada:** Proibido tráfego de senhas em HTTP puro.
- [ ] **CORS e Rate Limiting Restritos:** Especificar domínio da PMPA nas flags do CORS e afinar os limiters.

---

## 7. Guia de Resolução de Problemas e Inicialização (Troubleshooting)

### Inicializando do Zero (Ambiente Limpo)
1. Certifique-se de usar `Node 22 LTS` (Requisito rígido do Vite).
2. Na pasta `/backend`, crie o `.env` com a sua `DATABASE_URL` do ReplicaSet, e as chaves de bootstrap (`ADMIN_LOGIN` e `ADMIN_PASSWORD`).
3. Rode `npm install`, depois `npx prisma generate` e por fim `npx prisma db seed` para ejetar o primeiro Administrador oficial no banco.
4. Na pasta `/frontend`, instale as dependências via `npm install`, crie o `.env` especificando `VITE_API_URL` (para a API rodando na porta 3333) e execute `npm run dev`.

### Migração de Dados Legados (E-mail para Login Genérico)
Caso exista um banco MongoDB de versões anteriores cujos usuários possuem `email` mas não `login`, não rode a aplicação Node imediatamente. Execute os seguintes passos:
1. Realize o **Backup Completo** (Dump) do banco antes de iniciar.
2. Acesse o mongosh e execute a renomeação bruta do campo para não violar as restrições rígidas do Prisma: `db.Usuario.updateMany({}, { $rename: { "email": "login" } })`
3. Normalize os identificadores se necessário.
4. Rode `npx prisma db push` para que o Prisma sincronize os índices únicos (`@unique`) no banco de dados e delete o índice antigo de e-mail.

### Problema: "Frontend não conecta no Backend (Network Error)"
* **Causa:** O sistema foi levado para Produção e o `.env` do Frontend não foi injetado, tentando forçar `localhost`.
* **Solução:** Especifique `VITE_API_URL` com a rota oficial do servidor reverso NGINX.

### Rollback e Restauração de Banco
* **Solução:** Como o sistema é NoSQL, o Prisma não manipula `down migrations`. O Rollback se baseia primariamente na restauração do último Snapshot do MongoAtlas ou dump criptografado hospedado pela TI Institucional.
