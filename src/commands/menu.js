import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { buildTicketStaffResponseEphemeralContainer } from '../handlers/interactionHandler.js';

export const data = new SlashCommandBuilder()
  .setName('menu')
  .setDescription('Exibe o menu de controlo da staff para gestão de tickets');

export async function execute(interaction) {
  const supportRoleId = process.env.TICKETS_SUPPORT_ROLE_ID;
  const member = interaction.member;

  const isStaff = (supportRoleId && supportRoleId.trim() && member?.roles?.cache?.has(supportRoleId.trim())) ||
                  member?.permissions?.has(PermissionFlagsBits.Administrator);

  if (!isStaff) {
    await interaction.reply({
      content: '⛔ Apenas membros da equipa de suporte podem aceder ao menu da staff.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const container = buildTicketStaffResponseEphemeralContainer(interaction.user);

  await interaction.reply({
    components: [container],
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
  });
}
