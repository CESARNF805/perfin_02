/** Formato do snapshot público (tabela painel_publico) lido pelo site institucional. */
export interface PontoPublico {
  mes: string;
  valor: number | null;
  piso?: number | null;
  teto?: number | null;
}

export interface IndicadorPublico {
  id: string;
  nome: string;
  grafico: "linha" | "barra";
  formato: "pct" | "brl";
  rotuloSerie: string;
  destaque: { rotulo: string; valor: number | null; detalhe: string };
  serie: PontoPublico[];
}

export interface PainelPublicoDados {
  versao: 1;
  atualizadoEm: string;
  referencia: string;
  indicadores: IndicadorPublico[];
}

export interface SelecaoPublica {
  indicador_id: string;
  visivel: boolean;
  ordem: number;
  grafico: "linha" | "barra";
}
