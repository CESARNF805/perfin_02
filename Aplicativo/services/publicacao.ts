/** Monta o snapshot já calculado que o site exibe (o site não calcula nada). */
import type { DadosIndicadores, Indicador, Mes } from "@/types/indicadores";
import type { IndicadorPublico, PainelPublicoDados, PontoPublico, SelecaoPublica } from "@/types/publicacao";
import { formatarMes, formatarPercentual } from "@/lib/formatacao";
import { anoDe, listarMeses, somarMeses } from "./calculos/meses";
import { metaDoAno } from "./calculos/derivadas";
import { acumulado12m, compostoDiarioPorMes, mapaMensal, ultimoPorMes, valorOuNulo, type MapaMensal } from "./calculos/series";
import { variacao } from "./calculos/taxas";
import { ultimoMesAte } from "./painel/comum";

/** Meses exibidos em cada gráfico público. */
export const MESES_PUBLICOS = 24;

function serieMensalDe(indicador: Indicador, dados: DadosIndicadores): MapaMensal {
  const pontos = dados.valores[indicador.id] ?? [];
  if (indicador.unidade === "pct_am") return mapaMensal(pontos);
  if (indicador.unidade === "pct_ad") return compostoDiarioPorMes(pontos);
  return ultimoPorMes(pontos);
}

function montarIndicador(indicador: Indicador, sel: SelecaoPublica, dados: DadosIndicadores, hoje: Mes): IndicadorPublico | null {
  const mapa = serieMensalDe(indicador, dados);
  const ultimo = ultimoMesAte(mapa, hoje);
  if (!ultimo) return null;
  const meses = listarMeses(somarMeses(ultimo, -(MESES_PUBLICOS - 1)), ultimo);
  const ehTaxa = indicador.unidade === "pct_am" || indicador.unidade === "pct_ad";
  const usar12m = ehTaxa && sel.grafico === "linha";
  const metas = dados.metas;
  const serie: PontoPublico[] = meses.map((m) => {
    const valor = usar12m ? valorOuNulo(acumulado12m(mapa, m)) : mapa.get(m) ?? null;
    const meta = indicador.id === "ipca" && usar12m ? metaDoAno(metas, anoDe(m)) : null;
    return meta ? { mes: m, valor, piso: meta.centro - meta.tolerancia, teto: meta.centro + meta.tolerancia } : { mes: m, valor };
  });
  const atual = mapa.get(ultimo) ?? null;
  const ha12 = mapa.get(somarMeses(ultimo, -12)) ?? null;
  const destaque = ehTaxa
    ? { rotulo: `${indicador.nome} em 12 meses`, valor: valorOuNulo(acumulado12m(mapa, ultimo)), detalhe: `Até ${formatarMes(ultimo)}` }
    : {
        rotulo: indicador.nome,
        valor: atual,
        detalhe: indicador.unidade === "brl" && atual !== null && ha12 !== null
          ? `Variação em 12 meses: ${formatarPercentual(variacao(ha12, atual))}`
          : `Fim de ${formatarMes(ultimo)}`,
      };
  return {
    id: indicador.id, nome: indicador.nome, grafico: sel.grafico,
    formato: indicador.unidade === "brl" ? "brl" : "pct",
    rotuloSerie: usar12m ? "Acumulado em 12 meses (%)" : ehTaxa ? "Variação no mês (%)" : indicador.unidade === "brl" ? "Fechamento do mês (R$)" : "Fim do mês (% a.a.)",
    destaque, serie,
  };
}

export function montarSnapshot(
  dados: DadosIndicadores,
  selecao: SelecaoPublica[],
  hoje: Mes,
  agora: Date = new Date(),
): PainelPublicoDados {
  const porId = new Map(dados.catalogo.map((i) => [i.id, i]));
  const indicadores = [...selecao]
    .filter((s) => s.visivel && porId.has(s.indicador_id))
    .sort((a, b) => a.ordem - b.ordem)
    .map((s) => montarIndicador(porId.get(s.indicador_id)!, s, dados, hoje))
    .filter((i): i is IndicadorPublico => i !== null);
  return { versao: 1, atualizadoEm: agora.toISOString(), referencia: hoje, indicadores };
}
