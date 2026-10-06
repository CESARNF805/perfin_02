/** Relatório do mês: escolha do mês de referência e conteúdo das abas da planilha. */
import type { DadosIndicadores, Mes } from "@/types/indicadores";
import { formatarMes, formatarPercentual } from "@/lib/formatacao";
import { anoDe, listarMeses, somarMeses } from "./calculos/meses";
import { derivar, juroRealExPost12m, metaDoAno, type SeriesDerivadas } from "./calculos/derivadas";
import { tendenciasAnuais } from "./calculos/focus";
import { acumulado12m, acumuladoAno, filtrarPorMeses, valorOuNulo, type MapaMensal } from "./calculos/series";
import { variacao } from "./calculos/taxas";
import { gerarInsights } from "./insights";
import { ultimoMesAte } from "./painel/comum";

export type Celula = string | number | null;
export interface Aba {
  titulo: string;
  linhas: Celula[][];
}

export type MesRelatorio = { ok: true; mes: Mes } | { ok: false; motivo: string };

/** Último mês fechado (anterior ao mês atual) com IPCA e IGP-M divulgados. */
export function mesDoRelatorio(dados: DadosIndicadores, hoje: Mes): MesRelatorio {
  const s = derivar(dados);
  const limite = somarMeses(hoje, -1);
  const ipca = ultimoMesAte(s.ipca, limite);
  const igpm = ultimoMesAte(s.igpm, limite);
  if (!ipca || !igpm) return { ok: false, motivo: `Falta ${!ipca ? "IPCA" : "IGP-M"} divulgado.` };
  return { ok: true, mes: ipca < igpm ? ipca : igpm };
}

const r = (v: number | null) => (v === null || !Number.isFinite(v) ? null : Math.round(v * 10000) / 10000);

function linhaTaxaMensal(nome: string, mapa: MapaMensal, mes: Mes, referencia = ""): Celula[] {
  return [nome, "% no mês", r(mapa.get(mes) ?? null), r(mapa.get(somarMeses(mes, -1)) ?? null),
    r(valorOuNulo(acumuladoAno(mapa, mes))), r(valorOuNulo(acumulado12m(mapa, mes))), referencia];
}

function linhaCotacao(nome: string, mensal: MapaMensal, mes: Mes): Celula[] {
  const atual = mensal.get(mes) ?? null;
  const anterior = mensal.get(somarMeses(mes, -1)) ?? null;
  const dezembro = mensal.get(`${anoDe(mes) - 1}-12`) ?? null;
  const ha12 = mensal.get(somarMeses(mes, -12)) ?? null;
  const v = (base: number | null) => (atual !== null && base !== null ? r(variacao(base, atual)) : null);
  return [nome, "R$ (fechamento)", r(atual), r(anterior), v(dezembro), v(ha12), "Variações em % (ano e 12m)"];
}

function abaResumo(s: SeriesDerivadas, mes: Mes): Aba {
  const meta = metaDoAno(s.metas, anoDe(mes));
  const refMeta = meta ? `Meta ${formatarPercentual(meta.centro, 2)} ± ${formatarPercentual(meta.tolerancia, 1).replace("%", " p.p.")}` : "";
  return {
    titulo: "Resumo",
    linhas: [
      [`Portal Perfin — Relatório de ${formatarMes(mes)}`],
      ["Indicador", "Unidade", formatarMes(mes), formatarMes(somarMeses(mes, -1)), "Acumulado no ano", "Acumulado 12m", "Referência"],
      linhaTaxaMensal("IPCA", s.ipca, mes, refMeta),
      linhaTaxaMensal("INPC", s.inpc, mes),
      linhaTaxaMensal("IGP-M", s.igpm, mes),
      linhaTaxaMensal("IPCA – livres", s.livres, mes),
      linhaTaxaMensal("IPCA – monitorados", s.monitorados, mes),
      linhaTaxaMensal("CDI", s.cdiMensal, mes),
      ["Selic meta", "% a.a. (fim do mês)", r(s.selicMetaMensal.get(mes) ?? null), r(s.selicMetaMensal.get(somarMeses(mes, -1)) ?? null), null, null, ""],
      ["Juro real ex-post", "% em 12m", null, null, null, r(juroRealExPost12m(s, mes)), "(1 + CDI 12m) ÷ (1 + IPCA 12m) − 1"],
      linhaCotacao("Dólar PTAX", s.dolarMensal, mes),
      linhaCotacao("Euro PTAX", s.euroMensal, mes),
    ],
  };
}

function abaHistorico(titulo: string, cabecalho: string[], meses: Mes[], linha: (m: Mes) => Celula[]): Aba {
  return { titulo, linhas: [cabecalho, ...meses.map((m) => [formatarMes(m), ...linha(m)])] };
}

function abaFocus(dados: DadosIndicadores, mes: Mes): Aba {
  const ano = anoDe(mes);
  const cabecalho: Celula[] = ["Indicador", "Ano de referência", "Mediana atual", "Variação em 4 semanas (p.p.)", "Semanas seguidas na mesma direção"];
  const linhas: Celula[][] = tendenciasAnuais(dados.focus, ano).map(({ nome, ano: ref, tendencia: t }) => [
    nome, ref, r(t?.atual ?? null), r(t?.variacao4Semanas ?? null), t?.sequencia ?? null,
  ]);
  return { titulo: "Focus", linhas: [cabecalho, ...linhas] };
}

function abaDados(dados: DadosIndicadores, mes: Mes): Aba {
  const linhas: Celula[][] = [["Indicador", "Data", "Valor"]];
  for (const indicador of dados.catalogo) {
    for (const p of filtrarPorMeses(dados.valores[indicador.id] ?? [], mes, mes)) linhas.push([indicador.nome, p.data, p.valor]);
  }
  return { titulo: "Dados", linhas };
}

export function montarAbas(dados: DadosIndicadores, mes: Mes): Aba[] {
  const s = derivar(dados);
  const meses = listarMeses(somarMeses(mes, -12), mes).reverse();
  const v = (mapa: MapaMensal, m: Mes) => r(mapa.get(m) ?? null);
  return [
    abaResumo(s, mes),
    abaHistorico("Inflação", ["Mês", "IPCA (%)", "IPCA 12m (%)", "INPC (%)", "IGP-M (%)", "IGP-M 12m (%)"], meses, (m) => [
      v(s.ipca, m), r(valorOuNulo(acumulado12m(s.ipca, m))), v(s.inpc, m), v(s.igpm, m), r(valorOuNulo(acumulado12m(s.igpm, m))),
    ]),
    abaHistorico("Juros", ["Mês", "Selic meta (% a.a.)", "CDI no mês (%)", "CDI 12m (%)", "Juro real 12m (%)"], meses, (m) => [
      v(s.selicMetaMensal, m), v(s.cdiMensal, m), r(valorOuNulo(acumulado12m(s.cdiMensal, m))), r(juroRealExPost12m(s, m)),
    ]),
    abaHistorico("Câmbio", ["Mês", "Dólar (R$)", "Dólar var. (%)", "Euro (R$)", "Euro var. (%)"], meses, (m) => [
      v(s.dolarMensal, m), v(s.dolarVariacao, m), v(s.euroMensal, m), v(s.euroVariacao, m),
    ]),
    abaFocus(dados, mes),
    { titulo: "Insights", linhas: [["Insight", "Detalhe"], ...gerarInsights(dados, mes).map((i) => [i.titulo, i.texto])] },
    abaDados(dados, mes),
  ];
}

export function tituloRelatorio(mes: Mes): string {
  return `Portal Perfin — Indicadores ${formatarMes(mes)}`;
}
