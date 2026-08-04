import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { buildRegrasContainer, sendPanelMessage } from '../utils/panelBuilders.js';

export const data = new SlashCommandBuilder()
  .setName('regras')
  .setDescription('Envia a mensagem em Container V2 com as Regras Oficiais do Servidor')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addChannelOption(option =>
    option
      .setName('canal')
      .setDescription('Canal onde enviar a mensagem de regras (por omissão: canal atual)')
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      .setRequired(false)
  );

export async function execute(interaction) {
  const targetChannel = interaction.options.getChannel('canal') || interaction.channel;
  const serverIcon = interaction.guild?.iconURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

  const container = buildRegrasContainer(serverIcon);
  await sendPanelMessage(
    interaction,
    targetChannel,
    container,
    `✅ Mensagem de regras enviada com sucesso no canal ${targetChannel}!`
  );
}
