import { Client, Collection, Events, GatewayIntentBits, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import readline from 'readline';
import { data as painelAdminData, execute as painelAdminExecute } from './src/commands/painelAdmin.js';
import { data as verificacaoData, execute as verificacaoExecute } from './src/commands/verificacao.js';
import { data as limparDMData, execute as limparDMExecute } from './src/commands/limparDM.js';
import { data as siteData, execute as siteExecute } from './src/commands/site.js';
import { data as regrasData, execute as regrasExecute } from './src/commands/regras.js';
import { data as conviteData, execute as conviteExecute } from './src/commands/convite.js';
import { data as ultimateLeiData, execute as ultimateLeiExecute } from './src/commands/ultimateLei.js';
import { data as jogosData, execute as jogosExecute } from './src/commands/jogos.js';
import { data as ticketData, execute as ticketExecute } from './src/commands/ticket.js';
import { data as fecharData, execute as fecharExecute } from './src/commands/fechar.js';
import { data as menuData, execute as menuExecute } from './src/commands/menu.js';
import { handleInteraction } from './src/handlers/interactionHandler.js';
import { handleGuildMemberAdd } from './src/events/guildMemberAdd.js';
import { registerMessageLogsEvents } from './src/events/messageLogs.js';
import { registerActionLogsEvents } from './src/events/actionLogs.js';
import { registerVoiceLogsEvents } from './src/events/voiceLogs.js';
import { validateEnvVars } from './src/utils/envValidator.js';
import { prisma } from './src/database/prisma.js';

// Carrega as variáveis de ambiente do ficheiro .env
dotenv.config();
validateEnvVars();

const { DISCORD_TOKEN, CLIENT_ID } = process.env;

// Validação dos dados essenciais do .env
if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('\n❌ ERRO: Faltam variáveis de ambiente no ficheiro .env!');
  console.error('Certifica-te de que definiste DISCORD_TOKEN e CLIENT_ID.\n');
  process.exit(1);
}

// Inicializa o cliente do Discord com as intenções necessárias para os logs globais e auditoria
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// Coleção de comandos registados
client.commands = new Collection();

// Registo dos comandos de barra (Slash Commands)
client.commands.set(painelAdminData.name, {
  data: painelAdminData,
  execute: painelAdminExecute
});

client.commands.set(verificacaoData.name, {
  data: verificacaoData,
  execute: verificacaoExecute
});

client.commands.set(limparDMData.name, {
  data: limparDMData,
  execute: limparDMExecute
});

client.commands.set(siteData.name, {
  data: siteData,
  execute: siteExecute
});

client.commands.set(regrasData.name, {
  data: regrasData,
  execute: regrasExecute
});

client.commands.set(conviteData.name, {
  data: conviteData,
  execute: conviteExecute
});

client.commands.set(ultimateLeiData.name, {
  data: ultimateLeiData,
  execute: ultimateLeiExecute
});

client.commands.set(jogosData.name, {
  data: jogosData,
  execute: jogosExecute
});

client.commands.set(ticketData.name, {
  data: ticketData,
  execute: ticketExecute
});

client.commands.set(fecharData.name, {
  data: fecharData,
  execute: fecharExecute
});

client.commands.set(menuData.name, {
  data: menuData,
  execute: menuExecute
});

// Função para registar os Slash Commands na API do Discord
async function registerSlashCommands() {
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
  const commandsData = Array.from(client.commands.values()).map(cmd => cmd.data.toJSON());

  try {
    console.log(`🔄 A registar ${commandsData.length} Slash Commands na API do Discord...`);
    const route = process.env.GUILD_ID
      ? Routes.applicationGuildCommands(CLIENT_ID, process.env.GUILD_ID)
      : Routes.applicationCommands(CLIENT_ID);

    await rest.put(route, { body: commandsData });
    console.log(`✅ ${commandsData.length} Slash Commands registados com sucesso na API do Discord!`);
  } catch (error) {
    console.error('❌ Erro ao registar Slash Commands:', error);
  }
}

// Evento disparado quando o bot se conecta com sucesso ao Discord
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`\n🤖 Bot online como ${readyClient.user.tag}!`);
  try {
    await prisma.$connect();
    console.log(`📀 Ligação à Base de Dados PostgreSQL estabelecida com sucesso!`);
  } catch (dbError) {
    console.error(`❌ Erro ao ligar à Base de Dados PostgreSQL:`, dbError);
  }
  console.log(`💡 Dica: Escreve 'r' ou 'reload' nesta consola e prime Enter para dar reload nos comandos!\n`);
  await registerSlashCommands();
});

// Leitor de comandos na consola do IDE / Terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', async (line) => {
  const input = line.trim().toLowerCase();
  if (['r', 'reload', 'rs'].includes(input)) {
    console.log('\n🔄 Comando de reload recebido na consola!');
    await registerSlashCommands();
  }
});

// Gestão de Eventos para responder a interações (Slash Commands, Botões, Select Menus)
client.on(Events.InteractionCreate, async (interaction) => {
  await handleInteraction(interaction, client.commands);
});

// Evento automático disparado quando um novo membro entra no servidor
client.on(Events.GuildMemberAdd, async (member) => {
  await handleGuildMemberAdd(member);
});

// Registo do Sistema Global de Logs e Auditoria
registerMessageLogsEvents(client);
registerActionLogsEvents(client);
registerVoiceLogsEvents(client);

// Login do bot com o Token
client.login(DISCORD_TOKEN);
