import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { buildUltimateLeiContainer, sendPanelMessage } from '../utils/panelBuilders.js';

export const data = new SlashCommandBuilder()
  .setName('ultimate-lei')
  .setDescription('Envia a mensagem em Container V2 com o link do Ultimate LEI (Dropbox de material de estudo)')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addChannelOption(option =>
    option
      .setName('canal')
      .setDescription('Canal onde enviar a mensagem do Ultimate LEI (por omissão: canal atual)')
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      .setRequired(false)
  )
  .addStringOption(option =>
    option
      .setName('link')
      .setDescription('Link da Dropbox do Ultimate LEI (por omissão: usa o valor configurado no .env)')
      .setRequired(false)
  );

export async function execute(interaction) {
  const targetChannel = interaction.options.getChannel('canal') || interaction.channel;
  const ultimateUrl = interaction.options.getString('link') || process.env.ULTIMATE_LEI_URL || 'https://www.dropbox.com/';
  const serverIcon = interaction.guild?.iconURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

  const container = buildUltimateLeiContainer(ultimateUrl, serverIcon);
  await sendPanelMessage(
    interaction,
    targetChannel,
    container,
    `✅ Mensagem do Ultimate LEI enviada com sucesso no canal ${targetChannel}!`
  );
}
