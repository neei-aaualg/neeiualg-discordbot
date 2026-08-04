import {
  logChannelAction,
  logRoleAction,
  logMemberAction
} from '../utils/logger.js';

/**
 * Regista os event listeners de estrutura do servidor, cargos e membros.
 * @param {import('discord.js').Client} client 
 */
export function registerActionLogsEvents(client) {
  // --- Ações em Canais e Threads ---
  client.on('channelCreate', async (channel) => {
    try {
      await logChannelAction('create', channel);
    } catch (err) {
      console.error('[Event Error] channelCreate:', err);
    }
  });

  client.on('channelUpdate', async (oldChannel, newChannel) => {
    try {
      const changes = [];
      if (oldChannel.name !== newChannel.name) {
        changes.push(`• **Nome:** \`#${oldChannel.name}\` ➔ \`#${newChannel.name}\``);
      }
      await logChannelAction('update', newChannel, changes.join('\n'));
    } catch (err) {
      console.error('[Event Error] channelUpdate:', err);
    }
  });

  client.on('channelDelete', async (channel) => {
    try {
      await logChannelAction('delete', channel);
    } catch (err) {
      console.error('[Event Error] channelDelete:', err);
    }
  });

  client.on('threadCreate', async (thread) => {
    try {
      await logChannelAction('threadCreate', thread);
    } catch (err) {
      console.error('[Event Error] threadCreate:', err);
    }
  });

  // --- Ações em Cargos ---
  client.on('roleCreate', async (role) => {
    try {
      await logRoleAction('create', role);
    } catch (err) {
      console.error('[Event Error] roleCreate:', err);
    }
  });

  client.on('roleUpdate', async (oldRole, newRole) => {
    try {
      const changes = [];
      if (oldRole.name !== newRole.name) {
        changes.push(`• **Nome:** \`${oldRole.name}\` ➔ \`${newRole.name}\``);
      }
      if (oldRole.hexColor !== newRole.hexColor) {
        changes.push(`• **Cor:** \`${oldRole.hexColor}\` ➔ \`${newRole.hexColor}\``);
      }
      await logRoleAction('update', newRole, changes.join('\n'));
    } catch (err) {
      console.error('[Event Error] roleUpdate:', err);
    }
  });

  client.on('roleDelete', async (role) => {
    try {
      await logRoleAction('delete', role);
    } catch (err) {
      console.error('[Event Error] roleDelete:', err);
    }
  });

  // --- Ações em Membros ---
  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    try {
      // 1. Alteração de Nickname
      if (oldMember.nickname !== newMember.nickname) {
        const details = `• **Nick Anterior:** \`${oldMember.nickname || oldMember.user.username}\`\n• **Novo Nick:** \`${newMember.nickname || newMember.user.username}\``;
        await logMemberAction('nickname', newMember, details);
      }

      // 2. Alteração de Cargos
      const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
      const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

      if (addedRoles.size > 0 || removedRoles.size > 0) {
        const changes = [];
        if (addedRoles.size > 0) {
          changes.push(`➕ **Cargos Adicionados:** ${addedRoles.map(r => `<@&${r.id}>`).join(', ')}`);
        }
        if (removedRoles.size > 0) {
          changes.push(`➖ **Cargos Removidos:** ${removedRoles.map(r => `<@&${r.id}>`).join(', ')}`);
        }
        await logMemberAction('roles', newMember, changes.join('\n'));
      }

      // 3. Timeout / Silenciamento
      if (!oldMember.isCommunicationDisabled() && newMember.isCommunicationDisabled()) {
        const details = `• **Silenciado até:** <t:${Math.floor(newMember.communicationDisabledUntilTimestamp / 1000)}:F>`;
        await logMemberAction('timeout', newMember, details);
      }
    } catch (err) {
      console.error('[Event Error] guildMemberUpdate:', err);
    }
  });

  client.on('guildBanAdd', async (ban) => {
    try {
      const details = ban.reason ? `• **Motivo:** ${ban.reason}` : '• **Motivo:** Não especificado.';
      await logMemberAction('ban', ban.user, details);
    } catch (err) {
      console.error('[Event Error] guildBanAdd:', err);
    }
  });

  client.on('guildBanRemove', async (ban) => {
    try {
      await logMemberAction('unban', ban.user, '• **Membro desbanido do servidor.**');
    } catch (err) {
      console.error('[Event Error] guildBanRemove:', err);
    }
  });
}
