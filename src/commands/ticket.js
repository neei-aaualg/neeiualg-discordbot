import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { buildTicketPanelContainer, sendPanelMessage } from '../utils/panelBuilders.js';

export const data = new SlashCommandBuilder()
  .setName('ticket')
  .setDescription('Envia o painel do sistema de tickets para um canal')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addChannelOption(option =>
    option
      .setName('canal')
      .setDescription('Canal onde enviar o painel de tickets (por omissão: canal atual)')
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      .setRequired(false)
  );

export async function execute(interaction) {
  const targetChannel = interaction.options.getChannel('canal') || interaction.channel;
  const serverIcon = interaction.guild?.iconURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

  const container = buildTicketPanelContainer(serverIcon);
  await sendPanelMessage(
    interaction,
    targetChannel,
    container,
    `✅ Painel do sistema de tickets enviado com sucesso no canal ${targetChannel}!`
  );
}
