import {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize
} from 'discord.js';

export const GAMES_LIST = [
  { id: 'outros', name: 'Outros Jogos', emoji: '🎁', envKey: 'GAME_ROLE_GAMERS' },
  { id: 'cs2', name: 'Counter-Strike 2', emoji: '🔫', envKey: 'GAME_ROLE_CS2' },
  { id: 'lol', name: 'League of Legends', emoji: '🔮', envKey: 'GAME_ROLE_LOL' },
  { id: 'valorant', name: 'Valorant', emoji: '🎯', envKey: 'GAME_ROLE_VALORANT' },
  { id: 'rocket', name: 'Rocket League', emoji: '🚗', envKey: 'GAME_ROLE_ROCKET' },
  { id: 'minecraft', name: 'Minecraft', emoji: '⛏️', envKey: 'GAME_ROLE_MINECRAFT' },
  { id: 'amongus', name: 'Among Us', emoji: '👀', envKey: 'GAME_ROLE_AMONGUS' },
  { id: 'eafc', name: 'EA FC / FIFA', emoji: '⚽', envKey: 'GAME_ROLE_EAFC' },
  { id: 'gta', name: 'GTA/FiveM', emoji: '💸', envKey: 'GAME_ROLE_GTA' },
  { id: 'r6', name: 'Rainbow Six', emoji: '💣', envKey: 'GAME_ROLE_R6' },
  { id: 'fort', name: 'Fortnite', emoji: '🧱', envKey: 'GAME_ROLE_FORT' }
];

export function getGameRoleId(gameId) {
  const game = GAMES_LIST.find(g => g.id === gameId);
  if (!game) return null;
  return process.env[game.envKey] || null;
}

export function getGamersGeneralRoleId() {
  return process.env.GAME_ROLE_GAMERS || null;
}

/**
 * Constrói o Container V2 para a mensagem pública do canal de Jogos (/jogos).
 */
export function buildPublicGamesContainer(serverIconUrl = null) {
  const iconUrl = serverIconUrl || 'https://cdn.discordapp.com/embed/avatars/0.png';

  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '# `🎮` Cargos e Canais de Jogos\n' +
        'Clica nos botões abaixo para ativares ou desativares o acesso aos canais dedicados a cada jogo!\n\n' +
        '• **Jogos Disponíveis:**\n' +
        GAMES_LIST.map(g => `  - ${g.emoji} **${g.name}**`).join('\n') + '\n\n' +
        '-# Ao clicares num botão, o cargo e canal respetivo serão alternados instantaneamente.'
      )
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder().setURL(iconUrl)
    );

  const separator1 = new SeparatorBuilder()
    .setDivider(true)
    .setSpacing(SeparatorSpacingSize.Small);

  const gameButtons = GAMES_LIST.map(game =>
    new ButtonBuilder()
      .setCustomId(`game_toggle_${game.id}`)
      .setLabel(game.name)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(game.emoji)
  );

  const actionRows = [];
  for (let i = 0; i < gameButtons.length; i += 4) {
    actionRows.push(new ActionRowBuilder().addComponents(gameButtons.slice(i, i + 4)));
  }

  const suggestText = new TextDisplayBuilder().setContent(
    '### `💡` Sugerir Novo Jogo\n' +
    'Sentes falta de algum jogo na lista? Se achas que há mais comunidade no servidor a jogar, envia-nos a tua sugestão!'
  );

  const suggestButtonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('open_game_suggestion_modal')
      .setLabel('Sugerir Novo Jogo')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('💡')
  );

  return new ContainerBuilder()
    .setAccentColor(0x24242A)
    .addSectionComponents(section)
    .addSeparatorComponents(separator1)
    .addActionRowComponents(...actionRows)
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(suggestText)
    .addActionRowComponents(suggestButtonRow);
}

/**
 * Constrói o Container V2 efémero interativo para o pop-up privado do utilizador.
 */
export function buildEphemeralGamesContainer(member) {
  const activeGames = [];

  const gameButtons = GAMES_LIST.map(game => {
    const roleId = getGameRoleId(game.id)?.trim();
    const isHasRole = roleId && member?.roles?.cache?.has(roleId);

    if (isHasRole) {
      activeGames.push(`${game.emoji} **${game.name}**`);
    }

    return new ButtonBuilder()
      .setCustomId(`game_toggle_${game.id}`)
      .setLabel(game.name)
      .setStyle(isHasRole ? ButtonStyle.Success : ButtonStyle.Secondary)
      .setEmoji(isHasRole ? '🟢' : '⚪');
  });

  const activeListText = activeGames.length > 0
    ? activeGames.map(g => `• ${g}`).join('\n')
    : '*(Nenhum jogo selecionado de momento)*';

  const textDisplay = new TextDisplayBuilder().setContent(
    '# `🎮` Os Teus Cargos de Jogos\n' +
    'Clica nos botões para ativares (`🟢`) ou desativares (`⚪`) o teu acesso aos respetivos canais de jogos em tempo real:\n\n' +
    '• **Os Teus Jogos Ativos:**\n' +
    `${activeListText}`
  );

  const actionRows = [];
  for (let i = 0; i < gameButtons.length; i += 4) {
    actionRows.push(new ActionRowBuilder().addComponents(gameButtons.slice(i, i + 4)));
  }

  return new ContainerBuilder()
    .setAccentColor(0x24242A)
    .addTextDisplayComponents(textDisplay)
    .addActionRowComponents(...actionRows);
}
