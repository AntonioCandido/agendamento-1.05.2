Este é um aplicativo de agendamento que permite a candidatos marcarem horários com atendentes. Atendentes gerenciam sua própria disponibilidade 
e atendimentos, enquanto administradores supervisionam os atendentes e acessam um histórico geral.


## Como executar localmente

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`


Prof. Antonio Candido
====================================================================================================

**Prerequisites: Node.js**
O que significa: "Prerequisites" são os pré-requisitos ou o que você precisa ter instalado no seu computador ANTES de tentar rodar o projeto.

**Node.js:** É um ambiente de execução JavaScript que permite que você execute código JavaScript fora do navegador (diretamente no seu computador). Muitos projetos web modernos (especialmente aqueles feitos com React, Angular, Vue, Next.js, etc.) são construídos usando Node.js, e ele também vem com o npm (Node Package Manager), que é uma ferramenta para instalar e gerenciar as bibliotecas e dependências do projeto.

**Em resumo:** Você precisa ter o Node.js instalado para que o resto das instruções funcione, pois ele fornece o ambiente e as ferramentas necessárias.

**Install dependencies:** npm install
O que significa: "Dependencies" são as dependências, ou seja, todas as bibliotecas, pacotes e módulos de código que o seu projeto utiliza para funcionar. Quase nenhum projeto moderno é feito do zero; ele sempre usa partes de código que outros desenvolvedores já criaram.

**npm install:** Este é um comando que você executa no terminal (ou prompt de comando) dentro da pasta do seu projeto. Ele lê um arquivo chamado package.json (que lista todas as dependências que o projeto precisa) e baixa todas essas dependências para uma pasta chamada node_modules dentro do seu projeto.

**Em resumo:** Este comando "prepara" o seu projeto, baixando e configurando todos os componentes externos que ele precisa para rodar. Você só precisa fazer isso uma vez por projeto ou quando alguma dependência for adicionada ou atualizada.

**Run the app:** npm run dev
**O que significa:** "Run the app" significa rodar a aplicação, ou seja, iniciar o servidor de desenvolvimento para que você possa ver e interagir com o seu projeto no navegador.

**npm run dev:** Este é outro comando que você executa no terminal. Ele não é um comando padrão do npm como install, mas sim um "script" personalizado definido no arquivo package.json do projeto. Geralmente, o script dev é configurado para iniciar um servidor de desenvolvimento que:

Compila seu código (se for TypeScript ou JSX).

Inicia a aplicação localmente (ex: em http://localhost:3000).

Recarrega automaticamente o navegador quando você faz alterações no código (Hot Module Reloading - HMR), facilitando o desenvolvimento.

**Em resumo:** Depois de instalar as dependências, este comando liga o seu projeto, permitindo que você o veja funcionando no seu navegador enquanto desenvolve.
