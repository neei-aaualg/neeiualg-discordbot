import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { buildSiteContainer, sendPanelMessage } from '../utils/panelBuilders.js';

export const data = new SlashCommandBuilder()
  .setName('site')
  .setDescription('Envia a mensagem em Container V2 sobre o Website Oficial do NEEI')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addChannelOption(option =>
    option
      .setName('canal')
      .setDescription('Canal onde enviar a mensagem do site (por omissão: canal atual)')
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      .setRequired(false)
  )
  .addStringOption(option =>
    option
      .setName('url')
      .setDescription('URL do website (por omissão: https://neeiualg.vercel.app/)')
      .setRequired(false)
  )
  .addStringOption(option =>
    option
      .setName('imagem')
      .setDescription('URL da imagem/banner para a descrição (opcional)')
      .setRequired(false)
  );

export async function execute(interaction) {
  const targetChannel = interaction.options.getChannel('canal') || interaction.channel;
  const siteUrl = interaction.options.getString('url') || 'https://neeiualg.vercel.app/';
  const imageUrl = interaction.options.getString('imagem');

  const container = buildSiteContainer(siteUrl, imageUrl);
  await sendPanelMessage(
    interaction,
    targetChannel,
    container,
    `✅ Mensagem do Website enviada com sucesso no canal ${targetChannel}!`
  );
}
