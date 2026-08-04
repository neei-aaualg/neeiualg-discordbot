import {
  MessageFlags,
  ContainerBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  ThumbnailBuilder
} from 'discord.js';

/**
 * Função utilitária central para envio seguro de Containers V2 para canais de log.
 * Se a variável de ambiente não estiver definida ou o canal não for acessível, ignora silenciosamente.
 *
 * @param {import('discord.js').Client} client - Cliente do Discord.
 * @param {string} envKey - Nome da variável de ambiente (ex: 'MESSAGES_LOGS_CHANNEL_ID').
 * @param {ContainerBuilder} container - O container V2 construído.
 */
async function sendContainerLog(client, envKey, container) {
  try {
    const channelId = process.env[envKey]?.trim();
    if (!channelId || !client) return;

    const channel = client.channels.cache.get(channelId) || await client.channels.fetch(channelId).catch(() => null);
    if (!channel || typeof channel.send !== 'function') return;

    await channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    }).catch(err => console.error(`[Logger Error] Falha ao enviar log para ${envKey}:`, err.message));
  } catch (err) {
    console.error(`[Logger Exception] Exceção em sendContainerLog (${envKey}):`, err);
  }
}

/* ========================================================================== */
/* 💬 1. LOGS DE MENSAGENS (MESSAGES_LOGS_CHANNEL_ID)                        */
/* ========================================================================== */

/**
 * Regista a edição de uma mensagem.
 */
export async function logMessageUpdate(oldMsg, newMsg) {
  if (!oldMsg || !newMsg || oldMsg.author?.bot) return;
  if (oldMsg.content === newMsg.content) return; // Ignora se o conteúdo de texto não mudou

  const user = newMsg.author;
  const userAvatar = user?.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

  const textContent =
    `# \`✏️\` Mensagem Editada\n` +
    `• **Autor:** ${user ? `**${user.displayName || user.username}** (<@${user.id}>)` : 'Desconhecido'}\n` +
    `• **Canal:** <#${newMsg.channelId}>\n` +
    `• **Editado em:** <t:${Math.floor(Date.now() / 1000)}:R>\n\n` +
    `• **Conteúdo Anterior:**\n\`\`\`\n${(oldMsg.content || '[Sem conteúdo de texto]').slice(0, 800)}\n\`\`\`\n` +
    `• **Novo Conteúdo:**\n\`\`\`\n${(newMsg.content || '[Sem conteúdo de texto]').slice(0, 800)}\n\`\`\``;

  const section = new SectionBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(textContent))
    .setThumbnailAccessory(new ThumbnailBuilder().setURL(userAvatar));

  const container = new ContainerBuilder()
    .setAccentColor(0xEAB308) // Amarelo
    .addSectionComponents(section);

  await sendContainerLog(newMsg.client, 'MESSAGES_LOGS_CHANNEL_ID', container);
}

/**
 * Regista a eliminação individual de uma mensagem.
 */
export async function logMessageDelete(msg) {
  if (!msg || msg.author?.bot) return;

  const user = msg.author;
  const userAvatar = user?.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

  let textContent =
    `# \`🗑️\` Mensagem Eliminada\n` +
    `• **Autor:** ${user ? `**${user.displayName || user.username}** (<@${user.id}>)` : 'Desconhecido'}\n` +
    `• **Canal:** <#${msg.channelId}>\n` +
    `• **Eliminado em:** <t:${Math.floor(Date.now() / 1000)}:R>\n\n` +
    `• **Conteúdo:**\n\`\`\`\n${(msg.content || '[Sem conteúdo de texto]').slice(0, 1000)}\n\`\`\``;

  if (msg.attachments && msg.attachments.size > 0) {
    const attachmentNames = msg.attachments.map(att => `\`${att.name}\``).join(', ');
    textContent += `\n\n📎 **Anexos que existiam na mensagem:** ${attachmentNames}`;
  }

  const section = new SectionBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(textContent))
    .setThumbnailAccessory(new ThumbnailBuilder().setURL(userAvatar));

  const container = new ContainerBuilder()
    .setAccentColor(0xEF4444) // Vermelho
    .addSectionComponents(section);

  await sendContainerLog(msg.client, 'MESSAGES_LOGS_CHANNEL_ID', container);
}

/**
 * Regista a eliminação em massa de mensagens (Purge/Bulk Delete).
 */
