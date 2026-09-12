import {
  ContainerBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  ThumbnailBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  MessageFlags
} from 'discord.js';

import { getCourseName } from './courseSubjects.js';

// Mapeia o registo das mensagens de entrada por userId -> { channelId, messageId, joinedTimestamp }
export const welcomeMessageMap = new Map();

/**
 * Constrói a mensagem de registo de entrada interno em formato Container V2 compacto,
 * exibindo o estado de verificação (Pendente vs Verificado).
 * @param {import('discord.js').GuildMember|object} member - O membro do servidor que entrou.
 * @param {boolean} isVerified - Se o membro já concluiu a verificação.
 * @param {object|null} sessionData - Os dados registados durante a verificação (Nome, Nº Aluno, Curso).
 * @returns {ContainerBuilder}
 */
export function buildWelcomeContainer(member, isVerified = false, sessionData = null) {
  const userAvatar = member.user?.displayAvatarURL
    ? member.user.displayAvatarURL({ extension: 'png', size: 256 })
    : 'https://cdn.discordapp.com/embed/avatars/0.png';
  const serverName = member.guild?.name || 'Servidor NEEI';
  const memberCount = member.guild?.memberCount || '1';
  const joinTime = Math.floor((member.joinedTimestamp || Date.now()) / 1000);
  const now = Math.floor(Date.now() / 1000);

  const statusBadge = isVerified
    ? '`🟢` **Verificado**'
    : '`🔴` **Verificação Pendente**';

  const detailsText = isVerified && sessionData
    ? `• **Nome Completo:** ${sessionData.firstName || ''} ${sessionData.lastName || ''}\n` +
      `• **Número de Aluno:** ${sessionData.studentNumber || ''}\n` +
      `• **Curso:** ${getCourseName ? getCourseName(sessionData.course) : (sessionData.course || 'Não definido')}\n` +
      `• **Verificado em:** <t:${now}:F> (<t:${now}:R>)\n`
    : `• *O membro ainda não concluiu a verificação nas mensagens privadas (DM).*\n`;

  // Secção de Cabeçalho Interno com Thumbnail (Avatar do Membro no canto superior direito)
  const headerSection = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# \`👋\` Registado Novo Membro\n\n` +
        `• **Membro:** <@${member.id}> (${member.user?.tag || member.id})\n` +
        `• **Estado:** ${statusBadge}\n` +
        `• **Membro nº:** #${memberCount} do servidor\n\n` +
        detailsText
      )
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder().setURL(userAvatar)
    );

  const separator = new SeparatorBuilder()
    .setDivider(true)
    .setSpacing(SeparatorSpacingSize.Small);

  // Rodapé com Timestamp de entrada
  const footerText = new TextDisplayBuilder().setContent(
    `-# Entrou no servidor em: <t:${joinTime}:F> (<t:${joinTime}:R>)\n` +
    `-# ${serverName} • Registo Interno de Entradas`
  );

  return new ContainerBuilder()
    .setAccentColor(isVerified ? 0x2ECC71 : 0xE74C3C) // Verde (verificado) vs Vermelho (pendente)
    .addSectionComponents(headerSection)
    .addSeparatorComponents(separator)
    .addTextDisplayComponents(footerText);
}

/**
 * Constrói e envia o cartão de Boas-Vindas Público no canal público assim que a verificação for concluída.
 * @param {import('discord.js').Client} client
 * @param {import('discord.js').GuildMember|object} member
 * @param {object} sessionData
 */
