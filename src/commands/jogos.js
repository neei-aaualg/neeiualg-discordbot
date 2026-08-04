import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { buildPublicGamesContainer } from '../utils/gamesData.js';
import { sendPanelMessage } from '../utils/panelBuilders.js';

export const data = new SlashCommandBuilder()
  .setName('jogos')
  .setDescription('Envia a mensagem em Container V2 para seleção de cargos/canais de jogos')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addChannelOption(option =>
    option
      .setName('canal')
      .setDescription('Canal onde enviar a mensagem de jogos (por omissão: canal atual)')
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      .setRequired(false)
  );

export async function execute(interaction) {
  const targetChannel = interaction.options.getChannel('canal') || interaction.channel;
  const serverIcon = interaction.guild?.iconURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

  const container = buildPublicGamesContainer(serverIcon);
  await sendPanelMessage(
    interaction,
    targetChannel,
    container,
    `✅ Painel de jogos enviado com sucesso no canal ${targetChannel}!`
  );
}
