/** Mensagens fixas da área de admin. A URL só carrega o código (?ok=… / ?erro=…), nunca o texto. */
export const MENSAGENS_ADMIN = {
  acesso_atualizado: "Acesso atualizado.",
  indicador_cadastrado: "Indicador cadastrado. Ele entra na próxima coleta.",
  indicador_atualizado: "Indicador atualizado.",
  coleta_disparada: "Coleta disparada. Os dados aparecem em alguns minutos.",
  meta_salva: "Meta salva.",
  painel_publicado: "Painel público atualizado.",
  carta_rascunho: "Rascunho salvo.",
  carta_publicada: "Carta publicada no site.",
  carta_ia: "Rascunho gerado pela IA. Revise antes de publicar.",
  pedido_invalido: "Pedido inválido.",
  dados_invalidos: "Dados inválidos. Confira os campos.",
  indicador_duplicado: "Já existe indicador com esse identificador ou série.",
  falha_gravacao: "Não foi possível salvar. Tente novamente.",
  coleta_nao_configurada: "Coleta manual não configurada (GITHUB_ACTIONS_TOKEN / GITHUB_REPO).",
  coleta_recusada: "O GitHub recusou o disparo da coleta.",
  carta_existente: "Já existe carta para esse mês. Edite-a na lista abaixo.",
  carta_ja_publicada: "A carta desse mês já está publicada. Edite-a na lista abaixo.",
  carta_nao_encontrada: "Carta não encontrada.",
  ia_indisponivel: "A IA não conseguiu gerar o rascunho agora.",
  mes_invalido: "Escolha o mês.",
} as const;

export type CodigoMensagem = keyof typeof MENSAGENS_ADMIN;

export type Resultado = { ok: true } | { ok: false; erro: CodigoMensagem };

export function textoMensagem(codigo: string | undefined): string | null {
  // Object.hasOwn: "toString" in objeto seria verdadeiro (protótipo) e vazaria uma função.
  return codigo && Object.hasOwn(MENSAGENS_ADMIN, codigo) ? MENSAGENS_ADMIN[codigo as CodigoMensagem] : null;
}
