# 📖 Dicionário de Erros e Avisos da Consola (`DICIONARIO_CONSOLA.md`)

Este documento contém o catálogo completo dos códigos de aviso e erro emitidos pelo bot na consola do terminal. Cada código inclui a explicação detalhada da causa e os passos para a sua resolução.

---

## 📋 Catálogo de Códigos de Erro / Avisos

### ⚠️ `[WARN-001]` Impossível Alterar Alcunha (Nickname) do Membro
- **Mensagem na Consola**: `⚠️ [WARN-001] Impossível alterar alcunha de <@user>. Vê DICIONARIO_CONSOLA.md.`
- **Descrição**: O bot tentou alterar o nome do membro no servidor para "Primeiro Nome + Apelido", mas a ação foi recusada pela API do Discord.
- **Causas Possíveis**:
  1. **Dono do Servidor (`Guild Owner`)**: O utilizador verificado é o criador/dono do servidor. A API do Discord bloqueia nativamente alterações de alcunha ao Dono do Servidor.
  2. **Hierarquia de Cargos**: O cargo mais alto do utilizador está posicionado acima do cargo do bot na lista de cargos do servidor.
  3. **Permissão em Falta**: O cargo do bot não possui a permissão `Gerir Alcunhas` (`Manage Nicknames`).
- **Solução**:
  - Para utilizadores normais, vai a `Definições do Servidor -> Cargos` e arrasta o cargo do bot para o topo da lista.
  - Certifica-te de que o cargo do bot tem a permissão `Gerir Alcunhas` ativada.
  - *(Nota: Para a tua própria conta de Dono do Servidor, este aviso é normal e esperado).*

---

### ⚠️ `[WARN-002]` Erro ao Atribuir Cargos no Servidor
- **Mensagem na Consola**: `⚠️ [WARN-002] Erro ao atribuir cargos a <@user>. Vê DICIONARIO_CONSOLA.md.`
- **Descrição**: O bot não conseguiu adicionar um ou mais cargos (Curso, Ano, Semestre, Cadeira ou Verificado) ao membro no servidor.
- **Causas Possíveis**:
  1. **Hierarquia de Cargos**: O cargo que o bot tenta atribuir está acima do cargo mais alto do bot.
  2. **Permissão em Falta**: O bot não tem a permissão `Gerir Cargos` (`Manage Roles`).
  3. **ID de Cargo Inválido**: O ID configurado no `.env` ou em `courseSubjects.js` é inválido ou pertence a outro servidor.
- **Solução**:
  - Verifica se o cargo do bot está acima de todos os cargos que ele precisa de atribuir.
  - Garante que a permissão `Gerir Cargos` está ativa no cargo do bot.
  - Confirma se os IDs colocados no `.env` e em `courseSubjects.js` estão corretos.

---

### ⚠️ `[WARN-003]` Erro ao Enviar Log de Verificação
- **Mensagem na Consola**: `⚠️ [WARN-003] Erro ao enviar log de verificação. Vê DICIONARIO_CONSOLA.md.`
- **Descrição**: O bot não conseguiu enviar a mensagem do registo de verificação em Container V2 para o canal de logs.
- **Causas Possíveis**:
  1. **ID de Canal Incorreto**: O `VERIFICATION_LOGS_CHANNEL_ID` no `.env` é inválido ou não existe.
  2. **Permissão em Falta**: O bot não tem permissão para ver ou enviar mensagens nesse canal (`Ver Canais` e `Enviar Mensagens`).
- **Solução**:
  - Verifica o ID no `.env` e confirma se o bot tem permissões de escrita no canal.

---

### ⚠️ `[WARN-004]` Canal de Boas-Vindas Não Encontrado
- **Mensagem na Consola**: `⚠️ [WARN-004] Canal de boas-vindas não encontrado. Vê DICIONARIO_CONSOLA.md.`
- **Descrição**: O bot não encontrou o canal de entrada para enviar o cartão de boas-vindas do novo membro.
- **Causas Possíveis**:
  1. O `WELCOME_CHANNEL_ID` no `.env` está vazio ou incorreto.
  2. O servidor não tem canal de sistema nem canais com o nome `boas-vindas`, `entrada` ou `welcome`.
- **Solução**:
  - Preenche a variável `WELCOME_CHANNEL_ID` no `.env` com o ID exato do canal pretendido.

---

### ⚠️ `[WARN-005]` Impossível Editar Cartão de Entrada ao Vivo
- **Mensagem na Consola**: `⚠️ [WARN-005] Erro ao atualizar cartão de entrada de <@user>. Vê DICIONARIO_CONSOLA.md.`
- **Descrição**: O bot não conseguiu atualizar a mensagem de entrada do membro no canal de boas-vindas após a verificação ser concluída.
- **Causas Possíveis**:
  1. A mensagem original de entrada já foi eliminada do canal.
  2. O bot não tem permissão para ler o histórico de mensagens do canal (`Ver Histórico de Mensagens`).
- **Solução**:
  - Garante que a permissão `Ver Histórico de Mensagens` está ativa no canal de entrada.
