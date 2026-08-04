import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ContainerBuilder, SectionBuilder, TextDisplayBuilder, ThumbnailBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('fechar')
  .setDescription('Encerra o ticket de suporte atual e gera o registo de atendimento');

export async function execute(interaction) {
  const channelName = interaction.channel?.name || '';
  const categoryId = process.env.TICKETS_CATEGORY_ID;
  const isTicketChannel = channelName.startsWith('ticket-') || (categoryId && interaction.channel?.parentId === categoryId.trim());

  if (!isTicketChannel) {
    await interaction.reply({
      content: '❌ Este comando apenas pode ser executado dentro de um canal de ticket de suporte.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const userAvatar = interaction.user.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

  const confirmSection = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# \`🔒\` Fechar e Eliminar Ticket\n` +
        `Tens a certeza que pretendes fechar e apagar permanentemente este canal de ticket?\n\n` +
        `-# \`⚠️\` Esta ação não pode ser desfeita.`
      )
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder().setURL(userAvatar)
    );

  const closeButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_confirm_close')
      .setLabel('Confirmar')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🗑️'),
    new ButtonBuilder()
      .setCustomId('ticket_cancel_close')
      .setLabel('Cancelar')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('❌')
  );

  const confirmContainer = new ContainerBuilder()
    .setAccentColor(0x24242A)
    .addSectionComponents(confirmSection)
    .addActionRowComponents(closeButtons);

  await interaction.reply({
    components: [confirmContainer],
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
  });
}
