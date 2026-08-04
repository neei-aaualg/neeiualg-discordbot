import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { data as painelAdminData } from './src/commands/painelAdmin.js';
import { data as verificacaoData } from './src/commands/verificacao.js';
import { data as limparDMData } from './src/commands/limparDM.js';
import { data as siteData } from './src/commands/site.js';
import { data as regrasData } from './src/commands/regras.js';
import { data as conviteData } from './src/commands/convite.js';
import { data as ultimateLeiData } from './src/commands/ultimateLei.js';
import { data as jogosData } from './src/commands/jogos.js';
import { data as ticketData } from './src/commands/ticket.js';
import { data as fecharData } from './src/commands/fechar.js';
import { data as menuData } from './src/commands/menu.js';

dotenv.config();

const { DISCORD_TOKEN, CLIENT_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('\n❌ ERRO: Faltam variáveis de ambiente no .env (DISCORD_TOKEN, CLIENT_ID)\n');
  process.exit(1);
}

const commands = [
  painelAdminData.toJSON(),
  verificacaoData.toJSON(),
  limparDMData.toJSON(),
  siteData.toJSON(),
  regrasData.toJSON(),
  conviteData.toJSON(),
  ultimateLeiData.toJSON(),
  jogosData.toJSON(),
  ticketData.toJSON(),
  fecharData.toJSON(),
  menuData.toJSON()
];

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

console.log(`\n🔄 A enviar/recarregar ${commands.length} Slash Commands para a API do Discord...`);

try {
  const route = process.env.GUILD_ID
    ? Routes.applicationGuildCommands(CLIENT_ID, process.env.GUILD_ID)
    : Routes.applicationCommands(CLIENT_ID);

  await rest.put(route, { body: commands });
  console.log(`✅ ${commands.length} Slash Commands registados e recarregados com sucesso na API do Discord!\n`);
} catch (error) {
  console.error('❌ Erro ao registar comandos:', error);
}
