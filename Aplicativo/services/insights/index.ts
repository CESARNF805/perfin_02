/** Gera os insights automáticos a partir dos dados (sem IA). */
import type { DadosIndicadores, Mes } from "@/types/indicadores";
import type { Insight, Severidade } from "@/types/visualizacao";
import { derivar } from "../calculos/derivadas";
import {
  regraDolar,
  regraGanhoRealAno,
  regraIpcaMeta,
  regraJuroReal,
  regraRevisaoFocus,
  regraSpreadIgpm,
  regraSurpresaIpca,
  type ContextoRegras,
} from "./regras";

const REGRAS = [
  regraIpcaMeta,
  regraSurpresaIpca,
  regraJuroReal,
  regraDolar,
  regraRevisaoFocus,
  regraSpreadIgpm,
  regraGanhoRealAno,
] as const;

const PESO: Record<Severidade, number> = { alerta: 0, atencao: 1, informativo: 2 };

/** Insights do mês `mes`, ordenados por severidade. Uma regra com erro de dado não derruba as demais. */
export function gerarInsights(dados: DadosIndicadores, mes: Mes): Insight[] {
  const contexto: ContextoRegras = { s: derivar(dados), dados, mes };
  return REGRAS.map((regra) => regra(contexto))
    .filter((i): i is Insight => i !== null)
    .sort((a, b) => PESO[a.severidade] - PESO[b.severidade]);
}