export async function logMessageDeleteBulk(messages, channel) {
  if (!channel || !messages) return;

  const textContent =
    `# \`🧹\` Limpeza em Massa de Mensagens (Purge)\n` +
    `• **Canal:** <#${channel.id}>\n` +
    `• **Quantidade de Mensagens:** \`${messages.size}\` mensagens\n` +
    `• **Data/Hora:** <t:${Math.floor(Date.now() / 1000)}:F>`;

  const section = new SectionBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(textContent));

  const container = new ContainerBuilder()
    .setAccentColor(0xDC2626) // Vermelho Escuro
    .addSectionComponents(section);

  await sendContainerLog(channel.client, 'MESSAGES_LOGS_CHANNEL_ID', container);
}

/**
 * Regista a alteração de mensagens afixadas/desafixadas num canal.
 */
export async function logChannelPinsUpdate(channel) {
  if (!channel) return;

  const textContent =
    `# \`📌\` Atualização de Mensagens Afixadas\n` +
    `• **Canal:** <#${channel.id}>\n` +
    `• **Data/Hora:** <t:${Math.floor(Date.now() / 1000)}:F>`;

  const section = new SectionBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(textContent));

  const container = new ContainerBuilder()
    .setAccentColor(0x3B82F6) // Azul
    .addSectionComponents(section);

  await sendContainerLog(channel.client, 'MESSAGES_LOGS_CHANNEL_ID', container);
}

/* ========================================================================== */
/* 🤖 2. LOGS DE INTERAÇÕES (INTERACTIONS_LOGS_CHANNEL_ID)                    */
/* ========================================================================== */

/**
 * Regista a execução de comandos, botões, selects ou modais.
 */
export async function logInteraction(interaction, details = '') {
  if (!interaction) return;

  const user = interaction.user;
  const userAvatar = user?.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

  let typeLabel = 'Interação';
  let identifier = 'Desconhecido';

  if (interaction.isChatInputCommand()) {
    typeLabel = 'Slash Command';
    identifier = `\`/${interaction.commandName}\``;
  } else if (interaction.isButton()) {
    typeLabel = 'Botão';
    identifier = `\`${interaction.customId}\``;
  } else if (interaction.isStringSelectMenu() || interaction.isUserSelectMenu()) {
    typeLabel = 'Select Menu';
    identifier = `\`${interaction.customId}\``;
  } else if (interaction.isModalSubmit()) {
    typeLabel = 'Modal (Formulário)';
    identifier = `\`${interaction.customId}\``;
  }

  let textContent =
    `# \`🤖\` Interação Executada — ${typeLabel}\n` +
    `• **Utilizador:** **${user.displayName || user.username}** (<@${user.id}>)\n` +
    `• **Identificador:** ${identifier}\n` +
    `• **Canal:** ${interaction.channelId ? `<#${interaction.channelId}>` : 'DM / Privado'}\n` +
    `• **Executado em:** <t:${Math.floor(Date.now() / 1000)}:R>\n`;

  if (details) {
    textContent += `\n• **Detalhes / Parâmetros:**\n\`\`\`\n${details.slice(0, 800)}\n\`\`\``;
  }

  const section = new SectionBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(textContent))
    .setThumbnailAccessory(new ThumbnailBuilder().setURL(userAvatar));

  const container = new ContainerBuilder()
    .setAccentColor(0x6366F1) // Índigo
    .addSectionComponents(section);

  await sendContainerLog(interaction.client, 'INTERACTIONS_LOGS_CHANNEL_ID', container);
}

/**
 * Regista tentativas de acesso negado por falta de permissões/cargos.
 */
export async function logUnauthorizedAccess(interaction, requiredRoleOrPermission) {
  if (!interaction) return;

  const user = interaction.user;
  const userAvatar = user?.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

  const actionName = interaction.isChatInputCommand()
    ? `\`/${interaction.commandName}\``
    : `\`${interaction.customId}\``;

  const textContent =
    `# \`🚫\` Tentativa de Acesso Sem Permissão\n` +
    `• **Utilizador:** **${user.displayName || user.username}** (<@${user.id}> | ID: \`${user.id}\`)\n` +
    `• **Ação Tentada:** ${actionName}\n` +
    `• **Requisito em Falta:** \`${requiredRoleOrPermission}\`\n` +
    `• **Canal:** ${interaction.channelId ? `<#${interaction.channelId}>` : 'DM / Privado'}\n` +
    `• **Data/Hora:** <t:${Math.floor(Date.now() / 1000)}:F>`;

  const section = new SectionBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(textContent))
    .setThumbnailAccessory(new ThumbnailBuilder().setURL(userAvatar));

  const container = new ContainerBuilder()
    .setAccentColor(0xF59E0B) // Laranja
    .addSectionComponents(section);

  await sendContainerLog(interaction.client, 'INTERACTIONS_LOGS_CHANNEL_ID', container);
}

