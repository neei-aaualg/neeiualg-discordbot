# 🤖 NEEI Discord Bot

Bot oficial do **NEEI (Núcleo de Estudantes de Engenharia Informática da Universidade do Algarve)** desenvolvido em **Node.js** com a biblioteca **discord.js (v14)** e **ES Modules (`import`/`export`)**, tirando partido do sistema de **Components V2** do Discord.

---

## 🚀 Guia de Instalação e Inicialização

### 1. Pré-requisitos
- **Node.js**: Versão **18.0.0** ou superior.
- Aplicação de bot criada no [Discord Developer Portal](https://discord.com/developers/applications).
- **Intenções Privilegiadas (Gateway Intents) Ativas**:
  - No Developer Portal > Seleciona a Aplicação > Secção **Bot**:
    - ✅ **SERVER MEMBERS INTENT** (necessária para detetar a entrada de novos membros e alterações de cargos).
    - ✅ **MESSAGE CONTENT INTENT** (necessária para ler o conteúdo de mensagens nos registos de auditoria).

---

### 2. Passo a Passo da Instalação

#### 1. Clonar o Repositório e Instalar Dependências
```bash
# Entra na pasta do projeto
cd NEEI-DiscordBot

# Instala as dependências do Node.js
npm install
```

#### 2. Configurar as Variáveis de Ambiente
Cria o ficheiro `.env` com base no ficheiro de exemplo `.env.example`:
```bash
cp .env.example .env
```

Preenche os teus tokens e identificadores (IDs) no ficheiro `.env`:
```env
# 🔑 CONFIGURAÇÕES GERAIS DO BOT
DISCORD_TOKEN=
CLIENT_ID=
GUILD_ID=

# 🛡️ ADMINISTRAÇÃO E PERMISSÕES
ADMIN_ROLE_ID=
AUTHORIZED_ROLE_ID=
VERIFIED_ROLE_ID=

# 🔰 VERIFICAÇÃO E BOAS-VINDAS
VERIFICATION_LOGS_CHANNEL_ID=
WELCOME_CHANNEL_ID=
PUBLIC_WELCOME_CHANNEL_ID=

# 🎫 SISTEMA DE TICKETS
TICKETS_CATEGORY_ID=
TICKETS_LOGS_CHANNEL_ID=
TICKETS_TRANSCRIPTS_CHANNEL_ID=
TICKETS_SUPPORT_ROLE_ID=

# 📋 SISTEMA GLOBAL DE LOGS E AUDITORIA
MESSAGES_LOGS_CHANNEL_ID=
INTERACTIONS_LOGS_CHANNEL_ID=
ACTIONS_LOGS_CHANNEL_ID=
VOICE_LOGS_CHANNEL_ID=

# 🎮 CANAL DE SUGESTÕES DE JOGOS
GAME_SUGGESTIONS_CHANNEL_ID=
```

#### 3. Registar os Comandos de Barra (Slash Commands)
```bash
npm run deploy
```

#### 4. Iniciar o Bot
```bash
# Em modo de desenvolvimento (com reinício automático):
npm run dev

# Em modo de produção:
npm run start
```

---

## ✨ Funcionalidades do Bot

### 1. 🔰 Sistema de Verificação de Alunos & Seleção de Unidades Curriculares
- **Formulário Interativo (`ModalBuilder`)**: Recolha e validação de Nome, Apelido e Número de Aluno.
- **Atribuição Automática de Cargos**: Atribui o cargo do curso (**LEI**, **PSC**, **MEI** ou **Outro**) e o cargo de `Verificado`.
- **Seleção de Cadeiras por Ano e Semestre**: Botões e menus de seleção para atribuição de cargos das disciplinas sem duplicados.
- **Atualização da Alcunha**: Alteração automática do nome no servidor para `Nome Apelido`.
- **Registo de Verificação**: Envio de relatório em Container V2 para o canal da administração.

---

### 2. 🎫 Sistema de Tickets de Suporte em HTML
- **Abertura de Tickets**: Criação de canais privados por categoria de curso ou assunto.
- **Painel de Gestão da Equipa de Suporte**:
  - Iniciar atendimento.
  - Alterar o nome do canal do ticket.
  - Adicionar ou remover membros do ticket.
  - Transferir o ticket para outra equipa.
  - Encerrar o ticket com confirmação.
- **Transcrições Visuais em HTML (`discord-html-transcripts`)**:
  - Geração de ficheiros `.html` estáticos que replicam a interface do Discord (avatares, anexos e carimbos de data/hora).
  - Envio automático do ficheiro `.html` para o canal de transcrições (`TICKETS_TRANSCRIPTS_CHANNEL_ID`).
- **Notificações em Container V2**:
  - **Canal de Registos da Equipa**: Registo com menção dinâmica do canal `<#channelId>`, autor, membro responsável e ligação direta `[Descarregar Cópia](URL)`.
  - **Mensagem Privada (DM)**: Envio ao criador do ticket com a ligação para descarregar a cópia `.html` e formulário de **Avaliação do Atendimento (1 a 5 Estrelas)**.
  - **Tratamento de Mensagens Bloqueadas**: Registo no canal de logs caso o membro tenha as mensagens privadas desativadas, evitando falhas na execução do bot.

---

### 3. 📋 Sistema Global de Registos e Auditoria (Components V2)
Auditoria em tempo real isolada no módulo `src/utils/logger.js` com tratamento de exceções:
- 💬 **`#logs-mensagens` (`MESSAGES_LOGS_CHANNEL_ID`)**:
  - Mensagens editadas (comparação entre o texto anterior e o novo).
  - Eliminação individual de mensagens (com lista de anexos existentes).
  - Eliminação de mensagens em massa (purge).
  - Alterações nas mensagens afixadas.
- 🤖 **`#logs-interações` (`INTERACTIONS_LOGS_CHANNEL_ID`)**:
  - Execução de comandos de barra, botões, menus de seleção e formulários.
  - Registo de tentativas de acesso negado por falta de cargos ou permissões.
- ⚙️ **`#logs-ações` (`ACTIONS_LOGS_CHANNEL_ID`)**:
  - Criação, edição de permissões/nome ou remoção de Canais, Categorias e Threads.
  - Criação, alteração e remoção de Cargos.
  - Ações em membros: alterações de alcunha, atribuição ou remoção de cargos, silenciamentos (timeouts), expulsões e banimentos.
- 🔊 **`#logs-voice` (`VOICE_LOGS_CHANNEL_ID`)**:
  - Entradas, saídas, trocas de canal de voz, silenciamentos de moderação e transmissões de ecrã.

---

### 4. 👋 Entrada de Membros & Boas-Vindas
- **Registo Interno**: Cartão no canal interno de acompanhamento com estado dinâmico (`🔴 Verificação Pendente` ➔ `🟢 Verificado`).
- **Boas-Vindas Públicas**: Cartão enviado no canal público com a mensagem *"O Curso Não Se Faz Sozinho"* e botões de acesso às redes sociais do NEEI (Facebook, Instagram, GitHub, LinkedIn).

---

### 5. 🎮 Painel Interativo de Jogos (`/jogos`)
- Gestão de cargos de jogos (LoL, CS2, Valorant, Minecraft, Rocket League, Among Us, EA FC, GTA, R6, Fortnite, Outros).
- Atribuição automática do cargo geral `Gamers`.
- Painel privado efémero com botões interativos (`🟢` / `⚪`).
- Formulário para sugestão de novos jogos com encaminhamento para a moderação.

---

### 6. 📌 Painéis Informativos e Utilitários
- `/verificacao`: Apresenta o painel oficial para os membros iniciarem a verificação.
- `/painel-admin`: Painel de controlo restrito com atalho para a gestão do modo administrador.
- `/regras`: Exibe as regras oficiais do servidor.
- `/site`: Apresenta o painel do Website Oficial do NEEI.
- `/convite`: Apresenta o convite permanente do servidor com botão para copiar a ligação.
- `/ultimate-lei`: Acesso ao repositório no Dropbox com material de estudo, sebentas e exames de anos anteriores.
- `/limpar-dm`: Elimina as mensagens privadas enviadas pelo bot ao membro.
- `/fechar`: Encerra o ticket de suporte atual e gera a transcrição em HTML.

---

## 🛠️ Tabela de Comandos de Barra

| Comando | Descrição | Permissões |
| :--- | :--- | :--- |
| `/verificacao` | Envia o painel de verificação inicial em Container V2. | Administrador |
| `/ticket` | Envia o painel de abertura de tickets de suporte. | Administrador |
| `/painel-admin` | Envia o painel de controlo administrativo. | Autorizado / Admin |
| `/fechar` | Encerra o ticket de suporte atual e gera a transcrição em HTML. | Membro / Staff |
| `/jogos` | Abre o painel privado de seleção de cargos de jogos. | Todos |
| `/regras` | Envia o painel com as regras oficiais do servidor. | Todos |
| `/site` | Envia o painel com a ligação para o Website Oficial do NEEI. | Todos |
| `/convite` | Envia o painel com o convite permanente do servidor. | Todos |
| `/ultimate-lei` | Envia o painel do repositório no Dropbox com materiais de estudo. | Todos |
| `/limpar-dm` | Elimina as mensagens privadas enviadas pelo bot na DM do membro. | Todos |

---

## 📁 Estrutura do Projeto

```
NEEI-DiscordBot/
├── .env                      # Ficheiro de variáveis de ambiente e IDs
├── .env.example              # Modelo de variáveis de ambiente
├── .gitignore                # Ficheiros ignorados pelo Git
├── deploy-commands.js        # Script de registo dos comandos de barra no Discord
├── dicionario_consola.md     # Catálogo de códigos de aviso e erros da consola
├── index.js                  # Ponto de entrada do bot e inicialização de eventos
├── package.json              # Dependências e scripts do Node.js
└── src/
    ├── commands/             # Módulos dos Comandos de Barra
    │   ├── convite.js
    │   ├── fechar.js
    │   ├── jogos.js
    │   ├── limparDM.js
    │   ├── menu.js
    │   ├── painelAdmin.js
    │   ├── regras.js
    │   ├── site.js
    │   ├── ticket.js
    │   ├── ultimateLei.js
    │   └── verificacao.js
    ├── events/               # Listeners de Eventos do Discord
    │   ├── actionLogs.js     # Registos de Canais, Cargos e Membros
    │   ├── guildMemberAdd.js # Evento de entrada de novos membros
    │   ├── messageLogs.js    # Registos de Mensagens e Purges
    │   └── voiceLogs.js      # Registos de Canais de Voz
    ├── handlers/
    │   └── interactionHandler.js # Gestor central de botões, formulários e tickets
    └── utils/
        ├── courseSubjects.js # Dados dos cursos, disciplinas e atribuição de cargos
        ├── envValidator.js   # Validador das variáveis do ficheiro .env
        ├── gamesData.js      # Configuração e painel efémero de jogos
        ├── logger.js         # Módulo central de auditoria em Containers V2
        ├── panelBuilders.js  # Construtores dos painéis informativos
        ├── transcriptHelper.js # Gerador de transcrições visuais em HTML
        └── welcomeCard.js    # Construtor dos cartões de boas-vindas
```
