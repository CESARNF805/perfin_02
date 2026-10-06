/** Tipos usados para levar dados prontos dos services até os componentes de tela. */

export type FormatoValor = "pct" | "pp" | "brl" | "indice";

export interface SerieGrafico {
  chave: string;
  nome: string;
  /** Índice na paleta de gráficos (1 a 6) ou cor semântica. */
  cor: 1 | 2 | 3 | 4 | 5 | 6 | "alerta" | "positivo";
}

export type LinhaGrafico = { x: string } & Record<string, number | string | null>;

export interface DadosGrafico {
  id: string;
  titulo: string;
  tipo: "linha" | "barra";
  formato: FormatoValor;
  series: SerieGrafico[];
  linhas: LinhaGrafico[];
  /** Faixa sombreada (ex.: banda da meta de inflação). */
  faixa?: { chaveMin: string; chaveMax: string; nome: string };
  nota?: string;
}

export interface Destaque {
  id: string;
  rotulo: string;
  valor: number | null;
  formato: FormatoValor;
  detalhe: string;
  tom?: "neutro" | "alerta" | "positivo";
}

export interface TabelaDados {
  colunas: { chave: string; titulo: string; formato?: FormatoValor }[];
  linhas: ({ id: string } & Record<string, number | string | null>)[];
}

/** Conteúdo pronto de uma tela de painel. */
export interface Painel {
  destaques: Destaque[];
  graficos: DadosGrafico[];
  tabela?: TabelaDados & { titulo: string };
  avisos: string[];
}

export type Severidade = "informativo" | "atencao" | "alerta";

export interface Insight {
  id: string;
  titulo: string;
  texto: string;
  severidade: Severidade;
}