/* ========================================================================== */
/* ⚙️ 3. LOGS DE AÇÕES DE ESTRUTURA E MEMBROS (ACTIONS_LOGS_CHANNEL_ID)      */
/* ========================================================================== */

/**
 * Regista ações em Canais, Categorias ou Threads.
 */
export async function logChannelAction(actionType, channel, details = '') {
  if (!channel) return;

  let title = 'Ação em Canal';
  let color = 0x3B82F6;

  if (actionType === 'create') {
    title = '➕ Canal Criado';
    color = 0x22C55E; // Verde
  } else if (actionType === 'update') {
    title = '✏️ Canal Modificado';
    color = 0xEAB308; // Amarelo
  } else if (actionType === 'delete') {
    title = '🗑️ Canal Eliminado';
    color = 0xEF4444; // Vermelho
  } else if (actionType === 'threadCreate') {
    title = '🧵 Thread Criada';
    color = 0x8B5CF6; // Roxo
  }

  const textContent =
    `# \`${title.split(' ')[0]}\` ${title.split(' ').slice(1).join(' ')}\n` +
    `• **Nome do Canal:** \`#${channel.name}\` (${channel.id ? `<#${channel.id}>` : 'N/A'})\n` +
    `• **Tipo:** \`${channel.type}\`\n` +
    `• **Data/Hora:** <t:${Math.floor(Date.now() / 1000)}:F>\n` +
    `${details ? `\n• **Detalhes da Alteração:**\n${details}` : ''}`;

  const section = new SectionBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(textContent));

  const container = new ContainerBuilder()
    .setAccentColor(color)
    .addSectionComponents(section);

  await sendContainerLog(channel.client, 'ACTIONS_LOGS_CHANNEL_ID', container);
}

/**
 * Regista ações em Cargos (Roles).
 */
export async function logRoleAction(actionType, role, details = '') {
  if (!role) return;

  let title = 'Ação em Cargo';
  let color = 0x3B82F6;

  if (actionType === 'create') {
    title = '➕ Cargo Criado';
    color = 0x22C55E;
  } else if (actionType === 'update') {
    title = '✏️ Cargo Modificado';
    color = 0xEAB308;
  } else if (actionType === 'delete') {
    title = '🗑️ Cargo Eliminado';
    color = 0xEF4444;
  }

  const textContent =
    `# \`${title.split(' ')[0]}\` ${title.split(' ').slice(1).join(' ')}\n` +
    `• **Cargo:** **${role.name}** (\`<@&${role.id}>\` | ID: \`${role.id}\`)\n` +
    `• **Cor:** \`${role.hexColor}\`\n` +
    `• **Data/Hora:** <t:${Math.floor(Date.now() / 1000)}:F>\n` +
    `${details ? `\n• **Detalhes:**\n${details}` : ''}`;

  const section = new SectionBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(textContent));

  const container = new ContainerBuilder()
    .setAccentColor(color)
    .addSectionComponents(section);

  await sendContainerLog(role.client, 'ACTIONS_LOGS_CHANNEL_ID', container);
}

/**
 * Regista ações em Membros (Nicknames, Cargos, Timeouts, Kicks, Bans).
 */
