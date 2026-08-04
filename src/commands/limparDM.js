import {
  SlashCommandBuilder,
  MessageFlags
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('limpar-dm')
  .setDescription('Limpa as mensagens enviadas pelo bot na conversa privada (DM) com um utilizador')
  .addUserOption(option =>
    option
      .setName('membro')
      .setDescription('Membro cuja conversa com o bot será limpa (por omissão: tu)')
      .setRequired(false)
  );

export async function execute(interaction) {
  const targetUser = interaction.options.getUser('membro') || interaction.user;

  // Adia a resposta efémera para dar tempo suficiente ao processo de eliminação
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    // Obtém ou abre o canal de mensagens privadas (DM) com o utilizador
    const dmChannel = await targetUser.createDM();
    
    // Procura até 100 mensagens recentes na conversa privada
    const messages = await dmChannel.messages.fetch({ limit: 100 });

    // Filtra apenas as mensagens que foram enviadas pelo próprio bot
    const botMessages = messages.filter(msg => msg.author.id === interaction.client.user.id);

    if (botMessages.size === 0) {
      await interaction.followUp({
        content: `ℹ️ Não foram encontradas mensagens do bot na conversa privada com ${targetUser}.`
      });
      return;
    }

    let deletedCount = 0;
    for (const msg of botMessages.values()) {
      await msg.delete().catch(() => null);
      deletedCount++;
    }

    await interaction.followUp({
      content: `🧹 Limpeza concluída! Foram removidas **${deletedCount}** mensagem(ens) do bot na conversa privada com ${targetUser}.`
    });
  } catch (error) {
    console.error('Erro ao limpar mensagens privadas (DM):', error);
    await interaction.followUp({
      content: `❌ Não foi possível apagar as mensagens na conversa privada com ${targetUser}.`
    });
  }
}
