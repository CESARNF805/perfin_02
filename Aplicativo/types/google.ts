export interface Reuniao {
  id: string;
  titulo: string;
  inicio: string;
  fim: string | null;
  diaInteiro: boolean;
  linkReuniao: string | null;
  linkAgenda: string | null;
  local: string | null;
}

export interface Relatorio {
  id: string;
  mes_referencia: string;
  planilha_id: string;
  planilha_url: string;
  rascunho_gmail_id: string | null;
  criado_em: string;
}
