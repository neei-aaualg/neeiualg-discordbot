import { createTranscript, ExportReturnType } from 'discord-html-transcripts';

/**
 * Gera uma transcrição visual em formato HTML para o canal de ticket.
 *
 * @param {import('discord.js').TextBasedChannel} channel - Canal do ticket a ser transcrito.
 * @returns {Promise<import('discord.js').AttachmentBuilder>} O anexo HTML do transcript.
 */
export async function createTicketTranscript(channel) {
  const channelName = channel.name || 'ticket';
  const fileName = `transcript-ticket-${channelName}.html`;

  return await createTranscript(channel, {
    limit: -1,
    returnType: ExportReturnType.Attachment,
    returnAttachment: true,
    returnBuffer: false,
    fileName: fileName,
    filename: fileName,
    saveImages: true,
    poweredBy: false
  });
}

export default {
  createTicketTranscript
};