export async function logMemberAction(actionType, memberOrUser, details = '') {
  if (!memberOrUser) return;

  const user = memberOrUser.user || memberOrUser;
  const userAvatar = (user && typeof user.displayAvatarURL === 'function')
    ? user.displayAvatarURL({ extension: 'png', size: 256 })
    : 'https://cdn.discordapp.com/embed/avatars/0.png';

  let title = 'Ação de Membro';
  let color = 0x3B82F6;

  if (actionType === 'nickname') {
    title = '👤 Nickname Alterado';
    color = 0x3B82F6;
  } else if (actionType === 'roles') {
    title = '🛡️ Cargos de Membro Atualizados';
    color = 0x8B5CF6;
  } else if (actionType === 'timeout') {
    title = '⏳ Membro Silenciado (Timeout)';
    color = 0xF59E0B;
  } else if (actionType === 'ban') {
    title = '🔨 Membro Banido';
    color = 0xDC2626;
  } else if (actionType === 'unban') {
    title = '🔓 Membro Desbanido';
    color = 0x22C55E;
  }

  const textContent =
    `# \`${title.split(' ')[0]}\` ${title.split(' ').slice(1).join(' ')}\n` +
    `• **Membro:** **${memberOrUser.displayName || user.username}** (<@${user.id}> | ID: \`${user.id}\`)\n` +
    `• **Data/Hora:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
    `• **Detalhes:**\n${details || 'Sem detalhes adicionais.'}`;

  const section = new SectionBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(textContent))
    .setThumbnailAccessory(new ThumbnailBuilder().setURL(userAvatar));

  const container = new ContainerBuilder()
    .setAccentColor(color)
    .addSectionComponents(section);

  const client = memberOrUser.client || user.client;
  await sendContainerLog(client, 'ACTIONS_LOGS_CHANNEL_ID', container);
}

/* ========================================================================== */
/* 🔊 4. LOGS DE CANAIS DE VOZ (VOICE_LOGS_CHANNEL_ID)                        */
/* ========================================================================== */

/**
 * Regista eventos de estado de voz (entrada, saída, troca de sala, mutes).
 */
export async function logVoiceAction(oldState, newState) {
  if (!oldState && !newState) return;

  const member = newState?.member || oldState?.member;
  if (!member || member.user?.bot) return;

  const client = newState?.client || oldState?.client;
  const userAvatar = member.user.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

  let title = 'Atividade de Voz';
  let color = 0x3B82F6;
  let detailsText = '';

  // 1. Entrou num canal de voz
  if (!oldState.channelId && newState.channelId) {
    title = '🔊 Entrou num Canal de Voz';
    color = 0x22C55E; // Verde
    detailsText = `• **Canal:** <#${newState.channelId}>`;
  }
  // 2. Saiu de um canal de voz
  else if (oldState.channelId && !newState.channelId) {
    title = '🔇 Saiu do Canal de Voz';
    color = 0xEF4444; // Vermelho
    detailsText = `• **Canal Anterior:** <#${oldState.channelId}>`;
  }
  // 3. Mudou de canal de voz
  else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
    title = '🔀 Mudou de Canal de Voz';
    color = 0xF59E0B; // Laranja
    detailsText = `• **Canal Anterior:** <#${oldState.channelId}>\n• **Novo Canal:** <#${newState.channelId}>`;
  }
  // 4. Alteração de Mute/Deafen
  else {
    const changes = [];
    if (oldState.serverMute !== newState.serverMute) {
      changes.push(`• **Mute por Moderação:** \`${newState.serverMute ? 'Ativado 🔴' : 'Desativado 🟢'}\``);
    }
    if (oldState.serverDeaf !== newState.serverDeaf) {
      changes.push(`• **Surdez por Moderação:** \`${newState.serverDeaf ? 'Ativado 🔴' : 'Desativado 🟢'}\``);
    }
    if (oldState.selfMute !== newState.selfMute) {
      changes.push(`• **Microfone Próprio:** \`${newState.selfMute ? 'Mutado 🎙️' : 'Desmutado 🎙️'}\``);
    }
    if (oldState.selfDeaf !== newState.selfDeaf) {
      changes.push(`• **Áudio Próprio:** \`${newState.selfDeaf ? 'Ensurdecido 🎧' : 'Ativo 🎧'}\``);
    }
    if (oldState.streaming !== newState.streaming) {
      changes.push(`• **Transmissão de Ecrã:** \`${newState.streaming ? 'Iniciada 📺' : 'Terminada 📺'}\``);
    }

    if (changes.length === 0) return; // Nenhuma alteração relevante para registar

    title = '🎙️ Estado de Voz Alterado';
    color = 0x6366F1;
    detailsText = `• **Canal:** <#${newState.channelId}>\n${changes.join('\n')}`;
  }

  const textContent =
    `# \`${title.split(' ')[0]}\` ${title.split(' ').slice(1).join(' ')}\n` +
    `• **Membro:** **${member.displayName || member.user.username}** (<@${member.id}>)\n` +
    `• **Data/Hora:** <t:${Math.floor(Date.now() / 1000)}:R>\n\n` +
    `${detailsText}`;

  const section = new SectionBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(textContent))
    .setThumbnailAccessory(new ThumbnailBuilder().setURL(userAvatar));

  const container = new ContainerBuilder()
    .setAccentColor(color)
    .addSectionComponents(section);

  await sendContainerLog(client, 'VOICE_LOGS_CHANNEL_ID', container);
}

export default {
  logMessageUpdate,
  logMessageDelete,
  logMessageDeleteBulk,
  logChannelPinsUpdate,
  logInteraction,
  logUnauthorizedAccess,
  logChannelAction,
  logRoleAction,
  logMemberAction,
  logVoiceAction
};
