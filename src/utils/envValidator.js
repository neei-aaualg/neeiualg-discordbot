/**
 * Utilitário de Validação de Variáveis de Ambiente (.env)
 * Inspeciona as variáveis necessárias e emite alertas na consola em caso de omissão.
 */

export function validateEnvVars() {
  const missingCore = [];
  const missingAdmin = [];
  const missingVerification = [];
  const missingTickets = [];
  const missingGlobalLogs = [];

  // 1. Configurações Principais
  const coreVars = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];
  for (const key of coreVars) {
    if (!process.env[key] || !process.env[key].trim()) {
      missingCore.push(key);
    }
  }

  // 2. Administração
  const adminVars = ['ADMIN_ROLE_ID', 'AUTHORIZED_ROLE_ID'];
  for (const key of adminVars) {
    if (!process.env[key] || !process.env[key].trim()) {
      missingAdmin.push(key);
    }
  }

  // 3. Verificação e Entradas
  const verifVars = [
    'VERIFICATION_LOGS_CHANNEL_ID',
    'VERIFIED_ROLE_ID',
    'WELCOME_CHANNEL_ID',
    'PUBLIC_WELCOME_CHANNEL_ID',
    'LEI_ROLE_ID',
    'PSC_ROLE_ID',
    'MEI_ROLE_ID',
    'OUTRO_ROLE_ID'
  ];
  for (const key of verifVars) {
    if (!process.env[key] || !process.env[key].trim()) {
      missingVerification.push(key);
    }
  }

  // 4. Sistema de Tickets
  const ticketVars = ['TICKETS_CATEGORY_ID', 'TICKETS_LOGS_CHANNEL_ID', 'TICKETS_TRANSCRIPTS_CHANNEL_ID', 'TICKETS_SUPPORT_ROLE_ID'];
  for (const key of ticketVars) {
    if (!process.env[key] || !process.env[key].trim()) {
      missingTickets.push(key);
    }
  }

  // 5. Sistema Global de Logs e Auditoria
  const globalLogVars = ['MESSAGES_LOGS_CHANNEL_ID', 'INTERACTIONS_LOGS_CHANNEL_ID', 'ACTIONS_LOGS_CHANNEL_ID', 'VOICE_LOGS_CHANNEL_ID'];
  for (const key of globalLogVars) {
    if (!process.env[key] || !process.env[key].trim()) {
      missingGlobalLogs.push(key);
    }
  }

  // Relatório de Inicialização na Consola
  if (missingCore.length > 0) {
    console.error(`❌ [ENV CRITICAL] Variáveis do Bot em falta no .env: ${missingCore.join(', ')}`);
  }
  if (missingAdmin.length > 0) {
    console.warn(`⚠️ [ENV WARN] Variáveis de Administração não configuradas: ${missingAdmin.join(', ')}`);
  }
  if (missingVerification.length > 0) {
    console.warn(`⚠️ [ENV WARN] Variáveis de Verificação/Boas-Vindas em falta: ${missingVerification.join(', ')}`);
  }
  if (missingTickets.length > 0) {
    console.warn(`⚠️ [ENV WARN] Variáveis do Sistema de Tickets não configuradas: ${missingTickets.join(', ')}`);
  }
  if (missingGlobalLogs.length > 0) {
    console.warn(`⚠️ [ENV WARN] Variáveis do Sistema Global de Logs não configuradas: ${missingGlobalLogs.join(', ')}`);
  }
}
