import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { buildConviteContainer, sendPanelMessage } from '../utils/panelBuilders.js';

export const data = new SlashCommandBuilder()
  .setName('convite')
  .setDescription('Envia a mensagem em Container V2 com o Link de Convite Oficial do Servidor')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addChannelOption(option =>
    option
      .setName('canal')
      .setDescription('Canal onde enviar a mensagem de convite (por omissão: canal atual)')
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      .setRequired(false)
  )
  .addStringOption(option =>
    option
      .setName('link')
      .setDescription('Link de convite do servidor (por omissão: usa o valor configurado no .env)')
      .setRequired(false)
  );

export async function execute(interaction) {
  const targetChannel = interaction.options.getChannel('canal') || interaction.channel;
  const inviteUrl = interaction.options.getString('link') || process.env.DISCORD_INVITE_URL || 'https://discord.gg/HzBuRFCAb5';
  const serverIcon = interaction.guild?.iconURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

  const container = buildConviteContainer(inviteUrl, serverIcon);
  await sendPanelMessage(
    interaction,
    targetChannel,
    container,
    `✅ Mensagem de convite enviada com sucesso no canal ${targetChannel}!`
  );
}
