import {
  logMessageUpdate,
  logMessageDelete,
  logMessageDeleteBulk,
  logChannelPinsUpdate
} from '../utils/logger.js';

/**
 * Regista os event listeners de mensagens para auditoria.
 * @param {import('discord.js').Client} client 
 */
export function registerMessageLogsEvents(client) {
  // 1. Edição de mensagem
  client.on('messageUpdate', async (oldMsg, newMsg) => {
    try {
      await logMessageUpdate(oldMsg, newMsg);
    } catch (err) {
      console.error('[Event Error] messageUpdate:', err);
    }
  });

  // 2. Eliminação individual de mensagem
  client.on('messageDelete', async (message) => {
    try {
      await logMessageDelete(message);
    } catch (err) {
      console.error('[Event Error] messageDelete:', err);
    }
  });

  // 3. Eliminação em massa (Purge)
  client.on('messageDeleteBulk', async (messages, channel) => {
    try {
      await logMessageDeleteBulk(messages, channel);
    } catch (err) {
      console.error('[Event Error] messageDeleteBulk:', err);
    }
  });

  // 4. Atualização de mensagens afixadas
  client.on('channelPinsUpdate', async (channel) => {
    try {
      await logChannelPinsUpdate(channel);
    } catch (err) {
      console.error('[Event Error] channelPinsUpdate:', err);
    }
  });
}
