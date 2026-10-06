/** Transformações de séries: mensalização, acumulados e regras de completude. */
import type { DataIso, Mes, Ponto, Resultado } from "@/types/indicadores";
import { anoDe, listarMeses, mesAtual, mesDe, somarMeses } from "./meses";
import { compor, variacao } from "./taxas";

export type MapaMensal = ReadonlyMap<Mes, number>;

/** Série mensal (um ponto por mês) → mapa mês → valor. */
export function mapaMensal(pontos: readonly Ponto[]): Map<Mes, number> {
  return new Map(pontos.map((p) => [mesDe(p.data), p.valor]));
}

function agruparPorMes(pontos: readonly Ponto[]): Map<Mes, Ponto[]> {
  const grupos = new Map<Mes, Ponto[]>();
  for (const ponto of [...pontos].sort((a, b) => a.data.localeCompare(b.data))) {
    const mes = mesDe(ponto.data);
    const lista = grupos.get(mes) ?? [];
    lista.push(ponto);
    grupos.set(mes, lista);
  }
  return grupos;
}

/**
 * Taxa diária (% a.d.) → taxa do mês composta, apenas para meses fechados.
 * Mês fechado = anterior ao mês corrente do calendário (o mês corrente ainda está em andamento).
 */
export function compostoDiarioPorMes(pontos: readonly Ponto[], mesCorrente: Mes = mesAtual()): Map<Mes, number> {
  const grupos = agruparPorMes(pontos);
  return new Map(
    [...grupos]
      .filter(([mes]) => mes < mesCorrente)
      .map(([mes, lista]) => [mes, compor(lista.map((p) => p.valor))]),
  );
}

/** Último valor de cada mês (cotações, Selic meta). Inclui o mês corrente (parcial). */
export function ultimoPorMes(pontos: readonly Ponto[]): Map<Mes, number> {
  const grupos = agruparPorMes(pontos);
  return new Map([...grupos].map(([mes, lista]) => [mes, lista[lista.length - 1]!.valor]));
}

/** Variação mensal de um nível (ex.: dólar): fechamento do mês ÷ fechamento do mês anterior − 1. */
export function variacaoMensal(ultimos: MapaMensal): Map<Mes, number> {
  const resultado = new Map<Mes, number>();
  for (const [mes, valor] of ultimos) {
    const anterior = ultimos.get(somarMeses(mes, -1));
    if (anterior !== undefined) resultado.set(mes, variacao(anterior, valor));
  }
  return resultado;
}

/** Acumula taxas mensais de `inicio` a `fim`. Exige todos os meses do intervalo. */
export function acumularMeses(mapa: MapaMensal, inicio: Mes, fim: Mes): Resultado {
  const meses = listarMeses(inicio, fim);
  const faltando = meses.filter((m) => !mapa.has(m));
  if (meses.length === 0 || faltando.length > 0) return { ok: false, faltando: meses.length ? faltando : [inicio] };
  return { ok: true, valor: compor(meses.map((m) => mapa.get(m)!)) };
}

export function acumulado12m(mapa: MapaMensal, fim: Mes): Resultado {
  return acumularMeses(mapa, somarMeses(fim, -11), fim);
}

export function acumuladoAno(mapa: MapaMensal, fim: Mes): Resultado {
  return acumularMeses(mapa, `${anoDe(fim)}-01`, fim);
}

export function valorOuNulo(resultado: Resultado): number | null {
  return resultado.ok ? resultado.valor : null;
}

/** Série do acumulado em 12 meses para cada mês pedido (null quando incompleto). */
export function serie12m(mapa: MapaMensal, meses: readonly Mes[]): Map<Mes, number | null> {
  return new Map(meses.map((m) => [m, valorOuNulo(acumulado12m(mapa, m))]));
}

/** Último mês com dado no mapa. */
export function ultimoMes(mapa: MapaMensal): Mes | null {
  const meses = [...mapa.keys()].sort();
  return meses[meses.length - 1] ?? null;
}

/** Pontos cuja data está entre os meses `inicio` e `fim`, inclusive. */
export function filtrarPorMeses(pontos: readonly Ponto[], inicio: Mes, fim: Mes): Ponto[] {
  return pontos.filter((p) => {
    const mes = mesDe(p.data);
    return mes >= inicio && mes <= fim;
  });
}

/** Último ponto com data ≤ `limite`. */
export function ultimoPontoAte(pontos: readonly Ponto[], limite: DataIso): Ponto | null {
  let encontrado: Ponto | null = null;
  for (const ponto of pontos) {
    if (ponto.data <= limite && (!encontrado || ponto.data > encontrado.data)) encontrado = ponto;
  }
  return encontrado;
}

/** Índice base 100 a partir de taxas mensais. O índice começa em 100 no fim do mês anterior a `meses[0]`. */
export function indiceBase100(mapa: MapaMensal, meses: readonly Mes[]): (number | null)[] {
  let nivel: number | null = 100;
  return meses.map((mes) => {
    const taxa = mapa.get(mes);
    nivel = nivel === null || taxa === undefined ? null : nivel * (1 + taxa / 100);
    return nivel;
  });
}
