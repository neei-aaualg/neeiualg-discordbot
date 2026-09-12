import {
  ContainerBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  ThumbnailBuilder,
  ButtonBuilder,
  ButtonStyle,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ActionRowBuilder,
  MessageFlags
} from 'discord.js';

const DEFAULT_FALLBACK_IMAGE = 'https://cdn.discordapp.com/embed/avatars/0.png';
const DEFAULT_SITE_IMAGE = 'https://cdn.discordapp.com/attachments/1532042242259161169/1532042338032025793/image.png?ex=6a6c11dd&is=6a6ac05d&hm=259cdaca62691f8e4cc08d4906dee01c803a2442000e3a3d1be4ada2e4753ff8&';

/**
 * Constrói o Container V2 para a mensagem do Website Oficial do NEEI.
 */
export function buildSiteContainer(siteUrl = 'https://neeiualg.vercel.app/', imageUrl = DEFAULT_SITE_IMAGE) {
  const finalImageUrl = imageUrl || DEFAULT_SITE_IMAGE;

  const linkButton = new ButtonBuilder()
    .setLabel('Visitar Website')
    .setStyle(ButtonStyle.Link)
    .setURL(siteUrl)
    .setEmoji('🌐');

  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '# `🌐` Website Oficial do NEEI\n' +
        'Explora o nosso site oficial para ficares a par de todas as novidades, projetos, eventos e recursos exclusivos do Núcleo de Estudantes de Engenharia Informática!\n\n' +
        '• Visita-nos e descobre tudo o que preparámos para ti.'
      )
    )
    .setButtonAccessory(linkButton);

  const container = new ContainerBuilder()
    .setAccentColor(0x24242A)
    .addSectionComponents(section);

  if (finalImageUrl && finalImageUrl.trim()) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(finalImageUrl.trim())
      )
    );
  }

  return container;
}

/**
 * Constrói o Container V2 para o painel de Regras do Servidor.
 */
export function buildRegrasContainer(serverIconUrl = null) {
  const iconUrl = serverIconUrl || DEFAULT_FALLBACK_IMAGE;

  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '# `📜` Regras do Servidor\n' +
        'Bem-vindo(a) ao servidor do **NEEI**! Para manter um bom ambiente e garantir que todos desfrutam da comunidade, pedimos que cumpras as seguintes regras:\n\n' +
        '1. `🗣️` **Respeito Mútuo**: Trata todos os membros com educação e cortesia. Discriminação ou ofensas não são toleradas.\n' +
        '2. `💬` **Canais Corretos**: Utiliza cada canal para o seu propósito específico (ex: dúvidas de matérias, chat geral, avisos).\n' +
        '3. `🚫` **Sem Spam ou Pub**: É proibido spam, autopromoção ou links suspeitos sem permissão da administração.\n' +
        '4. `🔒` **Privacidade**: Não partilhes informações ou dados pessoais sensíveis de terceiros.\n' +
        '5. `⚖️` **Decisão da Moderação**: A equipa de administração reserva-se o direito de intervir sempre que necessário.'
      )
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder().setURL(iconUrl)
    );

  return new ContainerBuilder()
    .setAccentColor(0x24242A)
    .addSectionComponents(section);
}

/**
 * Constrói o Container V2 para o painel de Convite Oficial do Servidor.
 */
export function buildConviteContainer(inviteUrl = 'https://discord.gg/HzBuRFCAb5', serverIconUrl = null) {
  const iconUrl = serverIconUrl || DEFAULT_FALLBACK_IMAGE;

  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '# `🔗` Convite Oficial do Servidor\n' +
        'Partilha o nosso servidor com os teus colegas de curso e amigos!\n\n' +
        '• **Link de Convite Permanente:**\n' +
        `\`\`\`${inviteUrl}\`\`\``
      )
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder().setURL(iconUrl)
    );

  return new ContainerBuilder()
    .setAccentColor(0x24242A)
    .addSectionComponents(section);
}

/**
 * Constrói o Container V2 para o painel da NEEI-Box (Repositório de Estudo).
 */
export function buildUltimateLeiContainer(boxUrl = 'https://box.neei.online/', serverIconUrl = null) {
  const iconUrl = serverIconUrl || DEFAULT_FALLBACK_IMAGE;

  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '# `📦` NEEI-Box — Repositório de Estudo\n' +
        'A **NEEI-Box** é a nossa plataforma onde encontras todo o material de estudo essencial para o teu percurso académico!\n\n' +
        '• **O que encontras na NEEI-Box:**\n' +
        '  - Apontamentos, resumos e sebentas de várias disciplinas.\n' +
        '  - Frequências, testes e exames de anos anteriores.\n' +
        '  - Guias práticos, exercícios resolvidos e recursos de apoio.\n\n' +
        '• **Link da NEEI-Box:**\n' +
        `\`${boxUrl}\`\n\n` +
        '-# Clica nos botões abaixo para acederes diretamente ou copiares o link.'
      )
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder().setURL(iconUrl)
    );

  const separator = new SeparatorBuilder()
    .setDivider(true)
    .setSpacing(SeparatorSpacingSize.Small);

  const linkButton = new ButtonBuilder()
    .setLabel('Aceder à NEEI-Box')
    .setStyle(ButtonStyle.Link)
    .setURL(boxUrl)
    .setEmoji('📦');

  const copyButton = new ButtonBuilder()
    .setCustomId('copy_ultimate_link')
    .setLabel('Copiar Link')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji('📋');

  const buttonRow = new ActionRowBuilder().addComponents(linkButton, copyButton);

  return new ContainerBuilder()
    .setAccentColor(0x24242A)
    .addSectionComponents(section)
    .addSeparatorComponents(separator)
    .addActionRowComponents(buttonRow);
}

