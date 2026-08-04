import { MessageFlags, ChannelType, PermissionFlagsBits } from 'discord.js';
import { buildWelcomeContainer, welcomeMessageMap } from '../utils/welcomeCard.js';

/**
 * Evento acionado automaticamente quando um novo membro se junta ao servidor.
 * @param {import('discord.js').GuildMember} member
 */
export async function handleGuildMemberAdd(member) {
  console.log(`\n👋 Novo membro entrou no servidor ${member.guild.name}: ${member.user.tag} (ID: ${member.id})`);

  try {
    let welcomeChannel = null;

    // 1. Procura primeiro se a variável WELCOME_CHANNEL_ID está configurada no .env
    const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;
    if (welcomeChannelId && welcomeChannelId.trim()) {
      welcomeChannel = await member.guild.channels.fetch(welcomeChannelId.trim()).catch(() => null);
    }

    // 2. Se não estiver configurado no .env, tenta o canal de sistema oficial do servidor
    if (!welcomeChannel) {
      welcomeChannel = member.guild.systemChannel;
    }

    // 3. Se o canal de sistema não existir, procura por nomes comuns de canais de entrada/boas-vindas
    if (!welcomeChannel) {
      const channels = await member.guild.channels.fetch();
      welcomeChannel = channels.find(c =>
        c &&
        c.type === ChannelType.GuildText &&
        ['boas-vindas', 'welcome', 'entrada', 'geral', 'general', 'chat-geral'].includes(c.name.toLowerCase())
      );
    }

    if (!welcomeChannel) {
      console.warn(`⚠️ [WARN-004] Canal de boas-vindas não encontrado. Vê DICIONARIO_CONSOLA.md.`);
      return;
    }

    // Verificação de permissões do bot no canal
    const botPermissions = welcomeChannel.permissionsFor(member.guild.members.me);
    if (botPermissions && !botPermissions.has(PermissionFlagsBits.SendMessages)) {
      console.warn(`⚠️ O bot não tem permissão para enviar mensagens no canal #${welcomeChannel.name}.`);
      return;
    }

    // Verifica se o membro já se encontra verificado
    const verifiedRoleId = process.env.VERIFIED_ROLE_ID;
    const isVerified = Boolean(verifiedRoleId && member.roles.cache.has(verifiedRoleId));

    // Constrói o Container V2 de entrada/boas-vindas
    const container = buildWelcomeContainer(member, isVerified, null);

    // Envia a mensagem de entrada no canal
    const sentMessage = await welcomeChannel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });

    // Guarda a referência da mensagem para permitir a atualização em tempo real quando se verificar
    if (sentMessage) {
      welcomeMessageMap.set(member.id, {
        channelId: sentMessage.channel.id,
        messageId: sentMessage.id
      });
    }

    console.log(`✅ Registo de entrada enviado com sucesso no canal #${welcomeChannel.name} (Estado: ${isVerified ? 'Verificado' : 'Pendente'})!`);
  } catch (error) {
    console.error(`❌ Erro ao enviar mensagem de boas-vindas para ${member.user.tag}:`, error);
  }
}
