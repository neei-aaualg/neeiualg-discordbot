import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { buildUltimateLeiContainer, sendPanelMessage } from '../utils/panelBuilders.js';

export const data = new SlashCommandBuilder()
  .setName('neei-box')
  .setDescription('Envia a mensagem em Container V2 com o link da NEEI-Box (material de estudo)')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addChannelOption(option =>
    option
      .setName('canal')
      .setDescription('Canal onde enviar a mensagem da NEEI-Box (por omissão: canal atual)')
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      .setRequired(false)
  )
  .addStringOption(option =>
    option
      .setName('link')
      .setDescription('Link da NEEI-Box (por omissão: https://box.neei.online/)')
      .setRequired(false)
  );

export async function execute(interaction) {
  const targetChannel = interaction.options.getChannel('canal') || interaction.channel;
  const boxUrl = interaction.options.getString('link') || process.env.NEEI_BOX_URL || process.env.ULTIMATE_LEI_URL || 'https://box.neei.online/';
  const serverIcon = interaction.guild?.iconURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

  const container = buildUltimateLeiContainer(boxUrl, serverIcon);
  await sendPanelMessage(
    interaction,
    targetChannel,
    container,
    `✅ Mensagem da NEEI-Box enviada com sucesso no canal ${targetChannel}!`
  );
}
