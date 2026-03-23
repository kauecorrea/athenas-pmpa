# Sistema de Controle Patrimonial PMPA

Este projeto foi inicializado utilizando React com Vite e TailwindCSS (Frontend) e Express com Prisma ORM (Backend).

## Como Executar e Testar

### 1. Iniciar o Frontend (Interface Visual)
Abra uma janela do terminal (PowerShell ou CMD), e execute:
```bash
cd C:\Users\kaueh\Documents\Athenas\frontend
npm run dev
```
O Vite iniciará o servidor, geralmente na porta `http://localhost:5173`. Clique no link no terminal para visualizar o Sistema no seu navegador. As telas principais já possuem *mock data* (dados falsos) para que você possa visualizar e navegar sem precisar rodar o MySQL agora!

### 2. Iniciar o Backend (API e MySQL)
Para o backend, você precisará ter o MySQL rodando na sua máquina.
1. Verifique as credenciais no arquivo `backend/.env`. O padrão é `root` sem senha na porta 3306.
2. Em um novo terminal, execute:
```bash
cd C:\Users\kaueh\Documents\Athenas\backend
npx prisma db push
npm run dev
```
O Prisma criará as tabelas do Sistema na sua base de dados MySQL.

### Próximos Passos
Verifique o layout e navegue pelas abas "Dashboard", "Equipamentos" e "Cautelas". Me avise se as cores, funcionalidades e a experiência estão de acordo com o que você espera para a corporação!
