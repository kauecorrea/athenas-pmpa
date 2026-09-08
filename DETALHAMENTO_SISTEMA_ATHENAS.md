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

A navegação ocorre por um menu lateral esquerdo (Sidebar), acessível após o Login com E-mail (embora visualmente a tela possa dizer "E-mail/Matrícula", o sistema processa estritamente por e-mail) e Senha.

---

## 3. Módulos do Operador

### 3.1. Tela Inicial (Dashboard)
A tela de entrada do sistema. Oferece uma visão panorâmica e imediata do patrimônio da unidade através de:
* **Cards de Resumo:** Exibem números totais de Equipamentos Cadastrados, Quantos estão "Operacionais" (na base), Quantos estão "Cautelados" (na rua com a tropa), em "Manutenção", "Extraviados" e "Cautelas Vencidas".
* **Gráfico de Fluxo Semanal:** Mostra visualmente a quantidade de cautelas (saídas de rádio) emitidas nos últimos 7 dias.

### 3.2. Módulo de Cadastros Base
Antes de emitir uma Cautela, o sistema exige que os "atores" existam no banco de dados.
* **Unidades:** Tela para cadastrar as OPMs (Ex: 1º BPM, 2º BPM, Coint). Possui campos de Nome da Unidade e Sigla.
* **Militares:** Tela para cadastrar a tropa que irá levar os equipamentos para a rua. Exige o preenchimento de Nome Completo, Posto/Graduação (Soldado, Cabo, Sargento, etc.), RG, CPF, Contato e Unidade de Lotação.

### 3.3. Módulo de Patrimônio
Gerencia a inclusão e visualização de bens físicos da corporação.
* **Rádios:** Destinado exclusivamente a Rádios Transceptores (Portáteis/HT ou Móveis/Veiculares). O operador preenche campos padronizados: Número de Série, RP (Registro de Patrimônio), Modelo (ex: APX 2000), Marca e ID Virtual (Alias). O status padrão é `OPERACIONAL`.
* **Equipamentos:** Aba para equipamentos diversos (novo tipo `DIVERSO`). O operador preenche Número de Série, RP (Registro de Patrimônio), Marca, Modelo, Status, Garantia e Unidade. Também compartilha campos técnicos como Análise, Serviço e Laudo. Ambos os tipos (Rádio e Diverso) habitam o mesmo inventário global.
* **VTR (Viaturas):** Aba dedicada a ser um **controle de ordens de serviço em viaturas**, registrando os serviços e manutenções técnicas de radiocomunicação feitas nos veículos, contendo o Prefixo e Placa. Não é um cadastro permanente da viatura no banco de dados.

### 3.4. Módulo de Movimentação e Operação Legal
As funções mais importantes do dia a dia logístico da PMPA.

#### Cautelas (Empréstimo para a Tropa)
É a ação de entregar o rádio nas mãos de um militar para o serviço.
* **Como Funciona:** O operador seleciona um ou mais equipamentos (buscando por série ou modelo), seleciona o Militar que receberá o material e define uma "Data de Devolução" prevista.
* **Ciclo de Vida:** A cautela nasce com status `ATIVA`. Se o prazo de devolução estourar, o sistema automaticamente muda para `VENCIDA`. Quando o militar devolve o equipamento na sala de rádio, o operador clica em "Devolver", e o status muda para `DEVOLVIDA`.
* **Geração de PDF (Termo de Responsabilidade):** Após criar a cautela, o operador possui um botão de "Imprimir". O sistema gera um documento oficial da PMPA, em PDF, listando tudo que o militar pegou. Esse termo é assinado fisicamente ou digitalmente pelo militar, assumindo a responsabilidade financeira e penal pelos itens.

#### Transferências (Movimentação entre Bases)
* **Como Funciona:** Usado quando um lote de rádios/equipamentos é transferido definitivamente de uma unidade para outra. O operador seleciona os equipamentos (A Unidade de Origem é inferida e bloqueada automaticamente com base no primeiro equipamento selecionado), informa a OPM de Destino e um documento de referência (Ex: número do memorando).

### 3.5. Módulo de Baixas (Danos e Perdas)

#### Manutenção (Oficina)
Usado quando um equipamento quebra, apresenta falha na bateria ou erro de software.
* **Fluxo:** O operador retira o equipamento do status "Operacional" e joga na aba de Manutenção.
* **Dados:** O operador preenche os campos `Solicitante`, `PAE`, as datas do fluxo, o `Problema` relatado, a `Análise` técnica, o `Laudo` e o `Técnico Responsável`.
* **Retorno:** Quando consertado, o operador dá baixa na manutenção e o rádio volta ao status "Operacional".

#### Extraviados (Furto, Roubo ou Perda)
Usado nos piores cenários, quando o rádio "desaparece". É uma ferramenta de extrema importância legal.
* **Fluxo:** O operador lança o equipamento como extraviado. O equipamento muda de status.
* **Dados Registrados:** Podem ser registrados o Boletim de Ocorrência (Número do B.O), a Data do Ocorrido, uma descrição detalhada do fato e, de preferência, qual foi o "Militar Responsável" (quem perdeu o equipamento). Alguns desses dados são opcionais para o fechamento do registro.
* **Fim do Ciclo:** Um extravio pode ser finalizado de duas formas: como `Recuperado` (o equipamento volta a ficar `OPERACIONAL` no inventário) ou como `Baixado` (se decreta a perda permanente).

---

## 4. Dinâmica Geral de Interação (Telas)
Para todos os cadastros acima, o fluxo do operador é similar:
1. **Listagem Inicial:** Ao abrir a aba (Ex: Rádios), ele vê cartões ou tabelas resumidas dos registros existentes.
2. **Consultar Registros:** Um botão/modal para visualizar todos os itens em uma grande tabela. Tabelas sempre possuem filtros de busca (Ex: Buscar por número de série ou nome do militar).
3. **Botão de Cadastrar/Novo:** Abre um formulário moderno flutuante no meio da tela pedindo os dados necessários.
4. **Edição e Exclusão:** Ícones de Lápis (Editar) e Lixeira (Excluir) acompanham os registros. *(Aviso ao redator: O botão de Exclusão pode aparecer visualmente para o Operador em algumas tabelas, mas o sistema possui uma trava técnica no servidor que exige permissão de Administrador para confirmar a exclusão. Portanto, exclusões reais são papel exclusivo da Administração e devem ficar de fora das instruções operacionais)*.

---

## 5. Avisos Técnicos de Isolamento
No estado atual, as listagens do sistema (Tabelas) não efetuam o isolamento regional rígido. Ou seja, ao abrir a tabela, o sistema exibe os equipamentos globais da PMPA, e não restritos apenas à OPM logada. Isso permite uma gestão logística mais centralizada.

---
**FIM DO DOCUMENTO BASE**
