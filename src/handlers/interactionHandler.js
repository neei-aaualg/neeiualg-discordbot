import {
  MessageFlags,
  PermissionFlagsBits,
  ChannelType,
  ContainerBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  ThumbnailBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  UserSelectMenuBuilder
} from 'discord.js';

import { COURSE_SUBJECTS, getCourseData, getSubjectName, getRolesForSelectedSubjects } from '../utils/courseSubjects.js';
import { updateMemberWelcomeCard, sendPublicWelcomeCard } from '../utils/welcomeCard.js';
import { GAMES_LIST, getGameRoleId, getGamersGeneralRoleId, buildEphemeralGamesContainer } from '../utils/gamesData.js';
import { createTicketTranscript } from '../utils/transcriptHelper.js';
import { logInteraction, logUnauthorizedAccess } from '../utils/logger.js';
import { prisma } from '../database/prisma.js';

// Armazena temporariamente os dados do processo de verificação em memória (por userId)
const verificationSessions = new Map();

// Armazena temporariamente os dados do processo de abertura de tickets em memória (por userId)
const ticketSessions = new Map();

// Armazena todos os tickets ativos e os respetivos dados de registo, DM e avaliação (por channelId)
const activeTickets = new Map();

// Helper para agrupar botões em linhas de no máximo 5 componentes por ActionRow
function createButtonRows(buttons) {
  const rows = [];
  for (let i = 0; i < buttons.length; i += 5) {
    const chunk = buttons.slice(i, i + 5);
    const row = new ActionRowBuilder().addComponents(...chunk);
    rows.push(row);
  }
  return rows;
}

// Converte os códigos de curso nos respetivos nomes legíveis
export function getCourseName(code) {
  const names = {
    lei: 'LEI - Licenciatura em Engenharia Informática',
    psc: 'PSC - Pós Graduação em CiberSegurança',
    mei: 'MEI - Mestrado em Engenharia Informática',
    outro: 'Outro (não sou dos cursos do NEEI)'
  };
  return names[code] || code || 'Não selecionado';
}

// 1. Constrói o Container de Confirmação Geral de Dados (Passo 1 + Passo 2)
function buildGeneralConfirmationContainer(user, session) {
  const userAvatar = user.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

  const confirmSection = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# \`📋\` Confirmação Geral dos Teus Dados\n` +
        `Por favor, verifica se todas as tuas informações estão corretas:\n\n` +
        `• **Primeiro Nome:** ${session.firstName || 'Não definido'}\n` +
        `• **Apelido:** ${session.lastName || 'Não definido'}\n` +
        `• **Número de Aluno:** ${session.studentNumber || 'Não definido'}\n` +
        `• **Curso Selecionado:** ${getCourseName(session.course)}\n\n` +
        `-# \`📌\` Se precisares de alterar algum dado, clica em **Editar**. Caso esteja tudo correto, clica em **Continuar**.`
      )
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder().setURL(userAvatar)
    );

  const confirmButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('edit_all_data_choice')
      .setLabel('Editar')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('✏️'),
    new ButtonBuilder()
      .setCustomId('continue_verification_step3')
      .setLabel('Continuar')
      .setStyle(ButtonStyle.Success)
      .setEmoji('➡️')
  );

  return new ContainerBuilder()
    .setAccentColor(0x24242A)
    .addSectionComponents(confirmSection)
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
    .addActionRowComponents(confirmButtons);
}

// 2. Constrói o Container de Escolha do que Editar (Modal vs Dropdown vs Cadeiras)
function buildEditChoiceContainer(user, session) {
  const userAvatar = user.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';
  const hasCourseSubjects = session.course && session.course !== 'outro';

  const editChoiceSection = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# \`✏️\` O que pretendes alterar?\n` +
        `Seleciona qual a informação que desejas modificar:\n\n` +
        `• **Dados Pessoais**: Altera o Nome, Apelido e Número de Aluno.\n` +
        `• **Curso**: Altera a tua seleção de curso no menu suspenso.\n` +
        `${hasCourseSubjects ? `• **Cadeiras**: Altera as tuas cadeiras selecionadas.\n\n` : '\n'}` +
        `-# Clica em **Voltar** para manter a confirmação atual.`
      )
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder().setURL(userAvatar)
    );

  const editButtonsArray = [
    new ButtonBuilder()
      .setCustomId('edit_modal_data')
      .setLabel('Editar Dados Pessoais')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('📝'),
    new ButtonBuilder()
      .setCustomId('edit_course_data')
      .setLabel('Editar Curso')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🎓')
  ];

  if (hasCourseSubjects) {
    editButtonsArray.push(
      new ButtonBuilder()
        .setCustomId('edit_subjects_data')
        .setLabel('Editar Cadeiras')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📚')
    );
  }

  editButtonsArray.push(
    new ButtonBuilder()
      .setCustomId('back_to_confirmation')
      .setLabel('Voltar')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('↩️')
  );

  const editButtonRows = createButtonRows(editButtonsArray);

  const editContainer = new ContainerBuilder()
    .setAccentColor(0x24242A)
    .addSectionComponents(editChoiceSection)
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

  for (const row of editButtonRows) {
    editContainer.addActionRowComponents(row);
  }

  return editContainer;
}

// 3. Constrói o Container de Escolha de Curso (Dropdown Menu)
function buildCourseSelectionContainer(user, session) {
  const userAvatar = user.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';
  const selectedCourse = session?.course || null;

  const courseSection = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### Pertences a algum destes cursos?\n` +
        `> LEI - Licenciatura em Engenharia Informática\n` +
        `> PSC - Pós Graduação em CiberSegurança\n` +
        `> MEI - Mestrado em Engenharia Informática\n\n` +
        `Escolhe a opção correta para ti:\n\n` +
        `${selectedCourse ? `• Opção Selecionada: **${getCourseName(selectedCourse)}**\n\n` : ''}` +
        `-# \`⚠️\` Seleciona a tua opção no menu suspenso abaixo e clica em **Continuar**.`
      )
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder().setURL(userAvatar)
    );

  const courseSelectRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('course_select_menu')
      .setPlaceholder('Escolhe a opção de curso que se aplica a ti...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('LEI - Licenciatura em Engenharia Informática')
          .setValue('lei')
          .setDefault(selectedCourse === 'lei')
          .setDescription('Curso de Licenciatura em Eng. Informática')
          .setEmoji('💻'),
        new StringSelectMenuOptionBuilder()
          .setLabel('PSC - Pós Graduação em CiberSegurança')
          .setValue('psc')
          .setDefault(selectedCourse === 'psc')
          .setDescription('Curso de Pós-Graduação em CiberSegurança')
          .setEmoji('🔒'),
        new StringSelectMenuOptionBuilder()
          .setLabel('MEI - Mestrado em Engenharia Informática')
          .setValue('mei')
          .setDefault(selectedCourse === 'mei')
          .setDescription('Curso de Mestrado em Eng. Informática')
          .setEmoji('🎓'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Outro (não sou dos cursos do NEEI)')
          .setValue('outro')
          .setDefault(selectedCourse === 'outro')
          .setDescription('Outros cursos ou visitantes')
          .setEmoji('❌')
      )
  );

  const finishButtonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('submit_course_selection')
      .setLabel('Continuar')
      .setStyle(ButtonStyle.Success)
      .setEmoji('➡️')
  );

  return new ContainerBuilder()
    .setAccentColor(0x24242A)
    .addSectionComponents(courseSection)
    .addActionRowComponents(courseSelectRow)
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
    .addActionRowComponents(finishButtonRow);
}

// 4. Constrói o Container de Seleção de Cadeiras (Passo 3)
function buildSubjectSelectionContainer(user, session) {
  const userAvatar = user.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';
  const courseData = getCourseData(session.course);

  if (!courseData) {
    return buildGeneralConfirmationContainer(user, session);
  }

  // Inicializa o ano selecionado (default: 1º Ano) e conjunto de cadeiras
  if (!session.selectedYear) session.selectedYear = '1';
  if (!session.selectedSubjects) session.selectedSubjects = new Set();

  const container = new ContainerBuilder().setAccentColor(0x24242A);

  // Se o curso tem seleção de ano (LEI ou MEI), adiciona o Dropdown Menu de Ano no topo
  if (courseData.hasYearSelection) {
    const yearSelectRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('year_select_menu')
        .setPlaceholder('Selecione o Ano Letivo para ver as cadeiras...')
        .addOptions(
          courseData.years.map(y =>
            new StringSelectMenuOptionBuilder()
              .setLabel(y.label)
              .setValue(y.id)
              .setDefault(y.id === session.selectedYear)
              .setEmoji('📅')
          )
        )
    );
    container.addActionRowComponents(yearSelectRow);
  } else {
    // Caso PSC (1 único ano), fixa o ano em 1
    session.selectedYear = '1';
  }

  const yearData = courseData.years.find(y => y.id === session.selectedYear) || courseData.years[0];

  // Adiciona as Secções dos 2 Semestres e respetivos botões de cadeiras
  for (const sem of yearData.semesters) {
    const semTitleText = new TextDisplayBuilder().setContent(`### \`📚\` ${sem.label} (${yearData.label})`);

    const allSelected = sem.subjects.every(s => session.selectedSubjects.has(s.id));

    // Botão "Todas as Cadeiras" em destaque numa linha (ActionRow) dedicada no topo
    const allBtn = new ButtonBuilder()
      .setCustomId(`toggle_all_${session.course}_${yearData.id}_${sem.id}`)
      .setLabel(`Todas as Cadeiras (${sem.label})`)
      .setStyle(allSelected ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setEmoji(allSelected ? '⭐' : '📖');

    const allRow = new ActionRowBuilder().addComponents(allBtn);

    // Botões individuais das cadeiras do semestre agrupados em linhas de no máximo 5 botões
    const subjectBtns = sem.subjects.map(sub => {
      const isSel = session.selectedSubjects.has(sub.id);
      return new ButtonBuilder()
        .setCustomId(`toggle_subject_${sub.id}`)
        .setLabel(sub.name)
        .setStyle(isSel ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setEmoji(isSel ? '🟢' : '⚪');
    });

    const subjectRows = createButtonRows(subjectBtns);

    container.addTextDisplayComponents(semTitleText);
    container.addActionRowComponents(allRow);
    for (const row of subjectRows) {
      container.addActionRowComponents(row);
    }
  }

  // Separador e Botão Continuar
  const continueRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('submit_subjects_selection')
      .setLabel('Continuar')
      .setStyle(ButtonStyle.Success)
      .setEmoji('➡️')
  );

  container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  container.addActionRowComponents(continueRow);

  return container;
}

// 5. Constrói o Container de Confirmação Final (Mostra todos os dados recolhidos)
function buildFinalConfirmationContainer(user, session) {
  const userAvatar = user.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

  const selectedSubjectNames = session.selectedSubjects && session.selectedSubjects.size > 0
    ? Array.from(session.selectedSubjects).map(getSubjectName).map(name => `  - ${name}`).join('\n')
    : '  *(Nenhuma cadeira individual selecionada)*';

  const finalConfirmSection = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# \`📋\` Confirmação Final da Tua Verificação\n` +
        `Por favor, confirma se todas as informações e cadeiras escolhidas estão corretas:\n\n` +
        `• **Primeiro Nome:** ${session.firstName || 'Não definido'}\n` +
        `• **Apelido:** ${session.lastName || 'Não definido'}\n` +
        `• **Número de Aluno:** ${session.studentNumber || 'Não definido'}\n` +
        `• **Curso Selecionado:** ${getCourseName(session.course)}\n` +
        `• **Cadeiras Escolhidas:**\n${selectedSubjectNames}\n\n` +
        `-# \`📌\` Se tudo estiver correto, clica em **Concluir Verificação**.`
      )
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder().setURL(userAvatar)
    );

  const finalButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('edit_all_data_choice')
      .setLabel('Editar')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('✏️'),
    new ButtonBuilder()
      .setCustomId('finish_verification_final')
      .setLabel('Concluir Verificação')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅')
  );

  return new ContainerBuilder()
    .setAccentColor(0x24242A)
    .addSectionComponents(finalConfirmSection)
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
    .addActionRowComponents(finalButtons);
}

