/** Painel de inflação: IPCA, INPC, IGP-M, livres × monitorados, meta e spread. */
import type { DadosIndicadores, Mes, Periodo } from "@/types/indicadores";
import type { DadosGrafico, Destaque, Painel } from "@/types/visualizacao";
import { formatarMes, formatarPercentual } from "@/lib/formatacao";
import { anoDe } from "../calculos/meses";
import { derivar, metaDoAno, type SeriesDerivadas } from "../calculos/derivadas";
import { acumulado12m, acumuladoAno, serie12m, valorOuNulo } from "../calculos/series";
import { destaque, mesesDoPeriodo, textoIncompleto, ultimoMesAte, valorDoMapa } from "./comum";

/** Diferença IGP-M 12m − IPCA 12m, em p.p. */
export function spreadIgpmIpca(s: SeriesDerivadas, mes: Mes): number | null {
  const igpm = valorOuNulo(acumulado12m(s.igpm, mes));
  const ipca = valorOuNulo(acumulado12m(s.ipca, mes));
  return igpm === null || ipca === null ? null : igpm - ipca;
}

function destaquesInflacao(s: SeriesDerivadas, mes: Mes): Destaque[] {
  const ipca12 = acumulado12m(s.ipca, mes);
  const meta = metaDoAno(s.metas, anoDe(mes));
  const acimaTeto = ipca12.ok && meta ? ipca12.valor > meta.centro + meta.tolerancia : false;
  const detalheMeta = meta
    ? `Meta ${formatarPercentual(meta.centro, 1)} (teto ${formatarPercentual(meta.centro + meta.tolerancia, 1)})`
    : "Meta não cadastrada";
  const igpmMes = ultimoMesAte(s.igpm, mes) ?? mes;
  return [
    destaque("ipca_mes", `IPCA de ${formatarMes(mes)}`, valorDoMapa(s.ipca, mes), "pct", "Variação no mês"),
    destaque("ipca_12m", "IPCA 12 meses", valorOuNulo(ipca12), "pct", textoIncompleto(ipca12) || detalheMeta,
      acimaTeto ? "alerta" : "neutro"),
    destaque("ipca_ano", `IPCA no ano`, valorOuNulo(acumuladoAno(s.ipca, mes)), "pct", `Jan a ${formatarMes(mes)}`),
    destaque("inpc_12m", "INPC 12 meses", valorOuNulo(acumulado12m(s.inpc, mes)), "pct", "Reajustes salariais"),
    destaque("igpm_12m", "IGP-M 12 meses", valorOuNulo(acumulado12m(s.igpm, igpmMes)), "pct", `Até ${formatarMes(igpmMes)}`),
    destaque("spread", "IGP-M − IPCA (12m)", spreadIgpmIpca(s, mes), "pp", "Positivo: reajustes por IGP-M mais caros"),
  ];
}

function graficosInflacao(s: SeriesDerivadas, meses: Mes[]): DadosGrafico[] {
  const ipca12 = serie12m(s.ipca, meses);
  const igpm12 = serie12m(s.igpm, meses);
  const livres12 = serie12m(s.livres, meses);
  const monit12 = serie12m(s.monitorados, meses);
  return [
    {
      id: "mensal", titulo: "Variação mensal", tipo: "barra", formato: "pct",
      series: [{ chave: "ipca", nome: "IPCA", cor: 1 }, { chave: "inpc", nome: "INPC", cor: 3 }, { chave: "igpm", nome: "IGP-M", cor: 5 }],
      linhas: meses.map((m) => ({ x: formatarMes(m), ipca: valorDoMapa(s.ipca, m), inpc: valorDoMapa(s.inpc, m), igpm: valorDoMapa(s.igpm, m) })),
    },
    {
      id: "doze_meses", titulo: "Acumulado em 12 meses × meta", tipo: "linha", formato: "pct",
      series: [{ chave: "ipca", nome: "IPCA 12m", cor: 1 }, { chave: "igpm", nome: "IGP-M 12m", cor: 4 }, { chave: "centro", nome: "Centro da meta", cor: 6 }],
      faixa: { chaveMin: "piso", chaveMax: "teto", nome: "Banda da meta" },
      linhas: meses.map((m) => {
        const meta = metaDoAno(s.metas, anoDe(m));
        return {
          x: formatarMes(m), ipca: ipca12.get(m) ?? null, igpm: igpm12.get(m) ?? null,
          centro: meta?.centro ?? null,
          piso: meta ? meta.centro - meta.tolerancia : null,
          teto: meta ? meta.centro + meta.tolerancia : null,
        };
      }),
    },
    {
      id: "livres_monitorados", titulo: "Preços livres × monitorados (12m)", tipo: "linha", formato: "pct",
      series: [{ chave: "livres", nome: "Livres", cor: 2 }, { chave: "monitorados", nome: "Monitorados", cor: 4 }],
      linhas: meses.map((m) => ({ x: formatarMes(m), livres: livres12.get(m) ?? null, monitorados: monit12.get(m) ?? null })),
    },
    {
      id: "spread", titulo: "Spread IGP-M − IPCA (12m)", tipo: "barra", formato: "pp",
      series: [{ chave: "spread", nome: "IGP-M − IPCA", cor: 2 }],
      linhas: meses.map((m) => ({ x: formatarMes(m), spread: spreadIgpmIpca(s, m) })),
    },
  ];
}

export function painelInflacao(dados: DadosIndicadores, periodo: Periodo): Painel {
  const s = derivar(dados);
  const meses = mesesDoPeriodo(periodo.inicio, periodo.fim);
  const ultimo = ultimoMesAte(s.ipca, periodo.fim);
  if (!ultimo) return { destaques: [], graficos: [], avisos: ["Ainda não há IPCA divulgado no período."] };
  const ipca12 = serie12m(s.ipca, meses);
  const igpm12 = serie12m(s.igpm, meses);
  return {
    destaques: destaquesInflacao(s, ultimo),
    graficos: graficosInflacao(s, meses),
    tabela: {
      titulo: "Mês a mês",
      colunas: [
        { chave: "mes", titulo: "Mês" },
        { chave: "ipca", titulo: "IPCA", formato: "pct" },
        { chave: "ipca12", titulo: "IPCA 12m", formato: "pct" },
        { chave: "inpc", titulo: "INPC", formato: "pct" },
        { chave: "igpm", titulo: "IGP-M", formato: "pct" },
        { chave: "igpm12", titulo: "IGP-M 12m", formato: "pct" },
      ],
      linhas: [...meses].reverse().map((m) => ({
        id: m, mes: formatarMes(m), ipca: valorDoMapa(s.ipca, m), ipca12: ipca12.get(m) ?? null,
        inpc: valorDoMapa(s.inpc, m), igpm: valorDoMapa(s.igpm, m), igpm12: igpm12.get(m) ?? null,
      })),
    },
    avisos: ultimo < periodo.fim ? [`IPCA divulgado até ${formatarMes(ultimo)}.`] : [],
  };
}
