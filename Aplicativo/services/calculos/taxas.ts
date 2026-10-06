/**
 * Regras de composição de taxas. Todas as taxas entram e saem em PERCENTUAL (0,45 = 0,45%).
 * Taxas nunca são somadas: sempre compostas.
 */

/** Composição: ∏(1 + rᵢ) − 1. */
export function compor(taxasPct: readonly number[]): number {
  return (taxasPct.reduce((acumulado, taxa) => acumulado * (1 + taxa / 100), 1) - 1) * 100;
}

/** Juro real pela fórmula de Fisher: (1 + nominal) / (1 + inflação) − 1. */
export function juroReal(nominalPct: number, inflacaoPct: number): number {
  return ((1 + nominalPct / 100) / (1 + inflacaoPct / 100) - 1) * 100;
}

/** Variação percentual entre dois níveis (ex.: cotações). */
export function variacao(inicial: number, final: number): number {
  return (final / inicial - 1) * 100;
}