export const buildNeeiBoxContainer = buildUltimateLeiContainer;

/**
 * Constrói o Container V2 para o painel de Controlo de Modo Administrador.
 */
export function buildAdminPanelContainer(serverIconUrl = null) {
  const iconUrl = serverIconUrl || DEFAULT_FALLBACK_IMAGE;

  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '# `🛠️` Painel de Configurador do Discord\n' +
        'Este Painel Serve para receberes o cargo mais alto do discord **Temporáriamente**, e assim teres acesso a todas as funcionalidades \nque o discord oferece.\n\n' +
        '• Clica no botão abaixo para receberes ou removeres o cargo.'
      )
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder().setURL(iconUrl)
    );

  const separator = new SeparatorBuilder()
    .setDivider(true)
    .setSpacing(SeparatorSpacingSize.Small);

  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('toggle_admin_role')
      .setLabel('Receber/Remover Cargo')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('✍️')
  );

  return new ContainerBuilder()
    .setAccentColor(0x24242A)
    .addSectionComponents(section)
    .addSeparatorComponents(separator)
    .addActionRowComponents(buttonRow);
}

/**
 * Constrói o Container V2 para o painel de Verificação de Membros.
 */
export function buildVerificacaoPanelContainer(botAvatarUrl = null) {
  const avatarUrl = botAvatarUrl || DEFAULT_FALLBACK_IMAGE;

  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '# `🛡️` Verificação de Membros\n' +
        'Bem-vindo(a) ao servidor! Para teres acesso completo a todos os canais e funcionalidades da nossa comunidade, precisas de te verificar.\n\n' +
        '• Clica no botão **Verificar** abaixo para concluíres a tua verificação e receberes acesso aos canais.'
      )
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder().setURL(avatarUrl)
    );

  const separator = new SeparatorBuilder()
    .setDivider(true)
    .setSpacing(SeparatorSpacingSize.Small);

  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('verify_member')
      .setLabel('Verificar')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅')
  );

  return new ContainerBuilder()
    .setAccentColor(0x24242A)
    .addSectionComponents(section)
    .addSeparatorComponents(separator)
    .addActionRowComponents(buttonRow);
}

/**
 * Constrói o Container V2 para o painel do Sistema de Tickets.
 */
export function buildTicketPanelContainer(serverIconUrl = null) {
  const iconUrl = serverIconUrl || DEFAULT_FALLBACK_IMAGE;

  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '# `🎫` Sistema de Tickets\n' +
        'Precisas de ajuda ou tens alguma dúvida relativamente ao NEEI ou ao teu curso?\n' +
        'Clica no botão abaixo para abrir um ticket de suporte privado com a nossa equipa.\n' +
        'Serás atendido o mais brevemente possível por um elemento da direção.\n\n' +
        '-# `📌` Clica no botão **Abrir Ticket** para iniciares o teu atendimento.'
      )
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder().setURL(iconUrl)
    );

  const separator = new SeparatorBuilder()
    .setDivider(true)
    .setSpacing(SeparatorSpacingSize.Small);

  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('open_ticket')
      .setLabel('Abrir Ticket')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🎫')
  );

  return new ContainerBuilder()
    .setAccentColor(0x24242A)
    .addSectionComponents(section)
    .addSeparatorComponents(separator)
    .addActionRowComponents(buttonRow);
}

/**
 * Helper reutilizável para enviar o container para o canal de destino e responder efémeramente ao administrador.
 * @param {import('discord.js').Interaction} interaction
 * @param {import('discord.js').TextChannel} targetChannel
 * @param {ContainerBuilder} container
 * @param {string} successMessage
 */
export async function sendPanelMessage(interaction, targetChannel, container, successMessage) {
  if (!targetChannel) {
    await interaction.reply({
      content: '❌ Não foi possível identificar o canal de destino.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  try {
    await targetChannel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });

    await interaction.reply({
      content: successMessage,
      flags: MessageFlags.Ephemeral
    });
  } catch (error) {
    console.error('Erro ao enviar o painel para o canal:', error);
    await interaction.reply({
      content: `❌ Não foi possível enviar a mensagem para o canal ${targetChannel}. Verifica se o bot tem permissões para ver e enviar mensagens nesse canal.`,
      flags: MessageFlags.Ephemeral
    });
  }
}
