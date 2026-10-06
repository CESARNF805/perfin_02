/** Mês no formato AAAA-MM. */
export type Mes = string;

/** Data no formato AAAA-MM-DD. */
export type DataIso = string;

export type Unidade = "pct_am" | "pct_ad" | "pct_aa" | "brl";
export type Grupo = "inflacao" | "juros" | "cambio" | "atividade" | "outros";
export type Periodicidade = "diaria" | "mensal";

export interface Indicador {
  id: string;
  nome: string;
  grupo: Grupo;
  unidade: Unidade;
  periodicidade: Periodicidade;
  fonte: string;
  serie_sgs: number | null;
  ativo: boolean;
  ordem: number;
  ultima_coleta_em: string | null;
  ultima_coleta_status: "ok" | "erro" | null;
  ultima_coleta_mensagem: string | null;
}

export interface Ponto {
  data: DataIso;
  valor: number;
}

export type TipoFocus = "anual" | "12m" | "mensal" | "copom";

export interface ExpectativaFocus {
  indicador: string;
  tipo: TipoFocus;
  referencia: string;
  data: DataIso;
  mediana: number | null;
}

export interface MetaInflacao {
  ano: number;
  centro: number;
  tolerancia: number;
}

/** Resultado de um cálculo que exige dados completos no intervalo. */
export type Resultado = { ok: true; valor: number } | { ok: false; faltando: Mes[] };

export type PresetPeriodo = "mes" | "12m" | "24m" | "5a" | "ano" | "personalizado";

export interface Periodo {
  preset: PresetPeriodo;
  inicio: Mes;
  fim: Mes;
}

/** Dados brutos carregados do banco para montar painéis, insights e relatórios. */
export interface DadosIndicadores {
  catalogo: Indicador[];
  valores: Record<string, Ponto[]>;
  focus: ExpectativaFocus[];
  metas: MetaInflacao[];
}
