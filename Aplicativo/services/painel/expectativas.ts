/** Painel do Boletim Focus: medianas, revisões, esperado × realizado e surpresas do IPCA. */
import type { DadosIndicadores, ExpectativaFocus, Mes, Periodo } from "@/types/indicadores";
import type { DadosGrafico, Destaque, FormatoValor, Painel } from "@/types/visualizacao";
import { formatarData, formatarMes, formatarPercentual, formatarPontosPercentuais } from "@/lib/formatacao";
import { anoDe } from "../calculos/meses";
import { derivar } from "../calculos/derivadas";
import { amostraSemanal, esperadoRealizado, serieMediana, surpresaMensal, tendenciaRevisao } from "../calculos/focus";
import { destaque, mesesDoPeriodo, ultimoMesAte } from "./comum";

const ANUAIS: { indicador: string; nome: string; formato: FormatoValor }[] = [
  { indicador: "ipca", nome: "IPCA", formato: "pct" },
  { indicador: "selic", nome: "Selic (fim de ano)", formato: "pct" },
  { indicador: "cambio", nome: "Câmbio (fim de ano)", formato: "brl" },
  { indicador: "pib", nome: "PIB", formato: "pct" },
];

export function descreverTendencia(variacao: number | null, sequencia: number): string {
  const partes = [variacao === null ? "" : `${formatarPontosPercentuais(variacao)} em 4 semanas`];
  if (Math.abs(sequencia) >= 2) partes.push(`${Math.abs(sequencia)}ª ${sequencia > 0 ? "alta" : "queda"} seguida`);
  return partes.filter(Boolean).join(" · ") || "Sem revisão recente";
}

function destaquesAnuais(focus: ExpectativaFocus[], ano: number): Destaque[] {
  return ANUAIS.map(({ indicador, nome, formato }) => {
    const tendencia = tendenciaRevisao(serieMediana(focus, indicador, "anual", String(ano)));
    return destaque(`focus_${indicador}`, `${nome} ${ano}`, tendencia?.atual ?? null, formato,
      tendencia ? descreverTendencia(formato === "brl" ? null : tendencia.variacao4Semanas, tendencia.sequencia) : "Sem dado");
  });
}

function graficoEvolucao(focus: ExpectativaFocus[], indicador: string, nome: string, ano: number, inicio: Mes, formato: FormatoValor): DadosGrafico {
  const atual = amostraSemanal(serieMediana(focus, indicador, "anual", String(ano)));
  const seguinte = new Map(amostraSemanal(serieMediana(focus, indicador, "anual", String(ano + 1))).map((p) => [p.data, p.valor]));
  return {
    id: `evolucao_${indicador}`, titulo: `${nome}: evolução da mediana`, tipo: "linha", formato,
    series: [{ chave: "atual", nome: String(ano), cor: 1 }, { chave: "seguinte", nome: String(ano + 1), cor: 4 }],
    linhas: atual
      .filter((p) => p.data >= `${inicio}-01`)
      .map((p) => ({ x: formatarData(p.data), atual: p.valor, seguinte: seguinte.get(p.data) ?? null })),
  };
}

function proximasReunioes(focus: ExpectativaFocus[]) {
  const copom = focus.filter((e) => e.tipo === "copom" && e.indicador === "selic");
  const ultimaData = copom.reduce((max, e) => (e.data > max ? e.data : max), "");
  return copom
    .filter((e) => e.data === ultimaData)
    .sort((a, b) => ordemReuniao(a.referencia) - ordemReuniao(b.referencia))
    .slice(0, 8);
}

/** "R6/2026" → 20266 (para ordenar reuniões). */
export function ordemReuniao(referencia: string): number {
  const [r, ano] = referencia.replace("R", "").split("/");
  return Number(ano) * 10 + Number(r);
}

export function painelExpectativas(dados: DadosIndicadores, periodo: Periodo): Painel {
  const s = derivar(dados);
  const ano = anoDe(periodo.fim);
  const meses = mesesDoPeriodo(periodo.inicio, periodo.fim);
  const ultimoIpca = ultimoMesAte(s.ipca, periodo.fim);
  const er = ultimoIpca ? esperadoRealizado(dados.focus, s.ipca, ultimoIpca) : null;
  const surpresa = ultimoIpca ? surpresaMensal(dados.focus, s.ipca, ultimoIpca) : null;
  const reunioes = proximasReunioes(dados.focus);

  return {
    destaques: [
      ...destaquesAnuais(dados.focus, ano),
      destaque("esperado_realizado", `IPCA ${er?.ano ?? ano}: realizado até ${ultimoIpca ? formatarMes(ultimoIpca) : "—"}`,
        er?.realizadoAteAgora ?? null, "pct", er ? `Focus esperava ${formatarPercentual(er.esperadoInicioAno)} para o ano em janeiro` : "Sem dado"),
      destaque("surpresa", `Surpresa do IPCA ${ultimoIpca ? formatarMes(ultimoIpca) : ""}`, surpresa?.diferenca ?? null, "pp",
        surpresa ? `Realizado ${formatarPercentual(surpresa.realizado)} × esperado ${formatarPercentual(surpresa.esperado)}` : "Sem dado",
        surpresa && surpresa.diferenca > 0 ? "alerta" : surpresa ? "positivo" : "neutro"),
    ],
    graficos: [
      graficoEvolucao(dados.focus, "ipca", "IPCA", ano, periodo.inicio, "pct"),
      graficoEvolucao(dados.focus, "selic", "Selic", ano, periodo.inicio, "pct"),
      graficoEvolucao(dados.focus, "cambio", "Câmbio", ano, periodo.inicio, "brl"),
      {
        id: "surpresas", titulo: "IPCA mensal: realizado × esperado (Focus)", tipo: "barra", formato: "pct",
        series: [{ chave: "realizado", nome: "Realizado", cor: 1 }, { chave: "esperado", nome: "Esperado", cor: 4 }],
        linhas: meses.map((m) => {
          const sp = surpresaMensal(dados.focus, s.ipca, m);
          return { x: formatarMes(m), realizado: sp?.realizado ?? null, esperado: sp?.esperado ?? null };
        }),
      },
    ],
    tabela: reunioes.length
      ? {
          titulo: `Selic esperada por reunião do Copom (pesquisa de ${formatarData(reunioes[0]!.data)})`,
          colunas: [{ chave: "reuniao", titulo: "Reunião" }, { chave: "mediana", titulo: "Mediana", formato: "pct" }],
          linhas: reunioes.map((r) => ({ id: r.referencia, reuniao: r.referencia, mediana: r.mediana })),
        }
      : undefined,
    avisos: dados.focus.length === 0 ? ["Sem expectativas Focus no período."] : [],
  };
}