// 6. Constrói o Container de Seleção de Curso para o Ticket
function buildTicketCourseSelectContainer(user, session) {
  const userAvatar = user.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';
  const selectedCourse = session?.course || null;

  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# \`🎫\` Abertura de Ticket — Seleção do Curso\n` +
        `Por favor, seleciona o teu curso ou o tipo de assunto no menu suspenso abaixo.\n\n` +
        `${selectedCourse ? `• Opção Selecionada: **${getCourseName(selectedCourse)}**\n\n` : ''}` +
        `-# \`📌\` Após selecionares a opção, abrir-se-á o formulário para descreveres o teu problema.`
      )
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder().setURL(userAvatar)
    );

  const selectRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ticket_course_select')
      .setPlaceholder('Escolhe o teu curso ou o tipo de assunto...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('LEI - Licenciatura em Engenharia Informática')
          .setValue('lei')
          .setDefault(selectedCourse === 'lei')
          .setDescription('Dúvidas/Suporte relativo ao curso de LEI')
          .setEmoji('💻'),
        new StringSelectMenuOptionBuilder()
          .setLabel('PSC - Pós Graduação em CiberSegurança')
          .setValue('psc')
          .setDefault(selectedCourse === 'psc')
          .setDescription('Dúvidas/Suporte relativo ao curso de PSC')
          .setEmoji('🔒'),
        new StringSelectMenuOptionBuilder()
          .setLabel('MEI - Mestrado em Engenharia Informática')
          .setValue('mei')
          .setDefault(selectedCourse === 'mei')
          .setDescription('Dúvidas/Suporte relativo ao curso de MEI')
          .setEmoji('🎓'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Outro / Dúvida Geral')
          .setValue('outro')
          .setDefault(selectedCourse === 'outro')
          .setDescription('Outros assuntos, sugestões ou dúvidas gerais')
          .setEmoji('❓')
      )
  );

  return new ContainerBuilder()
    .setAccentColor(0x24242A)
    .addSectionComponents(section)
    .addActionRowComponents(selectRow);
}

// 7. Constrói o Container de Confirmação de Ticket
function buildTicketConfirmationContainer(user, session) {
  const userAvatar = user.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# \`📋\` Confirmação de Abertura de Ticket\n` +
        `Por favor, verifica se todas as informações do teu ticket estão corretas:\n\n` +
        `• **Curso:** ${getCourseName(session.course)}\n\n` +
        `• **Assunto:** ${session.subject || 'Não definido'}\n` +
        `• **Descrição do Problema:**\n${session.description || 'Não definida'}\n\n` +
        `-# \`📌\` Se pretenderes alterar algum dado clica em **Editar**. Para criar o canal do ticket, clica em **Confirmar**.`
      )
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder().setURL(userAvatar)
    );

  const confirmButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_edit_choice')
      .setLabel('Editar')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('✏️'),
    new ButtonBuilder()
      .setCustomId('ticket_confirm')
      .setLabel('Confirmar')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅')
  );

  return new ContainerBuilder()
    .setAccentColor(0x24242A)
    .addSectionComponents(section)
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
    .addActionRowComponents(confirmButtons);
}

// 8. Constrói o Container de Opções de Edição do Ticket
function buildTicketEditChoiceContainer(user, session) {
  const userAvatar = user.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# \`✏️\` O que pretendes alterar no teu ticket?\n` +
        `Seleciona qual a informação que desejas modificar:\n\n` +
        `• **Curso**: Altera a tua seleção de curso.\n` +
        `• **Assunto e Descrição**: Altera o texto do assunto ou do teu problema.\n\n` +
        `-# Clica em **Voltar** para manter a confirmação atual.`
      )
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder().setURL(userAvatar)
    );

  const editButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_edit_course')
      .setLabel('Editar Curso')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🎓'),
    new ButtonBuilder()
      .setCustomId('ticket_edit_modal')
      .setLabel('Editar Assunto / Descrição')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('📝'),
    new ButtonBuilder()
      .setCustomId('ticket_back_to_confirm')
      .setLabel('Voltar')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('↩️')
  );

  return new ContainerBuilder()
    .setAccentColor(0x24242A)
    .addSectionComponents(section)
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
    .addActionRowComponents(editButtons);
}

// 9. Constrói o Container efémero de Sucesso após a Criação do Canal do Ticket
function buildTicketCreatedSuccessContainer(user, ticketChannel, guildId) {
  const userAvatar = user.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';
  const channelUrl = `https://discord.com/channels/${guildId}/${ticketChannel.id}`;

  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# \`✅\` Ticket Criado com Sucesso!\n` +
        `O teu canal privado de atendimento foi criado com sucesso:\n\n` +
        `👉 <#${ticketChannel.id}>\n\n` +
        `-# \`📌\` Clica no botão abaixo ou no canal acima para acederes ao teu ticket.`
      )
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder().setURL(userAvatar)
    );

  const linkButton = new ButtonBuilder()
    .setLabel('Ir para o Ticket')
    .setStyle(ButtonStyle.Link)
    .setURL(channelUrl)
    .setEmoji('💬');

  const buttonRow = new ActionRowBuilder().addComponents(linkButton);

  return new ContainerBuilder()
    .setAccentColor(0x24242A)
    .addSectionComponents(section)
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
    .addActionRowComponents(buttonRow);
}

// 10. Constrói o Container de Boas-Vindas enviado no Canal de Ticket criado
function buildTicketChannelWelcomeContainer(user, session, supportRoleId = null, isAnswered = false) {
  const userAvatar = user.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';
  const supportPing = supportRoleId && supportRoleId.trim() ? `<@&${supportRoleId.trim()}>` : '';
  const authorName = user.displayName || user.username || 'Membro';

  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# \`🎫\` Ticket de Suporte — ${session.subject}\n` +
        `Olá <@${user.id}>! ${supportPing ? `(${supportPing}) ` : ''}Bem-vindo(a) ao teu ticket de suporte privado.\n` +
        `${isAnswered ? '🟢 **Atendimento iniciado pela equipa de suporte.** O chat está aberto!\n\n' : '🔒 **A aguardar o atendimento da equipa de suporte.**\n (Chat temporariamente bloqueado)\n\n'}` +
        `• **Membro:** **${authorName}** (<@${user.id}>)\n` +
        `• **Curso:** ${getCourseName(session.course)}\n\n` +
        `• **Assunto:** ${session.subject}\n` +
        `• **Descrição do Problema:**\n${session.description}\n\n` +
        `-# \`📌\` Se não houver resposta no prazo de 2 dias úteis, o ticket será fechado automaticamente.`
      )
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder().setURL(userAvatar)
    );

  const respondButton = new ButtonBuilder()
    .setCustomId('ticket_respond')
    .setLabel(isAnswered ? 'Em Atendimento' : 'Responder')
    .setStyle(isAnswered ? ButtonStyle.Success : ButtonStyle.Primary)
    .setEmoji(isAnswered ? '🟢' : '💬')
    .setDisabled(isAnswered);

  const buttonRow = new ActionRowBuilder().addComponents(respondButton);

  return new ContainerBuilder()
    .setAccentColor(0x24242A)
    .addSectionComponents(section)
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
    .addActionRowComponents(buttonRow);
}

// 11. Constrói o Container efémero mostrado ao membro da Staff quando clica em Responder ou usa /menu
export function buildTicketStaffResponseEphemeralContainer(staffUser) {
  const staffAvatar = staffUser.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# \`🛠️\` Menu de Controlo da Staff\n` +
        `Painel de gestão de tickets para a equipa de suporte:\n\n` +
        `• **Opções Disponíveis:**\n` +
        `  - **Renomear Canal**: Altera o nome do canal do ticket.\n` +
        `  - **Adicionar Membro**: Dá acesso a um utilizador ao ticket.\n` +
        `  - **Remover Membro**: Remove o acesso de um utilizador.\n` +
        `  - **Atribuir Ticket**: Transfere a gestão do ticket a outro elemento da staff.\n` +
        `  - **Fechar Ticket**: Encerra o ticket e gera o registo de log.\n\n` +
        `-# \`📌\` Podes utilizar o comando /fechar a qualquer momento para encerrar este ticket e gerar o registo.`
      )
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder().setURL(staffAvatar)
    );

  const renameBtn = new ButtonBuilder()
    .setCustomId('ticket_staff_rename')
    .setLabel('Renomear Canal')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('🏷️');

  const addBtn = new ButtonBuilder()
    .setCustomId('ticket_staff_add_user')
    .setLabel('Adicionar Membro')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('➕');

  const removeBtn = new ButtonBuilder()
    .setCustomId('ticket_staff_remove_user')
    .setLabel('Remover Membro')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji('➖');

  const transferBtn = new ButtonBuilder()
    .setCustomId('ticket_staff_transfer')
    .setLabel('Atribuir Ticket')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('🔀');

  const closeBtn = new ButtonBuilder()
    .setCustomId('ticket_close')
    .setLabel('Fechar Ticket')
    .setStyle(ButtonStyle.Danger)
    .setEmoji('🔒');

  const buttonRow = new ActionRowBuilder().addComponents(renameBtn, addBtn, removeBtn, transferBtn, closeBtn);

  const container = new ContainerBuilder()
    .setAccentColor(0x24242A)
    .addSectionComponents(section);

  container.addActionRowComponents(buttonRow);

  return container;
}


// 13. Constrói o Container V2 da mensagem enviada por DM ao Utilizador sobre o seu Ticket
function buildTicketUserDmContainer(ticketData) {
  const user = ticketData?.user || { id: ticketData?.userId || '0', username: 'Membro', tag: 'Membro' };
  const userAvatar = (user && typeof user.displayAvatarURL === 'function')
    ? user.displayAvatarURL({ extension: 'png', size: 256 })
    : 'https://cdn.discordapp.com/embed/avatars/0.png';

  const authorName = ticketData?.member?.displayName || user.displayName || user.username || 'Membro';
  const courseName = ticketData?.session ? getCourseName(ticketData.session.course) : 'Suporte Geral';
  const subject = ticketData?.session?.subject || 'Ticket de Suporte';
  const description = ticketData?.session?.description || 'Atendimento de suporte.';

  let statusText = '🟡 **Aberto (Aguardando Atendimento)**';
  if (ticketData?.answeredBy && !ticketData?.closedBy) {
    statusText = `🟢 **Em Atendimento por <@${ticketData.answeredBy.id}>**`;
  } else if (ticketData?.closedBy) {
    statusText = `🔒 **Fechado por <@${ticketData.closedBy.id}>**`;
  }

  let textContent =
    `# \`🎫\` O teu Ticket de Suporte — ${subject}\n` +
    `• **Canal:** <#${ticketData.channelId}>\n` +
    `• **Membro:** **${authorName}** (<@${user.id}>)\n` +
    `• **Curso:** ${courseName}\n\n` +
    `• **Assunto:** ${subject}\n` +
    `• **Descrição do Problema:**\n${description}\n\n` +
    `• **Estado:** ${statusText}\n` +
    `• **Aberto em:** <t:${ticketData?.createdAt || Math.floor(Date.now() / 1000)}:F>\n`;

  if (ticketData?.closedAt) {
    textContent += `• **Encerrado em:** <t:${ticketData.closedAt}:F>\n`;
  }

  if (ticketData?.transcriptUrl) {
    textContent += `\n\`📄\` **Clica Aqui para ver uma cópia do teu Ticket:**\n**[Descarregar Cópia](${ticketData.transcriptUrl})**\n`;
  }

  if (ticketData?.closedBy) {
    if (ticketData.rating) {
      textContent += `\n\`⭐\` **A Tua Avaliação:** ${ticketData.rating}/5 (${'⭐'.repeat(ticketData.rating)})\n-# Obrigado pelo teu feedback!`;
    } else {
      textContent += `\n\`⭐\` **Avaliação do Atendimento:**\nPor favor, indica de 1 a 5 estrelas como avalias o atendimento recebido:`;
    }
  }

  const section = new SectionBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(textContent))
    .setThumbnailAccessory(new ThumbnailBuilder().setURL(userAvatar));

  const container = new ContainerBuilder()
    .setAccentColor(0x24242A)
    .addSectionComponents(section);

  if (ticketData?.closedBy && !ticketData?.rating) {
    const rateRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`ticket_rate_1_${ticketData.channelId}`).setLabel('1 ⭐').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`ticket_rate_2_${ticketData.channelId}`).setLabel('2 ⭐').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`ticket_rate_3_${ticketData.channelId}`).setLabel('3 ⭐').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`ticket_rate_4_${ticketData.channelId}`).setLabel('4 ⭐').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`ticket_rate_5_${ticketData.channelId}`).setLabel('5 ⭐').setStyle(ButtonStyle.Success)
    );

    container
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
      .addActionRowComponents(rateRow);
  }

  return container;
}

