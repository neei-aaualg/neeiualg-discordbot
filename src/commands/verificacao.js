import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { buildVerificacaoPanelContainer, sendPanelMessage } from '../utils/panelBuilders.js';

export const data = new SlashCommandBuilder()
  .setName('verificacao')
  .setDescription('Envia o painel de verificação de membros para um canal')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addChannelOption(option =>
    option
      .setName('canal')
      .setDescription('Canal onde enviar o painel de verificação (por omissão: canal atual)')
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      .setRequired(false)
  );

export async function execute(interaction) {
  const targetChannel = interaction.options.getChannel('canal') || interaction.channel;
  const botAvatar = interaction.client.user.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

  const container = buildVerificacaoPanelContainer(botAvatar);
  await sendPanelMessage(
    interaction,
    targetChannel,
    container,
    `✅ Painel de verificação enviado com sucesso no canal ${targetChannel}!`
  );
}
