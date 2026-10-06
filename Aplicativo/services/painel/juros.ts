/** Painel de juros: Selic meta, CDI e juro real ex-post / ex-ante. */
import type { DadosIndicadores, Mes, Periodo } from "@/types/indicadores";
import type { Destaque, Painel } from "@/types/visualizacao";
import { formatarData, formatarMes, formatarPercentual } from "@/lib/formatacao";
import { derivar, juroRealExAnte, juroRealExPost12m, type SeriesDerivadas } from "../calculos/derivadas";
import { ultimaMediana } from "../calculos/focus";
import { acumulado12m, ultimoPontoAte, valorOuNulo } from "../calculos/series";
import { juroReal } from "../calculos/taxas";
import { destaque, mesesDoPeriodo, ultimoMesAte, valorDoMapa } from "./comum";

/** Ex-ante de cada mês: Selic meta no fim do mês ÷ IPCA esperado 12m da última pesquisa do mês. */
function exAnteNoMes(s: SeriesDerivadas, dados: DadosIndicadores, mes: Mes): number | null {
  const selic = s.selicMetaMensal.get(mes);
  const focus = dados.focus.filter((e) => e.data.slice(0, 7) <= mes);
  const esperado = ultimaMediana(focus, "ipca", "12m", "suavizada");
  if (selic === undefined || !esperado || esperado.data.slice(0, 7) !== mes) return null;
  return juroReal(selic, esperado.valor);
}

function destaquesJuros(s: SeriesDerivadas, dados: DadosIndicadores, fim: Mes): Destaque[] {
  const ultimoCdi = ultimoMesAte(s.cdiMensal, fim);
  const ultimoIpca = ultimoMesAte(s.ipca, fim);
  const mesReal = ultimoCdi && ultimoIpca ? (ultimoCdi < ultimoIpca ? ultimoCdi : ultimoIpca) : null;
  const selic = ultimoPontoAte(s.selicMeta, `${fim}-31`);
  const exAnte = juroRealExAnte(s, dados, `${fim}-31`);
  return [
    destaque("selic", "Selic meta", selic?.valor ?? null, "pct", selic ? `Em ${formatarData(selic.data)}` : "Sem dado"),
    destaque("cdi_mes", ultimoCdi ? `CDI de ${formatarMes(ultimoCdi)}` : "CDI no mês", ultimoCdi ? valorDoMapa(s.cdiMensal, ultimoCdi) : null, "pct", "Composto dos dias úteis"),
    destaque("cdi_12m", "CDI 12 meses", ultimoCdi ? valorOuNulo(acumulado12m(s.cdiMensal, ultimoCdi)) : null, "pct", "Últimos 12 meses fechados"),
    destaque("real_expost", "Juro real ex-post (12m)", mesReal ? juroRealExPost12m(s, mesReal) : null, "pct",
      mesReal ? `(1 + CDI 12m) ÷ (1 + IPCA 12m) − 1, até ${formatarMes(mesReal)}` : "Dado incompleto"),
    destaque("real_exante", "Juro real ex-ante (aprox.)", exAnte?.valor ?? null, "pct",
      exAnte ? `Selic ${formatarPercentual(exAnte.selicMeta)} ÷ IPCA esperado 12m ${formatarPercentual(exAnte.ipcaEsperado12m)}` : "Sem dado do Focus"),
  ];
}

export function painelJuros(dados: DadosIndicadores, periodo: Periodo): Painel {
  const s = derivar(dados);
  const meses = mesesDoPeriodo(periodo.inicio, periodo.fim);
  return {
    destaques: destaquesJuros(s, dados, periodo.fim),
    graficos: [
      {
        id: "selic", titulo: "Selic meta (fim do mês)", tipo: "linha", formato: "pct",
        series: [{ chave: "selic", nome: "Selic meta", cor: 1 }],
        linhas: meses.map((m) => ({ x: formatarMes(m), selic: valorDoMapa(s.selicMetaMensal, m) })),
      },
      {
        id: "cdi", titulo: "CDI no mês", tipo: "barra", formato: "pct",
        series: [{ chave: "cdi", nome: "CDI", cor: 2 }],
        linhas: meses.map((m) => ({ x: formatarMes(m), cdi: valorDoMapa(s.cdiMensal, m) })),
      },
      {
        id: "juro_real", titulo: "Juro real", tipo: "linha", formato: "pct",
        series: [{ chave: "expost", nome: "Ex-post 12m", cor: 1 }, { chave: "exante", nome: "Ex-ante (aprox.)", cor: 4 }],
        linhas: meses.map((m) => ({ x: formatarMes(m), expost: juroRealExPost12m(s, m), exante: exAnteNoMes(s, dados, m) })),
        nota: "Ex-ante aproximado: Selic meta ÷ IPCA esperado para 12 meses (Focus). Fórmula de Fisher.",
      },
    ],
    tabela: {
      titulo: "Mês a mês",
      colunas: [
        { chave: "mes", titulo: "Mês" },
        { chave: "selic", titulo: "Selic meta", formato: "pct" },
        { chave: "cdi", titulo: "CDI mês", formato: "pct" },
        { chave: "cdi12", titulo: "CDI 12m", formato: "pct" },
        { chave: "real", titulo: "Juro real 12m", formato: "pct" },
      ],
      linhas: [...meses].reverse().map((m) => ({
        id: m, mes: formatarMes(m), selic: valorDoMapa(s.selicMetaMensal, m), cdi: valorDoMapa(s.cdiMensal, m),
        cdi12: valorOuNulo(acumulado12m(s.cdiMensal, m)), real: juroRealExPost12m(s, m),
      })),
    },
    avisos: [],
  };
}