// 14. Constrói o Container V2 enviado para o Canal de Logs da Staff (TICKETS_LOGS_CHANNEL_ID)
function buildTicketLogContainer(ticketData) {
  const user = ticketData?.user || { id: ticketData?.userId || '0', username: 'Membro', tag: 'Membro' };
  const userAvatar = (user && typeof user.displayAvatarURL === 'function')
    ? user.displayAvatarURL({ extension: 'png', size: 256 })
    : 'https://cdn.discordapp.com/embed/avatars/0.png';

  const authorName = ticketData?.member?.displayName || user.displayName || user.username || 'Membro';
  const courseName = ticketData?.session ? getCourseName(ticketData.session.course) : 'Suporte Geral';
  const subject = ticketData?.session?.subject || 'Ticket de Suporte';
  const description = ticketData?.session?.description || 'Atendimento de suporte.';

  let statusText = '🟡 **Aberto (Aguardando Atendimento)**';
  if (ticketData?.answeredBy && !ticketData?.closedBy) {
    statusText = `🟢 **Em Atendimento por <@${ticketData.answeredBy.id}>**`;
  } else if (ticketData?.closedBy) {
    statusText = `🔒 **Fechado por <@${ticketData.closedBy.id}>**`;
  }

  let textContent =
    `# \`🎫\` Registo de Ticket — ${subject}\n` +
    `• **Canal:** <#${ticketData.channelId}>\n` +
    `• **Membro Autor:** **${authorName}** (<@${user.id}> | ID: \`${user.id}\`)\n` +
    `• **Curso:** ${courseName}\n\n` +
    `• **Assunto:** ${subject}\n` +
    `• **Descrição do Problema:**\n${description}\n\n` +
    `• **Estado:** ${statusText}\n` +
    `• **Aberto em:** <t:${ticketData?.createdAt || Math.floor(Date.now() / 1000)}:F>\n`;

  if (ticketData?.closedAt) {
    textContent += `• **Encerrado em:** <t:${ticketData.closedAt}:F>\n`;
  }

  if (ticketData?.closedBy) {
    if (ticketData.transcriptUrl) {
      textContent += `\n\`📄\` **Clica Aqui para ver uma cópia do Ticket:**\n**[Descarregar Cópia](${ticketData.transcriptUrl})**\n\n`;
    }
    const ratingStr = ticketData.rating ? `${ticketData.rating}/5 (${'⭐'.repeat(ticketData.rating)})` : '⏳ A aguardar avaliação do utilizador...';
    textContent += `\`⭐\` **Avaliação do Utilizador:** ${ratingStr}\n`;
  }

  const section = new SectionBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(textContent))
    .setThumbnailAccessory(new ThumbnailBuilder().setURL(userAvatar));

  return new ContainerBuilder()
    .setAccentColor(0x24242A)
    .addSectionComponents(section);
}

