import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js';
import { buildAdminPanelContainer, sendPanelMessage } from '../utils/panelBuilders.js';
import { logUnauthorizedAccess } from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('painel-admin')
  .setDescription('Envia o painel de controlo do Modo Administrador para um canal')
  .addChannelOption(option =>
    option
      .setName('canal')
      .setDescription('Canal onde enviar o painel de controlo (por omissão: canal atual)')
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      .setRequired(false)
  );

export async function execute(interaction) {
  const authorizedRoleId = process.env.AUTHORIZED_ROLE_ID;

  if (authorizedRoleId && interaction.inGuild()) {
    const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    const isAuthorized = member && (
      member.roles.cache.has(authorizedRoleId) ||
      member.permissions.has(PermissionFlagsBits.Administrator)
    );

    if (!isAuthorized) {
      logUnauthorizedAccess(interaction, 'Cargo Autorizado de Administração');
      await interaction.reply({
        content: '⛔ Não tens permissão (cargo autorizado) para utilizar este comando.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }
  }

  const targetChannel = interaction.options.getChannel('canal') || interaction.channel;
  const serverIcon = interaction.guild?.iconURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

  const container = buildAdminPanelContainer(serverIcon);
  await sendPanelMessage(
    interaction,
    targetChannel,
    container,
    `✅ Painel de controlo de modo administrador enviado com sucesso no canal ${targetChannel}!`
  );
}
