# Documentação Base do Sistema ATHENAS - Perfil Operador

> **Nota para IAs e Redatores:** Este documento contém o detalhamento técnico e operacional completo do Sistema ATHENAS, focado estritamente nas permissões do perfil "Operador". Funções exclusivas de "Administradores" (como criação de contas e painel de auditoria) foram intencionalmente omitidas. Utilize este documento como base/contexto absoluto para gerar manuais de usuário, guias de treinamento e PDFs corporativos.

---

## 1. Informações Institucionais e Técnicas

* **Nome do Sistema:** ATHENAS - Sistema de Gestão Patrimonial e Logística
* **Instituição:** Polícia Militar do Pará (PMPA)
* **Data de Lançamento:** Setembro de 2026 *(ou atualizar para data exata)*
* **Desenvolvedor:** Voluntário Civil Kauê Henrique Corrêa Palheta
* **Coordenador do Projeto:** SUB TENENTE Mendes
* **Tecnologias Utilizadas:** 
  * Frontend: React 19, TypeScript, Tailwind CSS, Vite, Lucide Icons, Recharts, jsPDF (para laudos).
  * Backend: Node.js, Express, Prisma ORM.
  * Banco de Dados: MongoDB.
  * Segurança: Criptografia JWT e Bcrypt.

---

## 2. Visão Geral do Sistema

O ATHENAS foi desenvolvido para substituir planilhas manuais na gestão de telecomunicações e logística da PMPA. Ele permite que o operador tenha controle total sobre o ciclo de vida dos equipamentos de rádio (HT e Móvel), do momento em que chegam à unidade até a sua eventual quebra, extravio ou acautelamento nas mãos da tropa.

A navegação ocorre por um menu lateral esquerdo (Sidebar), acessível após o Login com E-mail/Matrícula e Senha.

---

## 3. Módulos do Operador

### 3.1. Tela Inicial (Dashboard)
A tela de entrada do sistema. Oferece uma visão panorâmica e imediata do patrimônio da unidade através de:
* **Cards de Resumo:** Exibem números totais de Equipamentos Cadastrados, Quantos estão "Operacionais" (na base), Quantos estão "Cautelados" (na rua com a tropa), em "Manutenção", "Extraviados" e "Cautelas Vencidas".
* **Gráfico de Fluxo Semanal:** Mostra visualmente a quantidade de cautelas (saídas de rádio) emitidas nos últimos 7 dias.

### 3.2. Módulo de Cadastros Base
Antes de emitir uma Cautela, o sistema exige que os "atores" existam no banco de dados.
* **Unidades:** Tela para cadastrar as OPMs (Ex: 1º BPM, 2º BPM, Coint). Possui campos de Nome da Unidade e Sigla.
* **Militares:** Tela para cadastrar a tropa que irá levar os equipamentos para a rua. Exige o preenchimento do Nome Completo, Nome de Guerra, Posto/Graduação (Soldado, Cabo, Sargento, etc.), RG e Unidade de Lotação.

### 3.3. Módulo de Patrimônio
Gerencia a inclusão e visualização de bens físicos da corporação.
* **Rádios:** Destinado exclusivamente a Rádios Transceptores (Portáteis/HT ou Móveis/Veiculares). O operador preenche campos padronizados: Número de Série, RP (Registro de Patrimônio), Modelo (ex: APX 2000), Marca, Data de Aquisição, ID Virtual (Alias) e se o rádio possui GPS.
* **Equipamentos:** Aba genérica para periféricos de telecomunicação, como Carregadores, Fontes de Alimentação, Antenas e Estações Base. Diferente da aba de rádios, a Marca e o Modelo são digitados livremente pelo operador.
* **VTR (Viaturas):** Aba dedicada para atrelar rádios do tipo "Móvel" a uma viatura da frota. O operador cadastra a Placa e o Prefixo do veículo e seleciona no sistema qual Rádio Móvel foi instalado nela.

### 3.4. Módulo de Movimentação e Operação Legal
As funções mais importantes do dia a dia logístico da PMPA.

#### Cautelas (Empréstimo para a Tropa)
É a ação de entregar o rádio nas mãos de um militar para o serviço.
* **Como Funciona:** O operador seleciona um ou mais equipamentos (buscando por série ou modelo), seleciona o Militar que receberá o material e define uma "Data de Devolução" prevista.
* **Ciclo de Vida:** A cautela nasce com status `ATIVA`. Se o prazo de devolução estourar, o sistema automaticamente muda para `VENCIDA`. Quando o militar devolve o equipamento na sala de rádio, o operador clica em "Devolver", e o status muda para `DEVOLVIDA`.
* **Geração de PDF (Termo de Responsabilidade):** Após criar a cautela, o operador possui um botão de "Imprimir". O sistema gera um documento oficial da PMPA, em PDF, listando tudo que o militar pegou. Esse termo é assinado fisicamente ou digitalmente pelo militar, assumindo a responsabilidade financeira e penal pelos itens.

#### Transferências (Movimentação entre Bases)
* **Como Funciona:** Usado quando um lote de rádios é transferido definitivamente da Unidade "A" para a Unidade "B". O operador seleciona os equipamentos, informa a OPM de Origem, a OPM de Destino e um documento de referência (Ex: número do memorando).

### 3.5. Módulo de Baixas (Danos e Perdas)

#### Manutenção (Oficina)
Usado quando um equipamento quebra, apresenta falha na bateria ou erro de software.
* **Fluxo:** O operador retira o equipamento do status "Operacional" e joga na aba de Manutenção.
* **Dados:** O operador preenche o defeito relatado. Se o equipamento for enviado para uma empresa terceirizada, ele registra a "Empresa/Oficina", o "Número da O.S (Ordem de Serviço)" e o "Valor do Orçamento".
* **Retorno:** Quando consertado, o operador dá baixa na manutenção e o rádio volta ao cofre "Operacional". O sistema guarda o laudo técnico do conserto no histórico.

#### Extraviados (Furto, Roubo ou Perda)
Usado nos piores cenários, quando o rádio "desaparece". É uma ferramenta de extrema importância legal.
* **Fluxo:** O operador lança o equipamento como extraviado. O rádio sai do inventário ativo e fica eternamente isolado na aba de Extravios.
* **Dados Exigidos:** O sistema cobra o registro do Boletim de Ocorrência (Número do B.O), a Data do Ocorrido, uma descrição detalhada do fato e, crucialmente, qual foi o "Militar Responsável" (quem perdeu o equipamento).
* **Inquérito:** Fica registrado também o número do Inquérito Policial Militar (IPM) ou sindicância aberta para apurar o caso. O status do extravio pode ser "Em Apuração" ou "Concluído" (caso o militar tenha pago o valor do bem, por exemplo).

---

## 4. Dinâmica Geral de Interação (Telas)
Para todos os cadastros acima, o fluxo do operador é similar:
1. **Listagem Inicial:** Ao abrir a aba (Ex: Rádios), ele vê cartões ou tabelas resumidas dos registros existentes.
2. **Consultar Registros:** Um botão/modal para visualizar todos os itens em uma grande tabela. Tabelas sempre possuem filtros de busca (Ex: Buscar por número de série ou nome do militar).
3. **Botão de Cadastrar/Novo:** Abre um formulário moderno flutuante no meio da tela pedindo os dados necessários.
4. **Edição e Exclusão:** Ícones de Lápis (Editar) e Lixeira (Excluir) acompanham os registros. *(Aviso ao redator: a exclusão pode ser bloqueada caso o rádio já esteja cautelado)*.

---
**FIM DO DOCUMENTO BASE**