export async function handleInteraction(interaction, commands) {
  // Regista a interação no sistema de logs e auditoria
  try {
    let details = '';
    if (interaction.isChatInputCommand()) {
      const options = interaction.options.data.map(opt => `${opt.name}: ${opt.value}`).join(', ');
      details = options ? `Opções: ${options}` : '';
    } else if (interaction.isStringSelectMenu() || interaction.isUserSelectMenu()) {
      details = `Valores Selecionados: ${interaction.values.join(', ')}`;
    }
    logInteraction(interaction, details);
  } catch (logErr) {
    // ignora silenciosamente se o log falhar
  }

  // Trata Comandos de Barra (Slash Commands)
  if (interaction.isChatInputCommand()) {
    const command = commands.get(interaction.commandName);
    if (!command) {
      console.error(`Comando não encontrado: ${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Erro ao executar o comando ${interaction.commandName}:`, error);
      const content = 'Ocorreu um erro ao executar este comando.';
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content, flags: MessageFlags.Ephemeral });
      }
    }
    return;
  }

  // Trata submissões de Modais (Formulários)
  if (interaction.isModalSubmit()) {
    // Passo 1 do Formulário de Verificação (Nome, Apelido, Número de Aluno)
    if (interaction.customId === 'verification_modal') {
      const firstName = interaction.fields.getTextInputValue('user_first_name').trim();
      const lastName = interaction.fields.getTextInputValue('user_last_name').trim();
      const studentNumber = interaction.fields.getTextInputValue('student_number').trim();

      // Validação do Primeiro Nome
      if (!/^\p{L}+$/u.test(firstName)) {
        await interaction.reply({
          content: '❌ **Primeiro Nome inválido!** Deve conter apenas 1 palavra (apenas letras), sem espaços, números ou símbolos.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      // Validação do Apelido
      if (!/^\p{L}+$/u.test(lastName)) {
        await interaction.reply({
          content: '❌ **Apelido inválido!** Deve conter apenas 1 palavra (apenas letras), sem espaços, números ou símbolos.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      // Validação do Número de Aluno
      if (!/^\d{5}$/.test(studentNumber)) {
        await interaction.reply({
          content: '❌ **Número de Aluno inválido!** Deve conter exatamente 5 dígitos numéricos (sem a letra "a" nem caracteres especiais). Exemplo: `75432`.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      // Guarda os dados na sessão do utilizador
      const userId = interaction.user.id;
      const session = verificationSessions.get(userId) || {};
      session.firstName = firstName;
      session.lastName = lastName;
      session.studentNumber = studentNumber;
      if (!session.selectedSubjects) session.selectedSubjects = new Set();
      verificationSessions.set(userId, session);

      const containerToDisplay = session.course
        ? buildGeneralConfirmationContainer(interaction.user, session)
        : buildCourseSelectionContainer(interaction.user, session);

      if (typeof interaction.isFromMessage === 'function' && interaction.isFromMessage()) {
        await interaction.update({
          components: [containerToDisplay],
          flags: MessageFlags.IsComponentsV2
        });
      } else {
        await interaction.reply({
          components: [containerToDisplay],
          flags: MessageFlags.IsComponentsV2
        });
      }
      return;
    }

    // Submissão do Modal de Sugestão de Jogo
    if (interaction.customId === 'game_suggestion_modal') {
      const gameName = interaction.fields.getTextInputValue('game_suggestion_name').trim();
      const gameReason = interaction.fields.getTextInputValue('game_suggestion_reason').trim();

      const targetChannelId = process.env.GAME_SUGGESTIONS_CHANNEL_ID || process.env.VERIFICATION_LOGS_CHANNEL_ID;

      if (targetChannelId && targetChannelId.trim()) {
        try {
          const logChannel = await interaction.client.channels.fetch(targetChannelId.trim()).catch(() => null);
          if (logChannel) {
            const now = Math.floor(Date.now() / 1000);
            const userAvatar = interaction.user.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

            const logSection = new SectionBuilder()
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                  `# \`💡\` Nova Sugestão de Jogo\n\n` +
                  `• **Membro:** <@${interaction.user.id}> (${interaction.user.tag || interaction.user.username})\n` +
                  `• **ID do Utilizador:** \`${interaction.user.id}\`\n` +
                  `• **Nome do Jogo Sugerido:** **${gameName}**\n\n` +
                  `• **Motivo / Justificação:**\n${gameReason}\n\n` +
                  `-# Sugerido em: <t:${now}:F> (<t:${now}:R>)`
                )
              )
              .setThumbnailAccessory(
                new ThumbnailBuilder().setURL(userAvatar)
              );

            const logContainer = new ContainerBuilder()
              .setAccentColor(0x24242A)
              .addSectionComponents(logSection);

            await logChannel.send({
              components: [logContainer],
              flags: MessageFlags.IsComponentsV2
            }).catch(() => console.warn('⚠️ [WARN-003] Erro ao enviar log de sugestão de jogo. Vê DICIONARIO_CONSOLA.md.'));
          }
        } catch (err) {
          console.warn('⚠️ [WARN-003] Canal de sugestão de jogos inacessível. Vê DICIONARIO_CONSOLA.md.');
        }
      }

      await interaction.reply({
        content: `✅ A tua sugestão para o jogo **${gameName}** foi enviada com sucesso à equipa do NEEI! Obrigado pela tua contribuição.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    // Submissão do Modal de Renomear Canal do Ticket
    if (interaction.customId === 'ticket_rename_modal') {
      const newNameInput = interaction.fields.getTextInputValue('ticket_new_channel_name').trim();
      const sanitizedName = newNameInput.toLowerCase().replace(/[^a-z0-9-]/g, '-');

      if (!sanitizedName) {
        await interaction.reply({
          content: '❌ **Nome de canal inválido.** Deve conter letras, números ou hífenes.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      await interaction.channel.setName(sanitizedName).catch(err => console.error('Erro ao renomear canal:', err));

      const renameContainer = new ContainerBuilder()
        .setAccentColor(0x24242A)
        .addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`# \`🏷️\` Canal Renomeado\nO canal foi renomeado para \`#${sanitizedName}\` com sucesso por <@${interaction.user.id}>!`)
            )
            .setThumbnailAccessory(
              new ThumbnailBuilder().setURL(interaction.user.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png')
            )
        );

      await interaction.reply({
        components: [renameContainer],
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
      });
      return;
    }

    // Submissão do Modal do Ticket (Assunto e Descrição)
    if (interaction.customId === 'ticket_modal') {
      const subject = interaction.fields.getTextInputValue('ticket_subject').trim();
      const description = interaction.fields.getTextInputValue('ticket_description').trim();

      const userId = interaction.user.id;
      const session = ticketSessions.get(userId) || {};
      session.subject = subject;
      session.description = description;
      ticketSessions.set(userId, session);

      const confirmationContainer = buildTicketConfirmationContainer(interaction.user, session);

      if (typeof interaction.isFromMessage === 'function' && interaction.isFromMessage()) {
        await interaction.update({
          components: [confirmationContainer],
          flags: MessageFlags.IsComponentsV2
        });
      } else {
        await interaction.reply({
          components: [confirmationContainer],
          flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
        });
      }
      return;
    }
  }

  // Trata interações de Botões do Container
  if (interaction.isButton()) {
    const buttonId = interaction.customId;
    const userId = interaction.user.id;
    const session = verificationSessions.get(userId) || {};
    if (!session.selectedSubjects) session.selectedSubjects = new Set();

    // Respostas específicas para os botões de boas-vindas
    if (buttonId === 'welcome_regras') {
      await interaction.reply({
        content: '📜 **Regras do Servidor:**\n1. Respeita todos os membros.\n2. Mantém o spam e autopromoção fora dos canais gerais.\n3. Utiliza os canais adequados para cada tema.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (buttonId === 'welcome_cargos') {
      await interaction.reply({
        content: '🏷️ Para escolher os teus cargos, consulta o canal de autoroles do servidor!',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (buttonId === 'welcome_chat') {
      await interaction.reply({
        content: '💬 Diz olá no canal de chat geral para começares a interagir com a comunidade!',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    // Botão para copiar o link de convite do servidor
    if (buttonId === 'copy_invite_link') {
      const inviteUrl = process.env.DISCORD_INVITE_URL || 'https://discord.gg/HzBuRFCAb5';
      await interaction.reply({
        content: `📋 **Link de Convite do Servidor (pronto a copiar):**\n\`${inviteUrl}\``,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    // Botão para copiar o link do Ultimate LEI
    if (buttonId === 'copy_ultimate_link') {
      const ultimateUrl = process.env.ULTIMATE_LEI_URL || 'https://www.dropbox.com/';
      await interaction.reply({
        content: `📋 **Link do Ultimate LEI (pronto a copiar):**\n\`${ultimateUrl}\``,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    // Botão para abrir ticket no painel principal
    if (buttonId === 'open_ticket') {
      const ticketSession = ticketSessions.get(userId) || {};
      ticketSessions.set(userId, ticketSession);

      const courseContainer = buildTicketCourseSelectContainer(interaction.user, ticketSession);
      await interaction.reply({
        components: [courseContainer],
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
      });
      return;
    }

    // Botão Editar na confirmação do ticket -> Mostra o menu de escolha de edição
    if (buttonId === 'ticket_edit_choice') {
      const ticketSession = ticketSessions.get(userId) || {};
      const editChoiceContainer = buildTicketEditChoiceContainer(interaction.user, ticketSession);
      await interaction.update({
        components: [editChoiceContainer],
        flags: MessageFlags.IsComponentsV2
      });
      return;
    }

    // Botão Editar Curso no ticket -> Mostra novamente a dropdown do curso
    if (buttonId === 'ticket_edit_course') {
      const ticketSession = ticketSessions.get(userId) || {};
      const courseContainer = buildTicketCourseSelectContainer(interaction.user, ticketSession);
      await interaction.update({
        components: [courseContainer],
        flags: MessageFlags.IsComponentsV2
      });
      return;
    }

    // Botão Editar Assunto/Descrição -> Reabre o modal com os dados existentes
    if (buttonId === 'ticket_edit_modal') {
      const ticketSession = ticketSessions.get(userId) || {};
      const modal = new ModalBuilder()
        .setCustomId('ticket_modal')
        .setTitle('Abertura de Ticket');

      const subjectInput = new TextInputBuilder()
        .setCustomId('ticket_subject')
        .setLabel('Assunto do Ticket')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: Dúvida sobre exames / Inscrição em evento')
        .setMaxLength(100)
        .setRequired(true);

      const descriptionInput = new TextInputBuilder()
        .setCustomId('ticket_description')
        .setLabel('Descrição do Problema')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Descreve em detalhe o teu problema ou dúvida...')
        .setMaxLength(1000)
        .setRequired(true);

      if (ticketSession.subject) subjectInput.setValue(ticketSession.subject);
      if (ticketSession.description) descriptionInput.setValue(ticketSession.description);

      modal.addComponents(
        new ActionRowBuilder().addComponents(subjectInput),
        new ActionRowBuilder().addComponents(descriptionInput)
      );

      await interaction.showModal(modal);
      return;
    }

    // Botão Voltar nas opções de edição do ticket -> Volta à Confirmação do Ticket
    if (buttonId === 'ticket_back_to_confirm') {
      const ticketSession = ticketSessions.get(userId) || {};
      const confirmationContainer = buildTicketConfirmationContainer(interaction.user, ticketSession);
      await interaction.update({
        components: [confirmationContainer],
        flags: MessageFlags.IsComponentsV2
      });
      return;
    }

    // Botão Confirmar na Abertura do Ticket -> Cria o canal privado no Discord
    if (buttonId === 'ticket_confirm') {
      const ticketSession = ticketSessions.get(userId) || {};

      if (!ticketSession.course || !ticketSession.subject || !ticketSession.description) {
        await interaction.reply({
          content: '⚠️ Informações do ticket incompletas. Por favor, preenche todos os campos antes de confirmar.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      await interaction.deferUpdate();

      const guild = interaction.guild;
      if (!guild) {
        await interaction.followUp({ content: '❌ Ocorreu um erro: este comando só pode ser executado num servidor.', flags: MessageFlags.Ephemeral });
        return;
      }

      const categoryId = process.env.TICKETS_CATEGORY_ID;
      const supportRoleId = process.env.TICKETS_SUPPORT_ROLE_ID;
      const logsChannelId = process.env.TICKETS_LOGS_CHANNEL_ID;

      // Sanitiza o nome do canal: ticket-username
      const cleanUsername = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '');
      const channelName = `ticket-${cleanUsername || interaction.user.id.slice(-4)}`;

      // Define as permissões de acesso ao canal (Chat bloqueado para envio de mensagens até a staff responder)
      const permissionOverwrites = [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks
          ],
          deny: [
            PermissionFlagsBits.SendMessages
          ]
        },
        {
          id: interaction.client.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.ManageRoles,
            PermissionFlagsBits.EmbedLinks
          ]
        }
      ];

      // Adiciona o cargo de suporte se configurado no .env (Ver canal, mas sem enviar mensagens inicialmente)
      if (supportRoleId && supportRoleId.trim()) {
        permissionOverwrites.push({
          id: supportRoleId.trim(),
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.ManageChannels
          ],
          deny: [
            PermissionFlagsBits.SendMessages
          ]
        });
      }

      try {
        let parentCategory = null;
        if (categoryId && categoryId.trim()) {
          parentCategory = guild.channels.cache.get(categoryId.trim()) || await guild.channels.fetch(categoryId.trim()).catch(() => null);
        }

        const ticketChannel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: parentCategory ? parentCategory.id : null,
          permissionOverwrites: permissionOverwrites,
          reason: `Ticket criado por ${interaction.user.tag}`
        });

        // Envia a mensagem de boas-vindas no novo canal do ticket
        const welcomeContainer = buildTicketChannelWelcomeContainer(interaction.user, ticketSession, supportRoleId);

        await ticketChannel.send({
          components: [welcomeContainer],
          flags: MessageFlags.IsComponentsV2
        });

        // Cria os dados de rastreio do ticket
        const ticketData = {
          channelId: ticketChannel.id,
          channelName: ticketChannel.name,
          userId: interaction.user.id,
          user: interaction.user,
          session: { ...ticketSession },
          createdAt: Math.floor(Date.now() / 1000),
          answeredBy: null,
          answeredAt: null,
          closedBy: null,
          closedAt: null,
          transcriptUrl: null,
          rating: null,
          dmMessage: null,
          logMessage: null
        };
        activeTickets.set(ticketChannel.id, ticketData);

        // Regista o ticket na Base de Dados PostgreSQL
        try {
          await prisma.ticket.upsert({
            where: { channelId: ticketChannel.id },
            update: {
              creatorId: interaction.user.id,
              creatorTag: interaction.user.tag || interaction.user.username,
              category: ticketSession.course || 'geral',
              status: 'OPEN'
            },
            create: {
              channelId: ticketChannel.id,
              creatorId: interaction.user.id,
              creatorTag: interaction.user.tag || interaction.user.username,
              category: ticketSession.course || 'geral',
              status: 'OPEN'
            }
          });
          console.log(`📀 [BD] Ticket #${ticketChannel.name} (${ticketChannel.id}) registado na Base de Dados!`);
        } catch (dbErr) {
          console.error('❌ [BD] Erro ao criar ticket na base de dados:', dbErr);
        }

        // Edita a mensagem efémera do utilizador informando o sucesso com link para o canal
        const successContainer = buildTicketCreatedSuccessContainer(interaction.user, ticketChannel, guild.id);
        await interaction.editReply({
          components: [successContainer],
          flags: MessageFlags.IsComponentsV2
        });

        // 1. Envia uma mensagem por DM ao utilizador a confirmar a abertura do ticket
        const userDmContainer = buildTicketUserDmContainer(ticketData);
        const userDmMessage = await interaction.user.send({
          components: [userDmContainer],
          flags: MessageFlags.IsComponentsV2
        }).catch(err => console.error('Não foi possível enviar DM ao utilizador:', err));
        if (userDmMessage) ticketData.dmMessage = userDmMessage;

        // 2. Se configurado, envia o registo inicial para o canal de logs de tickets
        if (logsChannelId && logsChannelId.trim()) {
          const logChannel = guild.channels.cache.get(logsChannelId.trim()) || await guild.channels.fetch(logsChannelId.trim()).catch(() => null);
          if (logChannel) {
            const logContainer = buildTicketLogContainer(ticketData);
            const logMsg = await logChannel.send({
              components: [logContainer],
              flags: MessageFlags.IsComponentsV2
            }).catch(() => null);
            if (logMsg) ticketData.logMessage = logMsg;
          }
        }

        // Limpa a sessão temporária de criação
        ticketSessions.delete(interaction.user.id);
      } catch (error) {
        console.error('❌ Erro ao criar canal de ticket:', error);
        await interaction.followUp({
          content: '❌ Não foi possível criar o canal do ticket. Por favor, verifica as permissões do bot e a categoria no `.env`.',
          flags: MessageFlags.Ephemeral
        });
      }
      return;
    }

    // Botão "Responder" no canal do ticket (apenas para membros da equipa de suporte)
    if (buttonId === 'ticket_respond') {
      const supportRoleId = process.env.TICKETS_SUPPORT_ROLE_ID;
      const member = interaction.member;

      const isStaff = (supportRoleId && supportRoleId.trim() && member?.roles?.cache?.has(supportRoleId.trim())) ||
        member?.permissions?.has(PermissionFlagsBits.Administrator);

      if (!isStaff) {
        await interaction.reply({
          content: '⛔ **Apenas membros da equipa de suporte podem responder e abrir o atendimento deste ticket.**',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      // Reconhece o clique no botão imediatamente (< 50ms) para evitar timeout de 3 segundos do Discord
      await interaction.deferUpdate();

      // Atualiza permissões do canal: desbloqueia envio de mensagens para a staff e para o utilizador
      const channel = interaction.channel;
      if (channel) {
        // Desbloqueia o cargo de suporte se existir
        if (supportRoleId && supportRoleId.trim()) {
          await channel.permissionOverwrites.edit(supportRoleId.trim(), {
            SendMessages: true
          }).catch(err => console.error('Erro ao dar permissão de envio ao suporte:', err));
        }

        // Desbloqueia a permissão de envio para o staff individual que clicou
        await channel.permissionOverwrites.edit(interaction.user.id, {
          SendMessages: true
        }).catch(() => null);

        // Desbloqueia a permissão de envio para o utilizador autor do ticket
        const overwrites = channel.permissionOverwrites.cache;
        for (const [id, overwrite] of overwrites) {
          if (id !== interaction.guild.roles.everyone.id && id !== interaction.client.user.id && id !== supportRoleId?.trim() && overwrite.type === 1) { // User overwrite
            await channel.permissionOverwrites.edit(id, {
              SendMessages: true
            }).catch(err => console.error('Erro ao dar permissão de envio ao utilizador:', err));
          }
        }
      }

      // Atualiza o container da mensagem no canal (preservando todos os dados do ticket original)
      const rawContainer = interaction.message?.components?.[0];
      const originalSectionData = rawContainer?.components?.find(c => c.type === 9);
      const originalContent = originalSectionData?.components?.find(c => c.type === 10)?.content;
      const originalAvatarUrl = originalSectionData?.accessory?.url || interaction.guild?.iconURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

      let updatedContent = originalContent;
      if (updatedContent) {
        updatedContent = updatedContent.replace(
          /🔒 \*\*Aguardando atendimento da equipa de suporte\.\*\* \(Chat temporariamente bloqueado\)/g,
          `🟢 **Atendimento iniciado por <@${interaction.user.id}>.** O chat está aberto!`
        );
        if (!updatedContent.includes('2 dias úteis')) {
          updatedContent = updatedContent.replace(
            /-# `📌` .*/g,
            '-# `📌` Se não houver resposta no prazo de 2 dias úteis, o ticket será fechado automaticamente.'
          );
        }
      } else {
        updatedContent = `# \`🎫\` Ticket de Suporte — Em Atendimento\n🟢 **Atendimento iniciado por <@${interaction.user.id}>.** O chat está agora aberto para diálogo!\n\n-# \`📌\` Se não houver resposta no prazo de 2 dias úteis, o ticket será fechado automaticamente.`;
      }

      const updatedSection = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(updatedContent)
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(originalAvatarUrl)
        );

      const updatedButton = new ButtonBuilder()
        .setCustomId('ticket_respond_active')
        .setLabel('Em Atendimento')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🟢')
        .setDisabled(true);

      const updatedRow = new ActionRowBuilder().addComponents(updatedButton);

      const updatedContainer = new ContainerBuilder()
        .setAccentColor(0x24242A)
        .addSectionComponents(updatedSection)
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
        .addActionRowComponents(updatedRow);

      await interaction.editReply({
        components: [updatedContainer],
        flags: MessageFlags.IsComponentsV2
      }).catch(err => console.error('Erro ao atualizar botão no canal do ticket:', err));

      // Atualiza o rastreio do ticket em memória, a DM do utilizador e o canal de logs
      let ticketData = activeTickets.get(interaction.channel.id);
      if (!ticketData) {
        const dbTicket = await prisma.ticket.findUnique({
          where: { channelId: interaction.channel.id }
        }).catch(() => null);

        if (dbTicket) {
          const authorUser = await interaction.client.users.fetch(dbTicket.creatorId).catch(() => null);
          ticketData = {
            channelId: dbTicket.channelId,
            channelName: interaction.channel.name,
            userId: dbTicket.creatorId,
            user: authorUser,
            session: { course: dbTicket.category || 'outro', subject: 'Ticket de Suporte', description: '' },
            createdAt: Math.floor(new Date(dbTicket.createdAt).getTime() / 1000),
            answeredBy: null,
            answeredAt: null,
            closedBy: null,
            closedAt: null,
            transcriptUrl: dbTicket.transcriptUrl,
            rating: dbTicket.rating,
            dmMessage: null,
            logMessage: null
          };
          activeTickets.set(interaction.channel.id, ticketData);
        }
      }

      if (ticketData) {
        ticketData.answeredBy = interaction.user;
        ticketData.answeredAt = Math.floor(Date.now() / 1000);

        if (ticketData.dmMessage) {
          const updatedDmContainer = buildTicketUserDmContainer(ticketData);
          await ticketData.dmMessage.edit({
            components: [updatedDmContainer],
            flags: MessageFlags.IsComponentsV2
          }).catch(err => console.error('Erro ao atualizar DM do utilizador ao responder:', err));
        }

        if (ticketData.logMessage) {
          const updatedLogContainer = buildTicketLogContainer(ticketData);
          await ticketData.logMessage.edit({
            components: [updatedLogContainer],
            flags: MessageFlags.IsComponentsV2
          }).catch(err => console.error('Erro ao atualizar log do ticket ao responder:', err));
        }

        // Atualiza na Base de Dados PostgreSQL
        try {
          await prisma.ticket.updateMany({
            where: { channelId: interaction.channel.id },
            data: {
              status: 'IN_PROGRESS',
              claimedById: interaction.user.id,
              claimedByName: interaction.user.tag || interaction.user.username,
              claimedAt: new Date()
            }
          });
          console.log(`📀 [BD] Ticket #${interaction.channel.name} marcado em atendimento por ${interaction.user.tag}!`);
        } catch (dbErr) {
          console.error('❌ [BD] Erro ao atualizar status do ticket na BD:', dbErr);
        }
      }

      // Envia a notificação efémera com instruções para o elemento da staff
      const ephemeralNoticeContainer = buildTicketStaffResponseEphemeralContainer(interaction.user);
      await interaction.followUp({
        components: [ephemeralNoticeContainer],
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
      }).catch(() => null);
      return;
    }

    // Botão Renomear Canal no menu da staff
    if (buttonId === 'ticket_staff_rename') {
      const modal = new ModalBuilder()
        .setCustomId('ticket_rename_modal')
        .setTitle('Renomear Canal do Ticket');

      const nameInput = new TextInputBuilder()
        .setCustomId('ticket_new_channel_name')
        .setLabel('Novo Nome do Canal')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: ticket-duvida-exame')
        .setValue(interaction.channel?.name || '')
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(nameInput)
      );

      await interaction.showModal(modal);
      return;
    }

    // Botão Adicionar Membro ao Ticket
    if (buttonId === 'ticket_staff_add_user') {
      const userSelectRow = new ActionRowBuilder().addComponents(
        new UserSelectMenuBuilder()
          .setCustomId('ticket_add_user_select')
          .setPlaceholder('Seleciona o membro a adicionar ao ticket...')
      );

      const addContainer = new ContainerBuilder()
        .setAccentColor(0x24242A)
        .addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent('# `➕` Adicionar Membro ao Ticket\nSeleciona o utilizador que desejas adicionar a este canal no menu suspenso abaixo:')
            )
            .setThumbnailAccessory(
              new ThumbnailBuilder().setURL(interaction.user.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png')
            )
        )
        .addActionRowComponents(userSelectRow);

      await interaction.reply({
        components: [addContainer],
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
      });
      return;
    }

    // Botão Remover Membro do Ticket
    if (buttonId === 'ticket_staff_remove_user') {
      const userSelectRow = new ActionRowBuilder().addComponents(
        new UserSelectMenuBuilder()
          .setCustomId('ticket_remove_user_select')
          .setPlaceholder('Seleciona o membro a remover do ticket...')
      );

      const removeContainer = new ContainerBuilder()
        .setAccentColor(0x24242A)
        .addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent('# `➖` Remover Membro do Ticket\nSeleciona o utilizador que desejas remover deste canal no menu suspenso abaixo:')
            )
            .setThumbnailAccessory(
              new ThumbnailBuilder().setURL(interaction.user.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png')
            )
        )
        .addActionRowComponents(userSelectRow);

      await interaction.reply({
        components: [removeContainer],
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
      });
      return;
    }

    // Botão Atribuir Ticket a outro elemento da Staff
    if (buttonId === 'ticket_staff_transfer') {
      const userSelectRow = new ActionRowBuilder().addComponents(
        new UserSelectMenuBuilder()
          .setCustomId('ticket_transfer_user_select')
          .setPlaceholder('Seleciona o membro da staff a quem atribuir o ticket...')
      );

      const transferContainer = new ContainerBuilder()
        .setAccentColor(0x24242A)
        .addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent('# `🔀` Atribuir Ticket\nSeleciona o elemento da staff a quem desejas atribuir a gestão deste ticket:')
            )
            .setThumbnailAccessory(
              new ThumbnailBuilder().setURL(interaction.user.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png')
            )
        )
        .addActionRowComponents(userSelectRow);

      await interaction.reply({
        components: [transferContainer],
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
      });
      return;
    }

    // Botão Fechar Ticket (no canal do ticket)
    if (buttonId === 'ticket_close') {
      const userAvatar = interaction.user.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

      const confirmSection = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `# \`🔒\` Fechar e Eliminar Ticket\n` +
            `Tens a certeza que pretendes fechar e apagar permanentemente este canal de ticket?\n\n` +
            `-# \`⚠️\` Esta ação não pode ser desfeita.`
          )
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(userAvatar)
        );

      const closeButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_confirm_close')
          .setLabel('Confirmar')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🗑️'),
        new ButtonBuilder()
          .setCustomId('ticket_cancel_close')
          .setLabel('Cancelar')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('❌')
      );

      const confirmContainer = new ContainerBuilder()
        .setAccentColor(0x24242A)
        .addSectionComponents(confirmSection)
        .addActionRowComponents(closeButtons);

      await interaction.reply({
        components: [confirmContainer],
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
      });
      return;
    }

    // Botão Cancelar Fechamento do Ticket
    if (buttonId === 'ticket_cancel_close') {
      const userAvatar = interaction.user.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

      const cancelContainer = new ContainerBuilder()
        .setAccentColor(0x24242A)
        .addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent('✅ **O encerramento do ticket foi cancelado.**')
            )
            .setThumbnailAccessory(
              new ThumbnailBuilder().setURL(userAvatar)
            )
        );

      await interaction.update({
        components: [cancelContainer],
        flags: MessageFlags.IsComponentsV2
      });
      return;
    }

    // Botão Confirmar Fecho do Ticket
    if (buttonId === 'ticket_confirm_close') {
      const userAvatar = interaction.user.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

      const closingContainer = new ContainerBuilder()
        .setAccentColor(0x24242A)
        .addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent('🔒 **Este ticket será encerrado e eliminado dentro de 5 segundos...**')
            )
            .setThumbnailAccessory(
              new ThumbnailBuilder().setURL(userAvatar)
            )
        );

      await interaction.update({
        components: [closingContainer],
        flags: MessageFlags.IsComponentsV2
      }).catch(() => null);

      try {
        // Obtém ou inicializa os dados do ticket
        let ticketData = activeTickets.get(interaction.channel.id);
        if (!ticketData) {
          // Tenta carregar primeiro os dados originais da Base de Dados PostgreSQL
          const dbTicket = await prisma.ticket.findUnique({
            where: { channelId: interaction.channel.id }
          }).catch(() => null);

          if (dbTicket) {
            const authorUser = await interaction.client.users.fetch(dbTicket.creatorId).catch(() => null);
            ticketData = {
              channelId: dbTicket.channelId,
              channelName: interaction.channel.name,
              userId: dbTicket.creatorId,
              user: authorUser,
              session: { course: dbTicket.category || 'outro', subject: 'Ticket de Suporte', description: 'Atendimento encerrado.' },
              createdAt: Math.floor(new Date(dbTicket.createdAt).getTime() / 1000),
              answeredBy: dbTicket.claimedById ? { id: dbTicket.claimedById, tag: dbTicket.claimedByName } : null,
              answeredAt: dbTicket.claimedAt ? Math.floor(new Date(dbTicket.claimedAt).getTime() / 1000) : null,
              closedBy: interaction.user,
              closedAt: Math.floor(Date.now() / 1000),
              transcriptUrl: null,
              rating: null,
              dmMessage: null,
              logMessage: null
            };
            activeTickets.set(interaction.channel.id, ticketData);
          }
        }

        if (!ticketData) {
          // Identifica o autor do ticket através das permissões do canal
          let authorUser = null;
          const overwrites = interaction.channel?.permissionOverwrites?.cache;
          if (overwrites) {
            for (const [id, overwrite] of overwrites) {
              if (overwrite.type === 1 && id !== interaction.client.user.id && id !== interaction.guild?.roles?.everyone?.id && id !== process.env.TICKETS_SUPPORT_ROLE_ID?.trim()) {
                authorUser = await interaction.client.users.fetch(id).catch(() => null);
                if (authorUser) break;
              }
            }
          }

          const targetUser = authorUser || interaction.user;
          ticketData = {
            channelId: interaction.channel.id,
            channelName: interaction.channel.name,
            userId: targetUser.id,
            user: targetUser,
            session: { course: 'outro', subject: 'Ticket de Suporte', description: 'Atendimento encerrado.' },
            createdAt: Math.floor(Date.now() / 1000),
            answeredBy: interaction.user,
            answeredAt: Math.floor(Date.now() / 1000),
            closedBy: interaction.user,
            closedAt: Math.floor(Date.now() / 1000),
            transcriptUrl: null,
            rating: null,
            dmMessage: null,
            logMessage: null
          };
          activeTickets.set(interaction.channel.id, ticketData);
        } else {
          ticketData.closedBy = interaction.user;
          ticketData.closedAt = Math.floor(Date.now() / 1000);
        }

        // 1. Gera a transcrição visual em HTML do canal do ticket
        let transcriptAttachment = null;
        try {
          transcriptAttachment = await createTicketTranscript(interaction.channel);
        } catch (tErr) {
          console.error('Erro ao gerar transcript HTML do ticket:', tErr);
        }

        // 2. Obtém os canais de armazenamento de transcrições e de logs da staff
        const transcriptsChannelId = process.env.TICKETS_TRANSCRIPTS_CHANNEL_ID?.trim() || process.env.TICKETS_LOGS_CHANNEL_ID?.trim();
        const logsChannelId = process.env.TICKETS_LOGS_CHANNEL_ID?.trim();

        let transcriptsChannel = null;
        if (transcriptsChannelId && interaction.guild) {
          transcriptsChannel = interaction.guild.channels.cache.get(transcriptsChannelId) || await interaction.guild.channels.fetch(transcriptsChannelId).catch(() => null);
        }

        let logChannel = null;
        if (logsChannelId && interaction.guild) {
          logChannel = interaction.guild.channels.cache.get(logsChannelId) || await interaction.guild.channels.fetch(logsChannelId).catch(() => null);
        }

        // 3. Envia o ficheiro HTML para o canal exclusivo de transcrições e guarda a URL do anexo
        if (transcriptsChannel && transcriptAttachment) {
          const authorMention = `<@${ticketData.userId}>`;
          const answeredMention = ticketData.answeredBy ? `<@${ticketData.answeredBy.id}>` : 'Ninguém';
          const createdAtTimestamp = `<t:${ticketData.createdAt || Math.floor(Date.now() / 1000)}:F>`;

          const transcriptContent =
            `📄 **Ficheiro de Transcrição HTML do Ticket \`#${interaction.channel.name}\`**\n` +
            `• **Aberto por:** ${authorMention}\n` +
            `• **Atendido por:** ${answeredMention}\n` +
            `• **Aberto em:** ${createdAtTimestamp}`;

          const transcriptMsg = await transcriptsChannel.send({
            content: transcriptContent,
            files: [transcriptAttachment]
          }).catch(err => console.error('Erro ao enviar ficheiro HTML para o canal de transcrições:', err));

          const transcriptUrl = transcriptMsg?.attachments?.first()?.url || transcriptMsg?.url || null;
          ticketData.transcriptUrl = transcriptUrl;
        }

        // 4. Atualiza ou envia o registo de log no canal de logs da staff (contendo o link para a transcrição)
        if (logChannel) {
          const finalLogContainer = buildTicketLogContainer(ticketData);
          if (ticketData.logMessage) {
            await ticketData.logMessage.edit({
              components: [finalLogContainer],
              flags: MessageFlags.IsComponentsV2
            }).catch(() => null);
          } else {
            const newLogMsg = await logChannel.send({
              components: [finalLogContainer],
              flags: MessageFlags.IsComponentsV2
            }).catch(() => null);
            if (newLogMsg) ticketData.logMessage = newLogMsg;
          }
        }

        // 5. Envia o container V2 por mensagem privada (DM) ao criador do ticket com a hiperligação para o ficheiro HTML
        const finalDmContainer = buildTicketUserDmContainer(ticketData);
        let dmSentSuccessfully = false;

        if (ticketData.user) {
          try {
            if (ticketData.dmMessage) {
              await ticketData.dmMessage.edit({
                components: [finalDmContainer],
                flags: MessageFlags.IsComponentsV2
              }).catch(() => null);
              dmSentSuccessfully = true;
            } else {
              const newDm = await ticketData.user.send({
                components: [finalDmContainer],
                flags: MessageFlags.IsComponentsV2
              });
              if (newDm) {
                ticketData.dmMessage = newDm;
                dmSentSuccessfully = true;
              }
            }
          } catch (dmErr) {
            console.warn(`[Ticket DM Warning] Não foi possível enviar a DM ao utilizador (${ticketData.userId}):`, dmErr.message || dmErr);
            dmSentSuccessfully = false;
          }
        }

        // Caso a DM não tenha sido entregue (DM bloqueada), notifica no canal de logs da staff sem crashar o bot
        if (!dmSentSuccessfully && logChannel) {
          await logChannel.send({
            content: `⚠️ **Aviso:** Não foi possível enviar a notificação por DM ao utilizador <@${ticketData.userId}> (DMs bloqueadas ou utilizador indisponível).`
          }).catch(() => null);
        }

        // 6. Atualiza ou cria o registo de encerramento na Base de Dados PostgreSQL
        try {
          await prisma.ticket.upsert({
            where: { channelId: interaction.channel.id },
            update: {
              status: 'CLOSED',
              closedById: interaction.user.id,
              closedByName: interaction.user.tag || interaction.user.username,
              closedAt: new Date(),
              transcriptUrl: ticketData.transcriptUrl || null,
              ...(ticketData.answeredBy ? {
                claimedById: ticketData.answeredBy.id,
                claimedByName: ticketData.answeredBy.tag || ticketData.answeredBy.username,
                claimedAt: ticketData.answeredAt ? new Date(ticketData.answeredAt * 1000) : new Date()
              } : {})
            },
            create: {
              channelId: interaction.channel.id,
              creatorId: ticketData.userId,
              creatorTag: ticketData.user?.tag || ticketData.user?.username || null,
              category: ticketData.session?.course || 'geral',
              status: 'CLOSED',
              closedById: interaction.user.id,
              closedByName: interaction.user.tag || interaction.user.username,
              closedAt: new Date(),
              transcriptUrl: ticketData.transcriptUrl || null
            }
          });
          console.log(`📀 [BD] Ticket #${interaction.channel.name} registado como FECHADO na Base de Dados!`);
        } catch (dbErr) {
          console.error('❌ [BD] Erro ao atualizar fecho do ticket na BD:', dbErr);
        }
      } catch (err) {
        console.error('Erro durante o fecho do ticket:', err);
      }

      setTimeout(() => {
        if (interaction.channel) {
          interaction.channel.delete('Ticket encerrado').catch(err => console.error('Erro ao eliminar canal de ticket:', err));
        }
      }, 5000);
      return;
    }

    // Botões de Avaliação do Atendimento pelo Utilizador (1 a 5 Estrelas enviadas por DM)
    if (buttonId.startsWith('ticket_rate_')) {
      const parts = buttonId.split('_');
      const stars = parseInt(parts[2], 10);
      const channelId = parts.slice(3).join('_');

      let ticketData = activeTickets.get(channelId);
      if (!ticketData) {
        for (const tData of activeTickets.values()) {
          if (tData.dmMessage?.id === interaction.message?.id) {
            ticketData = tData;
            break;
          }
        }
      }

      if (ticketData) {
        ticketData.rating = stars;
      }

      const tempTicketData = ticketData || {
        userId: interaction.user.id,
        user: interaction.user,
        session: { course: 'outro', subject: 'Ticket de Suporte', description: '' },
        createdAt: Math.floor(Date.now() / 1000),
        answeredBy: interaction.user,
        closedBy: interaction.user,
        rating: stars
      };

      // 1. Atualiza a mensagem na DM do utilizador removendo os botões de avaliação
      const ratedDmContainer = buildTicketUserDmContainer(tempTicketData);
      await interaction.update({
        components: [ratedDmContainer],
        flags: MessageFlags.IsComponentsV2
      });

      // 2. Atualiza o container no canal de logs da staff com a pontuação atribuída
      if (tempTicketData.logMessage) {
        const updatedLogContainer = buildTicketLogContainer(tempTicketData);
        await tempTicketData.logMessage.edit({
          components: [updatedLogContainer],
          flags: MessageFlags.IsComponentsV2
        }).catch(err => console.error('Erro ao atualizar avaliação no canal de logs:', err));
      } else {
        const logsChannelId = process.env.TICKETS_LOGS_CHANNEL_ID;
        if (logsChannelId && logsChannelId.trim() && interaction.guild) {
          const logChannel = interaction.guild.channels.cache.get(logsChannelId.trim()) || await interaction.guild.channels.fetch(logsChannelId.trim()).catch(() => null);
          if (logChannel) {
            const updatedLogContainer = buildTicketLogContainer(tempTicketData);
            await logChannel.send({
              components: [updatedLogContainer],
              flags: MessageFlags.IsComponentsV2
            }).catch(() => null);
          }
        }
      }

      // 3. Atualiza a avaliação na Base de Dados PostgreSQL
      const targetChannelId = tempTicketData?.channelId || channelId;
      if (targetChannelId) {
        try {
          await prisma.ticket.updateMany({
            where: { channelId: targetChannelId },
            data: { rating: stars }
          });
          console.log(`📀 [BD] Avaliação de ${stars} estrelas registada para o ticket ${targetChannelId}!`);
        } catch (dbErr) {
          console.error('❌ [BD] Erro ao guardar avaliação na BD:', dbErr);
        }
      }
      return;
    }

    // Botão para abrir o modal de sugestão de novo jogo
    if (buttonId === 'open_game_suggestion_modal') {
      const modal = new ModalBuilder()
        .setCustomId('game_suggestion_modal')
        .setTitle('Sugerir Novo Jogo');

      const nameInput = new TextInputBuilder()
        .setCustomId('game_suggestion_name')
        .setLabel('Nome do Jogo')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: Apex Legends, Dead by Daylight...')
        .setRequired(true);

      const reasonInput = new TextInputBuilder()
        .setCustomId('game_suggestion_reason')
        .setLabel('Porquê criar uma sala/cargo para este jogo?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Explica por que achas que o jogo deve ser adicionado e se há mais comunidade a jogar...')
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(nameInput),
        new ActionRowBuilder().addComponents(reasonInput)
      );

      await interaction.showModal(modal);
      return;
    }

    // Alternar cargo de jogo (game_toggle_<gameId>)
    if (buttonId.startsWith('game_toggle_')) {
      const gameId = buttonId.replace('game_toggle_', '');
      const game = GAMES_LIST.find(g => g.id === gameId);

      if (!game) {
        await interaction.reply({ content: '❌ Jogo não encontrado.', flags: MessageFlags.Ephemeral });
        return;
      }

      const roleId = getGameRoleId(gameId);
      if (!roleId || !roleId.trim()) {
        await interaction.reply({
          content: `⚠️ O cargo para o jogo **${game.name}** ainda não está configurado no \`.env\` (variável \`${game.envKey}\`).`,
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      if (!interaction.inGuild()) {
        await interaction.reply({ content: '❌ Este comando apenas funciona dentro do servidor.', flags: MessageFlags.Ephemeral });
        return;
      }

      const member = interaction.member;
      const gamersRoleId = getGamersGeneralRoleId()?.trim();

      if (member.roles.cache.has(roleId.trim())) {
        // Remover cargo do jogo específico
        await member.roles.remove(roleId.trim()).catch(err => {
          console.warn(`⚠️ [WARN-002] Erro ao remover cargo do jogo ${game.name}:`, err.message);
        });

        // Remove a preferência de jogo na Base de Dados
        await prisma.gamePreference.deleteMany({
          where: { discordId: member.id, gameId }
        }).catch(() => null);

        // Verificar se ainda tem algum outro cargo de jogo específico ativo
        const remainingGameRoles = GAMES_LIST
          .map(g => getGameRoleId(g.id)?.trim())
          .filter(r => r && r !== roleId.trim() && r !== gamersRoleId);

        const hasOtherGame = remainingGameRoles.some(rId => member.roles.cache.has(rId));

        // Se já não tiver nenhum jogo ativo, remove também o cargo geral Gamers
        if (!hasOtherGame && gamersRoleId && member.roles.cache.has(gamersRoleId)) {
          await member.roles.remove(gamersRoleId).catch(err => {
            console.warn(`⚠️ [WARN-002] Erro ao remover cargo geral Gamers:`, err.message);
          });
        }
      } else {
        // Adicionar cargo do jogo específico
        await member.roles.add(roleId.trim()).catch(err => {
          console.warn(`⚠️ [WARN-002] Erro ao adicionar cargo do jogo ${game.name}:`, err.message);
        });

        // Regista a preferência de jogo na Base de Dados
        await prisma.gamePreference.upsert({
          where: { discordId_gameId: { discordId: member.id, gameId } },
          create: { discordId: member.id, gameId },
          update: {}
        }).catch(() => null);

        // Garantir que também recebe o cargo geral Gamers
        if (gamersRoleId && !member.roles.cache.has(gamersRoleId)) {
          await member.roles.add(gamersRoleId).catch(err => {
            console.warn(`⚠️ [WARN-002] Erro ao adicionar cargo geral Gamers:`, err.message);
          });
        }
      }

      // Constrói o container efémero interativo com os botões atualizados em tempo real (🟢 / ⚪)
      const ephemeralContainer = buildEphemeralGamesContainer(member);

      // Se a interação veio de uma mensagem efémera existente, edita-a em tempo real (0ms delay)
      if (interaction.message?.flags?.has(MessageFlags.Ephemeral)) {
        await interaction.update({
          components: [ephemeralContainer],
          flags: MessageFlags.IsComponentsV2
        }).catch(() => null);
      } else {
        // Se a interação foi clicada na mensagem pública, responde com a nova mensagem efémera interativa
        await interaction.reply({
          components: [ephemeralContainer],
          flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
        }).catch(err => {
          console.warn('⚠️ Erro ao enviar painel efémero interativo de jogos:', err.message);
        });
      }
      return;
      return;
    }

    // Botão de Verificação no servidor -> Envia a DM
    if (buttonId === 'verify_member') {
      const verifiedRoleId = process.env.VERIFIED_ROLE_ID;

      if (interaction.inGuild() && verifiedRoleId && interaction.member?.roles?.cache?.has(verifiedRoleId)) {
        await interaction.reply({
          content: 'ℹ️ Já te encontras verificado no servidor!',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const userAvatar = interaction.user.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

      const dmSection = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `# \`🔐\` Processo de Verificação\n` +
            `Olá <@${interaction.user.id}>! Clica no botão abaixo para iniciares a tua verificação no servidor.`
          )
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(userAvatar)
        );

      const dmSeparator = new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(SeparatorSpacingSize.Small);

      const dmButtonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('start_verification_dm')
          .setLabel('Iniciar Verificação')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🚀')
      );

      const dmContainer = new ContainerBuilder()
        .setAccentColor(0x24242A)
        .addSectionComponents(dmSection)
        .addSeparatorComponents(dmSeparator)
        .addActionRowComponents(dmButtonRow);

      try {
        await interaction.user.send({
          components: [dmContainer],
          flags: MessageFlags.IsComponentsV2
        });

        await interaction.followUp({
          content: '📩 Enviei-te uma mensagem privada! Faz o resto do setup nas tuas DM\'s.'
        });
      } catch (error) {
        console.warn(`⚠️ Não foi possível enviar DM para ${interaction.user.tag}:`, error.message || error);
        await interaction.followUp({
          content: '❌ Não foi possível enviar-te uma mensagem privada (DM). Por favor, ativa as mensagens privadas nas definições do servidor e tenta novamente.'
        });
      }
      return;
    }

    // Botão de Iniciar Verificação OU Editar Dados Pessoais
    if (buttonId === 'start_verification_dm' || buttonId === 'edit_modal_data') {
      // Se não tiver sessão em memória, tenta recuperar os dados anteriores da base de dados
      if (!session.firstName) {
        const existingStudent = await prisma.student.findUnique({
          where: { discordId: userId }
        }).catch(() => null);

        if (existingStudent) {
          session.firstName = existingStudent.firstName;
          session.lastName = existingStudent.lastName;
          session.studentNumber = existingStudent.studentNumber;
          if (!session.course) session.course = existingStudent.course;
          if (!session.selectedSubjects || session.selectedSubjects.size === 0) {
            session.selectedSubjects = new Set(existingStudent.subjects || []);
          }
          verificationSessions.set(userId, session);
        }
      }

      const modal = new ModalBuilder()
        .setCustomId('verification_modal')
        .setTitle('Formulário de Verificação');

      const firstNameInput = new TextInputBuilder()
        .setCustomId('user_first_name')
        .setLabel('Primeiro Nome')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: João')
        .setRequired(true);

      const lastNameInput = new TextInputBuilder()
        .setCustomId('user_last_name')
        .setLabel('Apelido')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: Silva')
        .setRequired(true);

      const studentNumberInput = new TextInputBuilder()
        .setCustomId('student_number')
        .setLabel('Número de Aluno')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: 75432 (5 dígitos numéricos)')
        .setMinLength(5)
        .setMaxLength(5)
        .setRequired(true);

      if (session.firstName) firstNameInput.setValue(session.firstName);
      if (session.lastName) lastNameInput.setValue(session.lastName);
      if (session.studentNumber) studentNumberInput.setValue(session.studentNumber);

      modal.addComponents(
        new ActionRowBuilder().addComponents(firstNameInput),
        new ActionRowBuilder().addComponents(lastNameInput),
        new ActionRowBuilder().addComponents(studentNumberInput)
      );

      await interaction.showModal(modal);
      return;
    }

    // Botão "Continuar" após escolher o curso no Dropdown -> Leva para a Confirmação Geral
    if (buttonId === 'submit_course_selection') {
      if (!session.course) {
        await interaction.reply({
          content: '⚠️ Por favor, escolhe uma das opções no menu suspenso antes de clicares em **Continuar**.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      const generalContainer = buildGeneralConfirmationContainer(interaction.user, session);
      await interaction.update({
        components: [generalContainer],
        flags: MessageFlags.IsComponentsV2
      });
      return;
    }

    // Botão "Editar" na Confirmação Geral -> Mostra opções de edição
    if (buttonId === 'edit_all_data_choice') {
      const editChoiceContainer = buildEditChoiceContainer(interaction.user, session);
      await interaction.update({
        components: [editChoiceContainer],
        flags: MessageFlags.IsComponentsV2
      });
      return;
    }

    // Botão "Editar Curso" dentro das opções de edição
    if (buttonId === 'edit_course_data') {
      const courseContainer = buildCourseSelectionContainer(interaction.user, session);
      await interaction.update({
        components: [courseContainer],
        flags: MessageFlags.IsComponentsV2
      });
      return;
    }

    // Botão "Editar Cadeiras" dentro das opções de edição
    if (buttonId === 'edit_subjects_data') {
      const subjectsContainer = buildSubjectSelectionContainer(interaction.user, session);
      await interaction.update({
        components: [subjectsContainer],
        flags: MessageFlags.IsComponentsV2
      });
      return;
    }

    // Botão "Voltar" dentro das opções de edição -> Regressa à Confirmação Geral
    if (buttonId === 'back_to_confirmation') {
      const generalContainer = buildGeneralConfirmationContainer(interaction.user, session);
      await interaction.update({
        components: [generalContainer],
        flags: MessageFlags.IsComponentsV2
      });
      return;
    }

    // Botão "Continuar" na Confirmação Geral -> Se for "outro", vai para a confirmação final. Se for curso com cadeiras, vai para o Passo 3.
    if (buttonId === 'continue_verification_step3') {
      if (session.course === 'outro') {
        const finalContainer = buildFinalConfirmationContainer(interaction.user, session);
        await interaction.update({
          components: [finalContainer],
          flags: MessageFlags.IsComponentsV2
        });
        return;
      }

      const subjectsContainer = buildSubjectSelectionContainer(interaction.user, session);
      await interaction.update({
        components: [subjectsContainer],
        flags: MessageFlags.IsComponentsV2
      });
      return;
    }

    // Botão de alternar uma cadeira individual (toggle)
    if (buttonId.startsWith('toggle_subject_')) {
      const subjectId = buttonId.replace('toggle_subject_', '');

      if (session.selectedSubjects.has(subjectId)) {
        session.selectedSubjects.delete(subjectId);
      } else {
        session.selectedSubjects.add(subjectId);
      }
      verificationSessions.set(userId, session);

      const subjectsContainer = buildSubjectSelectionContainer(interaction.user, session);
      await interaction.update({
        components: [subjectsContainer],
        flags: MessageFlags.IsComponentsV2
      });
      return;
    }

    // Botão "Todas as Cadeiras" do semestre (toggle all)
    if (buttonId.startsWith('toggle_all_')) {
      // Formato: toggle_all_{course}_{yearId}_{semId}
      const parts = buttonId.split('_'); // ['toggle', 'all', course, yearId, semId]
      const courseCode = parts[2];
      const yearId = parts[3];
      const semId = parts[4];

      const courseData = getCourseData(courseCode);
      if (courseData) {
        const yearObj = courseData.years.find(y => y.id === yearId);
        if (yearObj) {
          const semObj = yearObj.semesters.find(s => s.id === semId);
          if (semObj) {
            const allSelected = semObj.subjects.every(s => session.selectedSubjects.has(s.id));
            if (allSelected) {
              // Se todas já estavam selecionadas, remove todas deste semestre
              semObj.subjects.forEach(s => session.selectedSubjects.delete(s.id));
            } else {
              // Adiciona todas deste semestre
              semObj.subjects.forEach(s => session.selectedSubjects.add(s.id));
            }
            verificationSessions.set(userId, session);
          }
        }
      }

      const subjectsContainer = buildSubjectSelectionContainer(interaction.user, session);
      await interaction.update({
        components: [subjectsContainer],
        flags: MessageFlags.IsComponentsV2
      });
      return;
    }

    // Botão "Continuar" após a seleção de cadeiras -> Vai para a Confirmação Final
    if (buttonId === 'submit_subjects_selection') {
      const finalContainer = buildFinalConfirmationContainer(interaction.user, session);
      await interaction.update({
        components: [finalContainer],
        flags: MessageFlags.IsComponentsV2
      });
      return;
    }

    // Botão "Concluir Verificação" Final -> Atribui todos os cargos (Curso, Anos, Semestres, Cadeiras e Verificado) em lote no final
    if (buttonId === 'finish_verification_final') {
      const roleEnvMap = {
        lei: process.env.LEI_ROLE_ID,
        psc: process.env.PSC_ROLE_ID,
        mei: process.env.MEI_ROLE_ID,
        outro: process.env.OUTRO_ROLE_ID
      };

      const rolesToAssign = new Set();

      // 1. Cargo para 'Outro' (se configurado)
      if (session.course === 'outro') {
        const outroRoleId = process.env.OUTRO_ROLE_ID;
        if (outroRoleId && outroRoleId.trim()) rolesToAssign.add(outroRoleId.trim());
      }

      // 2. Cargo de Verificação (se configurado)
      const verifiedRoleId = process.env.VERIFIED_ROLE_ID;
      if (verifiedRoleId && verifiedRoleId.trim()) rolesToAssign.add(verifiedRoleId.trim());

      // 3. Cargos do Curso, Anos, Semestres e Cadeiras Selecionadas (deduzidos de courseSubjects.js apenas se houver pelo menos 1 cadeira selecionada)
      const subjectRoleIds = getRolesForSelectedSubjects(session.course, session.selectedSubjects);
      for (const rId of subjectRoleIds) {
        if (rId && rId.trim()) rolesToAssign.add(rId.trim());
      }

      const guildId = process.env.GUILD_ID;
      if (guildId) {
        try {
          const guild = await interaction.client.guilds.fetch(guildId).catch(() => null);
          if (guild) {
            const member = await guild.members.fetch(interaction.user.id).catch(() => null);
            if (member) {
              // 1. Altera a alcunha (nickname) do membro no servidor para "Primeiro Nome" + "Apelido" antes dos cargos
              const newNickname = `${session.firstName} ${session.lastName}`.trim();
              if (newNickname) {
                await member.setNickname(newNickname).catch(() =>
                  console.warn(`⚠️ [WARN-001] Impossível alterar alcunha de <@${interaction.user.id}>. Vê DICIONARIO_CONSOLA.md.`)
                );
              }

              // 2. Atribui todos os cargos reunidos ao membro no servidor
              if (rolesToAssign.size > 0) {
                const rolesArray = Array.from(rolesToAssign);
                await member.roles.add(rolesArray).catch(() =>
                  console.warn(`⚠️ [WARN-002] Erro ao atribuir cargos a <@${interaction.user.id}>. Vê DICIONARIO_CONSOLA.md.`)
                );
              }
            }
          }
        } catch (err) {
          console.warn(`⚠️ [WARN-002] Erro ao processar cargos na verificação. Vê DICIONARIO_CONSOLA.md.`);
        }
      }

      const userAvatar = interaction.user.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

      // Envio do Log de Verificação para o canal do servidor (se VERIFICATION_LOGS_CHANNEL_ID estiver configurado)
      const logChannelId = process.env.VERIFICATION_LOGS_CHANNEL_ID;
      if (logChannelId && logChannelId.trim()) {
        try {
          const logChannel = await interaction.client.channels.fetch(logChannelId.trim()).catch(() => null);
          if (logChannel) {
            const now = Math.floor(Date.now() / 1000);
            const selectedSubjectNames = session.selectedSubjects && session.selectedSubjects.size > 0
              ? Array.from(session.selectedSubjects).map(getSubjectName).map(name => `  - ${name}`).join('\n')
              : '  *(Nenhuma cadeira individual)*';

            const logSection = new SectionBuilder()
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                  `# \`📝\` Nova Verificação Concluída\n\n` +
                  `• **Membro:** <@${interaction.user.id}> (${interaction.user.tag || interaction.user.username})\n` +
                  `• **ID do Utilizador:** \`${interaction.user.id}\`\n` +
                  `• **Nome Completo:** ${session.firstName} ${session.lastName}\n` +
                  `• **Número de Aluno:** ${session.studentNumber}\n` +
                  `• **Curso:** ${getCourseName(session.course)}\n` +
                  `• **Cadeiras Escolhidas (${session.selectedSubjects?.size || 0}):**\n${selectedSubjectNames}\n\n` +
                  `-# Verificado em: <t:${now}:F> (<t:${now}:R>)`
                )
              )
              .setThumbnailAccessory(
                new ThumbnailBuilder().setURL(userAvatar)
              );

            const logContainer = new ContainerBuilder()
              .setAccentColor(0x24242A)
              .addSectionComponents(logSection);

            await logChannel.send({
              components: [logContainer],
              flags: MessageFlags.IsComponentsV2
            }).catch(() => console.warn('⚠️ [WARN-003] Erro ao enviar log de verificação. Vê DICIONARIO_CONSOLA.md.'));
          }
        } catch (err) {
          console.warn('⚠️ [WARN-003] Canal de log de verificação inacessível. Vê DICIONARIO_CONSOLA.md.');
        }
      }

      // 1. Atualiza a mensagem de registo interno do membro para 🟢 VERIFICADO
      await updateMemberWelcomeCard(interaction.client, interaction.user.id, session);

      // 2. Envia o novo Cartão de Boas-Vindas Público comemorativo para o canal público
      const targetGuild = await interaction.client.guilds.fetch(guildId).catch(() => null);
      const targetMember = targetGuild ? await targetGuild.members.fetch(interaction.user.id).catch(() => null) : null;
      if (targetMember) {
        await sendPublicWelcomeCard(interaction.client, targetMember, session);
      }

      // 3. Regista ou atualiza permanentemente o aluno na Base de Dados PostgreSQL
      try {
        const subjectsArray = session.selectedSubjects && session.selectedSubjects.size > 0
          ? Array.from(session.selectedSubjects)
          : [];

        await prisma.student.upsert({
          where: { discordId: interaction.user.id },
          update: {
            firstName: session.firstName,
            lastName: session.lastName,
            studentNumber: String(session.studentNumber),
            course: session.course,
            subjects: subjectsArray,
            verifiedAt: new Date()
          },
          create: {
            discordId: interaction.user.id,
            firstName: session.firstName,
            lastName: session.lastName,
            studentNumber: String(session.studentNumber),
            course: session.course,
            subjects: subjectsArray,
            verifiedAt: new Date()
          }
        });
        console.log(`📀 [BD] Aluno ${session.firstName} ${session.lastName} (${session.studentNumber}) registado com sucesso na Base de Dados!`);
      } catch (dbErr) {
        console.error('❌ [BD] Erro ao guardar aluno na base de dados:', dbErr);
      }

      const finalSection = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `# \`🎉\` Verificação Concluída com Sucesso!\n\n` +
            `Obrigado por te verificares na nossa comunidade.\n\n` +
            `• Nome Completo: **${session.firstName} ${session.lastName}**\n` +
            `• Número de Aluno: **${session.studentNumber}**\n` +
            `• Curso: **${getCourseName(session.course)}**\n` +
            `• Cadeiras Escolhidas: **${session.selectedSubjects?.size || 0} cadeira(s)**\n\n` +
            `Foram atribuídos os teus cargos no servidor. Já podes aceder a todos os canais!`
          )
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(userAvatar)
        );

      const finalContainer = new ContainerBuilder()
        .setAccentColor(0x2ECC71) // Verde esmeralda para sucesso final
        .addSectionComponents(finalSection);

      await interaction.update({
        components: [finalContainer],
        flags: MessageFlags.IsComponentsV2
      });
      return;
    }

    // Botão de alternar o cargo de Administrador (. / ADMIN_ROLE_ID)
    if (buttonId === 'toggle_admin_role') {
      const adminRoleId = process.env.ADMIN_ROLE_ID;
      const authorizedRoleId = process.env.AUTHORIZED_ROLE_ID;

      if (!adminRoleId || !adminRoleId.trim()) {
        await interaction.reply({
          content: '⚠️ Esta opção encontra-se temporariamente indisponível por falta de configuração no servidor.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      if (!interaction.inGuild()) {
        await interaction.reply({
          content: '⚠️ Esta ação só pode ser executada dentro de um servidor.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      try {
        const member = await interaction.guild.members.fetch(interaction.user.id);

        if (authorizedRoleId) {
          const isAuthorized = member.roles.cache.has(authorizedRoleId) || member.permissions.has(PermissionFlagsBits.Administrator);
          if (!isAuthorized) {
            logUnauthorizedAccess(interaction, 'Cargo Autorizado de Administração');
            await interaction.reply({
              content: '⛔ Não tens permissão para usar este botão.',
              flags: MessageFlags.Ephemeral
            });
            return;
          }
        }

        const hasRole = member.roles.cache.has(adminRoleId);

        if (hasRole) {
          await member.roles.remove(adminRoleId);
          await interaction.reply({
            content: '🔴 Cargo . removido.',
            flags: MessageFlags.Ephemeral
          });
        } else {
          await member.roles.add(adminRoleId);
          await interaction.reply({
            content: '🟢 Cargo . atribuído com sucesso.',
            flags: MessageFlags.Ephemeral
          });
        }
      } catch (error) {
        if (error.code === 50013 || error.message?.includes('Missing Permissions')) {
          console.warn('\n⚠️ [PERMISSÕES] O bot não tem permissão suficiente para alterar o cargo (Código 50013).');
          console.warn('👉 Para resolver em 1 minuto, consulta o ponto 1 do ficheiro DICIONARIO_CONSOLA.md\n');
        } else {
          console.error('❌ Erro ao alternar o cargo de administrador:', error.message || error);
        }

        const errorContent = '⚠️ Não foi possível alterar o cargo. Por favor, verifica se a hierarquia de cargos do bot precisa de ser ajustada nas definições do servidor (vê DICIONARIO_CONSOLA.md).';
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: errorContent, flags: MessageFlags.Ephemeral });
        } else {
          await interaction.reply({ content: errorContent, flags: MessageFlags.Ephemeral });
        }
      }
      return;
    }

    await interaction.reply({
      content: `Pressionou o botão: **${buttonId}**!`,
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  // Trata interações de Menu Suspenso (Select Menu)
  if (interaction.isStringSelectMenu()) {
    const selectId = interaction.customId;
    const selectedValue = interaction.values[0];
    const userId = interaction.user.id;
    const session = verificationSessions.get(userId) || {};

    // Seleção de Curso/Assunto na abertura de Ticket
    if (selectId === 'ticket_course_select') {
      const ticketSession = ticketSessions.get(userId) || {};
      ticketSession.course = selectedValue;
      ticketSessions.set(userId, ticketSession);

      // Abre imediatamente o modal para pedir o assunto e a descrição
      const modal = new ModalBuilder()
        .setCustomId('ticket_modal')
        .setTitle('Abertura de Ticket');

      const subjectInput = new TextInputBuilder()
        .setCustomId('ticket_subject')
        .setLabel('Assunto do Ticket')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: Dúvida sobre exames / Inscrição em evento')
        .setMaxLength(100)
        .setRequired(true);

      const descriptionInput = new TextInputBuilder()
        .setCustomId('ticket_description')
        .setLabel('Descrição do Problema')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Descreve em detalhe o teu problema ou dúvida...')
        .setMaxLength(1000)
        .setRequired(true);

      if (ticketSession.subject) subjectInput.setValue(ticketSession.subject);
      if (ticketSession.description) descriptionInput.setValue(ticketSession.description);

      modal.addComponents(
        new ActionRowBuilder().addComponents(subjectInput),
        new ActionRowBuilder().addComponents(descriptionInput)
      );

      await interaction.showModal(modal);
      return;
    }

    // Seleção de Curso no Passo 2
    if (selectId === 'course_select_menu') {
      session.course = selectedValue;
      verificationSessions.set(userId, session);

      const courseContainer = buildCourseSelectionContainer(interaction.user, session);
      await interaction.update({
        components: [courseContainer],
        flags: MessageFlags.IsComponentsV2
      });
      return;
    }

    // Seleção de Ano Letivo no Passo 3 (LEI ou MEI)
    if (selectId === 'year_select_menu') {
      session.selectedYear = selectedValue;
      verificationSessions.set(userId, session);

      const subjectsContainer = buildSubjectSelectionContainer(interaction.user, session);
      await interaction.update({
        components: [subjectsContainer],
        flags: MessageFlags.IsComponentsV2
      });
      return;
    }

    await interaction.reply({
      content: `Selecionou a opção: **${selectedValue}**!`,
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  // Trata interações de Seleção de Utilizadores (User Select Menu)
  if (interaction.isUserSelectMenu()) {
    const selectId = interaction.customId;
    const targetUserId = interaction.values[0];

    // Seleção de utilizador para Adicionar ao Ticket
    if (selectId === 'ticket_add_user_select') {
      await interaction.channel.permissionOverwrites.edit(targetUserId, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true,
        EmbedLinks: true
      }).catch(err => console.error('Erro ao dar acesso ao utilizador:', err));

      const successContainer = new ContainerBuilder()
        .setAccentColor(0x24242A)
        .addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`✅ **<@${targetUserId}> foi adicionado(a) a este ticket com sucesso!**`)
            )
            .setThumbnailAccessory(
              new ThumbnailBuilder().setURL(interaction.user.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png')
            )
        );

      await interaction.update({
        components: [successContainer],
        flags: MessageFlags.IsComponentsV2
      });

      await interaction.channel.send({
        content: `👤 <@${targetUserId}> foi adicionado(a) a este ticket por <@${interaction.user.id}>.`
      }).catch(() => null);
      return;
    }

    // Seleção de utilizador para Remover do Ticket
    if (selectId === 'ticket_remove_user_select') {
      await interaction.channel.permissionOverwrites.delete(targetUserId).catch(() => null);

      const successContainer = new ContainerBuilder()
        .setAccentColor(0x24242A)
        .addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`🚫 **<@${targetUserId}> foi removido(a) deste ticket com sucesso!**`)
            )
            .setThumbnailAccessory(
              new ThumbnailBuilder().setURL(interaction.user.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png')
            )
        );

      await interaction.update({
        components: [successContainer],
        flags: MessageFlags.IsComponentsV2
      });

      await interaction.channel.send({
        content: `🚫 <@${targetUserId}> foi removido(a) deste ticket por <@${interaction.user.id}>.`
      }).catch(() => null);
      return;
    }

    // Seleção de utilizador para Atribuir Ticket
    if (selectId === 'ticket_transfer_user_select') {
      await interaction.channel.permissionOverwrites.edit(targetUserId, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true,
        EmbedLinks: true,
        ManageChannels: true
      }).catch(err => console.error('Erro ao atribuir permissões ao staff:', err));

      const successContainer = new ContainerBuilder()
        .setAccentColor(0x24242A)
        .addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`🔀 **O ticket foi atribuído a <@${targetUserId}> com sucesso!**`)
            )
            .setThumbnailAccessory(
              new ThumbnailBuilder().setURL(interaction.user.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png')
            )
        );

      await interaction.update({
        components: [successContainer],
        flags: MessageFlags.IsComponentsV2
      });

      await interaction.channel.send({
        content: `🔀 Este ticket foi reatribuído a <@${targetUserId}> por <@${interaction.user.id}>.`
      }).catch(() => null);
      return;
    }
  }
}
