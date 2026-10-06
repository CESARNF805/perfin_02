/** Regras sobre as expectativas do Boletim Focus. */
import type { DataIso, ExpectativaFocus, Mes, Ponto, TipoFocus } from "@/types/indicadores";
import { somarMeses } from "./meses";
import { acumuladoAno, type MapaMensal } from "./series";

/** Última pesquisa considerada para a "surpresa": até este dia do mês seguinte (IPCA sai por volta do dia 10). */
export const DIA_LIMITE_SURPRESA = 7;

/** Série temporal da mediana de uma expectativa, ordenada pela data da pesquisa. */
export function serieMediana(
  focus: readonly ExpectativaFocus[],
  indicador: string,
  tipo: TipoFocus,
  referencia: string,
): Ponto[] {
  return focus
    .filter((e) => e.indicador === indicador && e.tipo === tipo && e.referencia === referencia && e.mediana !== null)
    .map((e) => ({ data: e.data, valor: e.mediana! }))
    .sort((a, b) => a.data.localeCompare(b.data));
}

export function ultimaMediana(
  focus: readonly ExpectativaFocus[],
  indicador: string,
  tipo: TipoFocus,
  referencia: string,
): Ponto | null {
  const serie = serieMediana(focus, indicador, tipo, referencia);
  return serie[serie.length - 1] ?? null;
}

/** Amostra semanal: último valor de cada semana (semanas iniciando na segunda-feira). */
export function amostraSemanal(serie: readonly Ponto[]): Ponto[] {
  const porSemana = new Map<string, Ponto>();
  for (const ponto of serie) {
    const dia = new Date(`${ponto.data}T12:00:00Z`);
    const deslocamento = (dia.getUTCDay() + 6) % 7;
    dia.setUTCDate(dia.getUTCDate() - deslocamento);
    porSemana.set(dia.toISOString().slice(0, 10), ponto);
  }
  return [...porSemana.values()].sort((a, b) => a.data.localeCompare(b.data));
}

export interface Tendencia {
  /** Mediana atual. */
  atual: number;
  /** Variação da mediana em 4 semanas, em p.p. */
  variacao4Semanas: number | null;
  /** Semanas seguidas na mesma direção (positivo = altas, negativo = quedas). */
  sequencia: number;
}

export function tendenciaRevisao(serie: readonly Ponto[]): Tendencia | null {
  const semanas = amostraSemanal(serie);
  const atual = semanas[semanas.length - 1];
  if (!atual) return null;
  const ha4 = semanas[semanas.length - 5];
  let sequencia = 0;
  for (let i = semanas.length - 1; i > 0; i--) {
    const delta = semanas[i]!.valor - semanas[i - 1]!.valor;
    const sinal = Math.sign(delta);
    if (sinal === 0 || (sequencia !== 0 && Math.sign(sequencia) !== sinal)) break;
    sequencia += sinal;
  }
  return { atual: atual.valor, variacao4Semanas: ha4 ? atual.valor - ha4.valor : null, sequencia };
}

/** Direção da revisão: a sequência semanal; se a última semana ficou parada, o sinal da variação em 4 semanas. */
export function direcaoRevisao(t: Tendencia): 1 | -1 | 0 {
  const sinal = Math.sign(t.sequencia) || Math.sign(t.variacao4Semanas ?? 0);
  return sinal > 0 ? 1 : sinal < 0 ? -1 : 0;
}

export const INDICADORES_FOCUS_ANUAIS = [
  { id: "ipca", nome: "IPCA" },
  { id: "selic", nome: "Selic" },
  { id: "cambio", nome: "Câmbio" },
  { id: "pib", nome: "PIB" },
] as const;

/** Tendência da mediana anual de cada indicador para o ano e o seguinte. */
export function tendenciasAnuais(focus: readonly ExpectativaFocus[], ano: number) {
  return INDICADORES_FOCUS_ANUAIS.flatMap(({ id, nome }) =>
    [ano, ano + 1].map((ref) => ({ id, nome, ano: ref, tendencia: tendenciaRevisao(serieMediana(focus, id, "anual", String(ref))) })),
  );
}

/** IPCA mensal divulgado − mediana Focus da última pesquisa antes da divulgação (p.p.). */
export function surpresaMensal(
  focus: readonly ExpectativaFocus[],
  ipcaMensal: MapaMensal,
  mes: Mes,
): { esperado: number; realizado: number; diferenca: number } | null {
  const realizado = ipcaMensal.get(mes);
  if (realizado === undefined) return null;
  const limite: DataIso = `${somarMeses(mes, 1)}-${String(DIA_LIMITE_SURPRESA).padStart(2, "0")}`;
  const serie = serieMediana(focus, "ipca", "mensal", mes).filter((p) => p.data <= limite);
  const esperado = serie[serie.length - 1]?.valor;
  if (esperado === undefined) return null;
  return { esperado, realizado, diferenca: realizado - esperado };
}

/** IPCA esperado no início do ano (1ª pesquisa do ano) × realizado no ano até `fim`. */
export function esperadoRealizado(
  focus: readonly ExpectativaFocus[],
  ipcaMensal: MapaMensal,
  fim: Mes,
): { ano: number; esperadoInicioAno: number; realizadoAteAgora: number; mesesRealizados: number } | null {
  const ano = Number(fim.slice(0, 4));
  const primeira = serieMediana(focus, "ipca", "anual", String(ano)).find((p) => p.data >= `${ano}-01-01`);
  const realizado = acumuladoAno(ipcaMensal, fim);
  if (!primeira || !realizado.ok) return null;
  return {
    ano,
    esperadoInicioAno: primeira.valor,
    realizadoAteAgora: realizado.valor,
    mesesRealizados: Number(fim.slice(5, 7)),
  };
}
