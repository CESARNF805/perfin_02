/** Painel de câmbio: dólar e euro PTAX, variação, extremos e volatilidade. */
import type { DadosIndicadores, Mes, Periodo, Ponto } from "@/types/indicadores";
import type { Destaque, Painel } from "@/types/visualizacao";
import { formatarData, formatarMes, formatarMoeda } from "@/lib/formatacao";
import { estatisticas, variacaoNoPeriodo, volatilidadeAnualizada } from "../calculos/cambio";
import { derivar } from "../calculos/derivadas";
import { filtrarPorMeses, valorOuNulo } from "../calculos/series";
import { destaque, mesesDoPeriodo, valorDoMapa } from "./comum";

const MAIORES_MOVIMENTOS = 3;

function destaquesMoeda(nome: string, id: string, pontos: Ponto[], inicio: Mes, fim: Mes): Destaque[] {
  const est = estatisticas(pontos, inicio, fim);
  const variacao = variacaoNoPeriodo(pontos, inicio, fim);
  const vol = volatilidadeAnualizada(filtrarPorMeses(pontos, inicio, fim));
  return [
    destaque(`${id}_ultimo`, `${nome} (PTAX venda)`, est?.ultimo.valor ?? null, "brl",
      est ? `Em ${formatarData(est.ultimo.data)}` : "Sem dado"),
    destaque(`${id}_var`, `${nome}: variação no período`, valorOuNulo(variacao), "pct",
      est ? `Mín ${formatarMoeda(est.minimo.valor)} · Máx ${formatarMoeda(est.maximo.valor)}` : "",
      variacao.ok && variacao.valor > 0 ? "alerta" : variacao.ok ? "positivo" : "neutro"),
    destaque(`${id}_vol`, `${nome}: volatilidade anualizada`, vol, "pct",
      est ? `Média no período ${formatarMoeda(est.media)}` : ""),
  ];
}

export function painelCambio(dados: DadosIndicadores, periodo: Periodo): Painel {
  const s = derivar(dados);
  const { inicio, fim } = periodo;
  const meses = mesesDoPeriodo(inicio, fim);
  const diarioDolar = filtrarPorMeses(s.dolar, inicio, fim);
  const diarioEuro = new Map(filtrarPorMeses(s.euro, inicio, fim).map((p) => [p.data, p.valor]));
  const movimentos = meses
    .map((m) => ({ mes: m, valor: s.dolarVariacao.get(m) }))
    .filter((m): m is { mes: Mes; valor: number } => m.valor !== undefined)
    .sort((a, b) => b.valor - a.valor);
  const extremos = [...movimentos.slice(0, MAIORES_MOVIMENTOS), ...movimentos.slice(-MAIORES_MOVIMENTOS).reverse()]
    .filter((m, i, lista) => lista.findIndex((x) => x.mes === m.mes) === i);

  return {
    destaques: [
      ...destaquesMoeda("Dólar", "dolar", s.dolar, inicio, fim),
      ...destaquesMoeda("Euro", "euro", s.euro, inicio, fim),
    ],
    graficos: [
      {
        id: "cotacoes", titulo: "Cotação diária (PTAX venda)", tipo: "linha", formato: "brl",
        series: [{ chave: "dolar", nome: "Dólar", cor: 1 }, { chave: "euro", nome: "Euro", cor: 4 }],
        linhas: diarioDolar.map((p) => ({ x: formatarData(p.data), dolar: p.valor, euro: diarioEuro.get(p.data) ?? null })),
      },
      {
        id: "variacao_mensal", titulo: "Variação mensal do dólar", tipo: "barra", formato: "pct",
        series: [{ chave: "dolar", nome: "Dólar", cor: 2 }],
        linhas: meses.map((m) => ({ x: formatarMes(m), dolar: valorDoMapa(s.dolarVariacao, m) })),
      },
    ],
    tabela: {
      titulo: "Maiores altas e quedas mensais do dólar no período",
      colunas: [
        { chave: "mes", titulo: "Mês" },
        { chave: "variacao", titulo: "Variação", formato: "pct" },
        { chave: "fechamento", titulo: "Fechamento", formato: "brl" },
      ],
      linhas: extremos.map((m) => ({
        id: m.mes, mes: formatarMes(m.mes), variacao: m.valor, fechamento: valorDoMapa(s.dolarMensal, m.mes),
      })),
    },
    avisos: diarioDolar.length === 0 ? ["Sem cotações no período."] : [],
  };
}