export async function sendPublicWelcomeCard(client, member, sessionData) {
  const publicWelcomeChannelId = process.env.PUBLIC_WELCOME_CHANNEL_ID || process.env.WELCOME_CHANNEL_ID;
  if (!publicWelcomeChannelId || !publicWelcomeChannelId.trim()) return;

  try {
    const channel = await client.channels.fetch(publicWelcomeChannelId.trim()).catch(() => null);
    if (!channel) return;

    const userAvatar = member.user?.displayAvatarURL
      ? member.user.displayAvatarURL({ extension: 'png', size: 256 })
      : 'https://cdn.discordapp.com/embed/avatars/0.png';

    const section = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# \`🎉\` Bem-vindo(a) ao NEEI, <@${member.id}>!\n` +
          `É um gosto enorme ter-te connosco no servidor do **Núcleo de Estudantes de Engenharia Informática**!\n\n` +
          `• **Regras & Convivência:** Dá uma vista de olhos no canal de regras para manteres um bom ambiente.\n` +
          `• **Dúvidas & Ajuda:** Não tenhas qualquer receio de pedir ajuda em matérias, trabalhos ou projetos. Estamos todos aqui para nos entreajudarmos!\n\n` +
          `### \`🚀\` **"O Curso Não Se Faz Sozinho"**`
        )
      )
      .setThumbnailAccessory(
        new ThumbnailBuilder().setURL(userAvatar)
      );

    const separator = new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Small);

    // URLs
    const siteUrl = process.env.NEEI_SITE_URL || 'https://neeiualg.vercel.app/';
    const ghUrl = process.env.NEEI_GITHUB_URL || 'https://github.com/neei-aaualg';
    const liUrl = process.env.NEEI_LINKEDIN_URL || 'https://linkedin.com/company/neeiualg';
    const waUrl = process.env.NEEI_WHATSAPP_URL || 'https://chat.whatsapp.com/';
    const igUrl = process.env.NEEI_INSTAGRAM_URL || 'https://instagram.com/neeiualg';
    const fbUrl = process.env.NEEI_FACEBOOK_URL || 'https://facebook.com/neeiualg';

    // Linha 1: Website Oficial
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Website Oficial')
        .setStyle(ButtonStyle.Link)
        .setURL(siteUrl)
        .setEmoji('🌐')
    );

    // Linha 2: GitHub e LinkedIn
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('GitHub').setStyle(ButtonStyle.Link).setURL(ghUrl).setEmoji('🐙'),
      new ButtonBuilder().setLabel('LinkedIn').setStyle(ButtonStyle.Link).setURL(liUrl).setEmoji('💼')
    );

    // Linha 3: Resto das redes sociais (WhatsApp, Instagram, Facebook)
    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('WhatsApp').setStyle(ButtonStyle.Link).setURL(waUrl).setEmoji('💬'),
      new ButtonBuilder().setLabel('Instagram').setStyle(ButtonStyle.Link).setURL(igUrl).setEmoji('📸'),
      new ButtonBuilder().setLabel('Facebook').setStyle(ButtonStyle.Link).setURL(fbUrl).setEmoji('📘')
    );

    const publicContainer = new ContainerBuilder()
      .setAccentColor(0x24242A)
      .addSectionComponents(section)
      .addSeparatorComponents(separator)
      .addActionRowComponents(row1)
      .addActionRowComponents(row2)
      .addActionRowComponents(row3);

    await channel.send({
      components: [publicContainer],
      flags: MessageFlags.IsComponentsV2
    });

    console.log(`🎉 Cartão de Boas-Vindas Público enviado com sucesso para <@${member.id}> no canal de boas-vindas público!`);
  } catch (error) {
    console.warn(`⚠️ [WARN-005] Erro ao enviar cartão público de boas-vindas a <@${member.id}>:`, error.message);
  }
}

/**
 * Atualiza em tempo real a mensagem de entrada do membro no canal de registos de entrada assim que a verificação for concluída.
 * @param {import('discord.js').Client} client
 * @param {string} userId
 * @param {object} sessionData
 */
export async function updateMemberWelcomeCard(client, userId, sessionData) {
  const welcomeData = welcomeMessageMap.get(userId);
  const welcomeChannelId = process.env.WELCOME_CHANNEL_ID || welcomeData?.channelId;

  if (!welcomeChannelId) return;

  try {
    const channel = await client.channels.fetch(welcomeChannelId.trim()).catch(() => null);
    if (!channel) return;

    let targetMessage = null;

    if (welcomeData?.messageId) {
      targetMessage = await channel.messages.fetch(welcomeData.messageId).catch(() => null);
    }

    // Se não encontrou pela memória, procura as últimas mensagens do canal que mencione o utilizador
    if (!targetMessage) {
      const messages = await channel.messages.fetch({ limit: 50 }).catch(() => null);
      if (messages) {
        targetMessage = messages.find(m =>
          m.author.id === client.user.id &&
          (m.content?.includes(userId) || JSON.stringify(m.components).includes(userId))
        );
      }
    }

    if (!targetMessage) return;

    // Obtém ou procura os dados do membro no servidor
    const guild = targetMessage.guild || (process.env.GUILD_ID ? await client.guilds.fetch(process.env.GUILD_ID).catch(() => null) : null);
    let member = guild ? await guild.members.fetch(userId).catch(() => null) : null;

    if (!member) {
      member = {
        id: userId,
        user: { id: userId, tag: userId, displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png' },
        guild: guild || { name: 'Servidor NEEI' }
      };
    }

    const updatedContainer = buildWelcomeContainer(member, true, sessionData);

    await targetMessage.edit({
      components: [updatedContainer],
      flags: MessageFlags.IsComponentsV2
    }).catch(() => console.warn(`⚠️ [WARN-005] Erro ao editar cartão de entrada de <@${userId}>. Vê DICIONARIO_CONSOLA.md.`));

    console.log(`🟢 Mensagem de registo interno do utilizador <@${userId}> atualizada para VERIFICADO!`);
  } catch (error) {
    console.warn(`⚠️ [WARN-005] Erro ao atualizar cartão de entrada de <@${userId}>. Vê DICIONARIO_CONSOLA.md.`);
  }
}
