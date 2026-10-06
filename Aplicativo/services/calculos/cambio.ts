/** Estatísticas de séries de câmbio (PTAX). */
import type { Mes, Ponto, Resultado } from "@/types/indicadores";
import { filtrarPorMeses, ultimoPontoAte } from "./series";
import { somarMeses } from "./meses";
import { variacao } from "./taxas";

const DIAS_UTEIS_ANO = 252;

/** Variação no período: último PTAX do período ÷ último PTAX antes do início − 1. */
export function variacaoNoPeriodo(pontos: readonly Ponto[], inicio: Mes, fim: Mes): Resultado {
  const base = ultimoPontoAte(pontos, `${somarMeses(inicio, -1)}-31`);
  const final = ultimoPontoAte(pontos, `${fim}-31`);
  if (!base || !final || final.data < `${inicio}-01`) return { ok: false, faltando: [inicio] };
  return { ok: true, valor: variacao(base.valor, final.valor) };
}

export interface EstatisticasCambio {
  media: number;
  minimo: Ponto;
  maximo: Ponto;
  ultimo: Ponto;
}

export function estatisticas(pontos: readonly Ponto[], inicio: Mes, fim: Mes): EstatisticasCambio | null {
  const periodo = filtrarPorMeses(pontos, inicio, fim);
  if (periodo.length === 0) return null;
  let minimo = periodo[0]!;
  let maximo = periodo[0]!;
  let soma = 0;
  for (const p of periodo) {
    soma += p.valor;
    if (p.valor < minimo.valor) minimo = p;
    if (p.valor > maximo.valor) maximo = p;
  }
  const ultimo = periodo.reduce((a, b) => (b.data > a.data ? b : a));
  return { media: soma / periodo.length, minimo, maximo, ultimo };
}

/** Volatilidade anualizada (%): desvio-padrão amostral dos retornos log diários × √252. */
export function volatilidadeAnualizada(pontos: readonly Ponto[]): number | null {
  const ordenados = [...pontos].sort((a, b) => a.data.localeCompare(b.data));
  const retornos: number[] = [];
  for (let i = 1; i < ordenados.length; i++) {
    retornos.push(Math.log(ordenados[i]!.valor / ordenados[i - 1]!.valor));
  }
  if (retornos.length < 2) return null;
  const media = retornos.reduce((a, b) => a + b, 0) / retornos.length;
  const variancia = retornos.reduce((a, r) => a + (r - media) ** 2, 0) / (retornos.length - 1);
  return Math.sqrt(variancia) * Math.sqrt(DIAS_UTEIS_ANO) * 100;
}
