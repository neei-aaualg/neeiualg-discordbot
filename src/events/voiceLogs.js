import { logVoiceAction } from '../utils/logger.js';

/**
 * Regista o event listener de canais de voz para auditoria.
 * @param {import('discord.js').Client} client 
 */
export function registerVoiceLogsEvents(client) {
  client.on('voiceStateUpdate', async (oldState, newState) => {
    try {
      await logVoiceAction(oldState, newState);
    } catch (err) {
      console.error('[Event Error] voiceStateUpdate:', err);
    }
  });
}
