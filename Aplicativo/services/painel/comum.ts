/** Helpers compartilhados pelos painéis. */
import type { Mes, Resultado } from "@/types/indicadores";
import type { Destaque, FormatoValor } from "@/types/visualizacao";
import { formatarMes } from "@/lib/formatacao";
import { listarMeses } from "../calculos/meses";
import type { MapaMensal } from "../calculos/series";

export function mesesDoPeriodo(inicio: Mes, fim: Mes): Mes[] {
  return listarMeses(inicio, fim);
}

/** Último mês ≤ `limite` presente no mapa. */
export function ultimoMesAte(mapa: MapaMensal, limite: Mes): Mes | null {
  let melhor: Mes | null = null;
  for (const mes of mapa.keys()) if (mes <= limite && (!melhor || mes > melhor)) melhor = mes;
  return melhor;
}

export function textoIncompleto(resultado: Resultado): string {
  if (resultado.ok) return "";
  return `Dado incompleto: falta ${resultado.faltando.slice(0, 3).map(formatarMes).join(", ")}`;
}

export function destaque(
  id: string,
  rotulo: string,
  valor: number | null,
  formato: FormatoValor,
  detalhe: string,
  tom: Destaque["tom"] = "neutro",
): Destaque {
  return { id, rotulo, valor, formato, detalhe, tom };
}

export function valorDoMapa(mapa: MapaMensal, mes: Mes): number | null {
  return mapa.get(mes) ?? null;
}
