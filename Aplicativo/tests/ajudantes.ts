import type { DadosIndicadores, ExpectativaFocus, Indicador, MetaInflacao, Ponto } from "@/types/indicadores";
import { listarMeses } from "@/services/calculos/meses";

/** IPCA mensal oficial (SGS 433) de set/2025 a ago/2026. Acumulado oficial em 12m (SGS 13522) = 4,22%. */
export const IPCA_SET25_AGO26: Record<string, number> = {
  "2025-09": 0.48, "2025-10": 0.09, "2025-11": 0.18, "2025-12": 0.33,
  "2026-01": 0.33, "2026-02": 0.7, "2026-03": 0.88, "2026-04": 0.67,
  "2026-05": 0.58, "2026-06": 0.16, "2026-07": 0.07, "2026-08": -0.32,
};

export function mensal(valores: Record<string, number>): Ponto[] {
  return Object.entries(valores).map(([mes, valor]) => ({ data: `${mes}-01`, valor }));
}

/** Série mensal constante. */
export function mensalConstante(inicio: string, fim: string, valor: number): Ponto[] {
  return listarMeses(inicio, fim).map((m) => ({ data: `${m}-01`, valor }));
}

/** Série diária em dias úteis (seg–sex) com valor fixo ou calculado. */
export function diaria(inicio: string, fim: string, valor: number | ((data: string, i: number) => number)): Ponto[] {
  const pontos: Ponto[] = [];
  const dia = new Date(`${inicio}T12:00:00Z`);
  const limite = new Date(`${fim}T12:00:00Z`);
  for (let i = 0; dia <= limite; dia.setUTCDate(dia.getUTCDate() + 1)) {
    const semana = dia.getUTCDay();
    if (semana === 0 || semana === 6) continue;
    const data = dia.toISOString().slice(0, 10);
    pontos.push({ data, valor: typeof valor === "number" ? valor : valor(data, i) });
    i++;
  }
  return pontos;
}

function indicador(id: string, unidade: Indicador["unidade"], periodicidade: Indicador["periodicidade"]): Indicador {
  return {
    id, nome: id.toUpperCase(), grupo: "outros", unidade, periodicidade, fonte: "BCB/SGS", serie_sgs: null,
    ativo: true, ordem: 1, ultima_coleta_em: null, ultima_coleta_status: null, ultima_coleta_mensagem: null,
  };
}

export const CATALOGO: Indicador[] = [
  indicador("ipca", "pct_am", "mensal"),
  indicador("igpm", "pct_am", "mensal"),
  indicador("cdi", "pct_ad", "diaria"),
  indicador("selic_meta", "pct_aa", "diaria"),
  indicador("dolar", "brl", "diaria"),
  indicador("euro", "brl", "diaria"),
];

export const METAS: MetaInflacao[] = [2024, 2025, 2026, 2027].map((ano) => ({ ano, centro: 3, tolerancia: 1.5 }));

export function dados(
  valores: Record<string, Ponto[]>,
  focus: ExpectativaFocus[] = [],
  metas: MetaInflacao[] = METAS,
): DadosIndicadores {
  return { catalogo: CATALOGO, valores, focus, metas };
}
