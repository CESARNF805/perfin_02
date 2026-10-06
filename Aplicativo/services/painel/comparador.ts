/** Comparador "quanto rendeu R$ 100": índice base 100, rendimento nominal e real (descontado o IPCA). */
import type { DadosIndicadores, Mes, Periodo } from "@/types/indicadores";
import type { Painel } from "@/types/visualizacao";
import { formatarMes } from "@/lib/formatacao";
import { derivar } from "../calculos/derivadas";
import { listarMeses } from "../calculos/meses";
import { acumularMeses, indiceBase100, ultimoMes, valorOuNulo, type MapaMensal } from "../calculos/series";
import { juroReal } from "../calculos/taxas";

interface Ativo {
  chave: string;
  nome: string;
  cor: 1 | 2 | 3 | 4 | 5 | 6;
  mapa: MapaMensal;
}

/** Último mês fechado em que todas as séries têm dado (o comparador usa só meses fechados). */
export function fimComparavel(ativos: Ativo[], fim: Mes): Mes | null {
  const ultimos = ativos.map((a) => ultimoMes(a.mapa));
  if (ultimos.some((u) => u === null)) return null;
  const menor = (ultimos as Mes[]).reduce((a, b) => (a < b ? a : b));
  return menor < fim ? menor : fim;
}

export function painelComparador(dados: DadosIndicadores, periodo: Periodo): Painel {
  const s = derivar(dados);
  const ativos: Ativo[] = [
    { chave: "cdi", nome: "CDI", cor: 1, mapa: s.cdiMensal },
    { chave: "ipca", nome: "IPCA", cor: 2, mapa: s.ipca },
    { chave: "igpm", nome: "IGP-M", cor: 3, mapa: s.igpm },
    { chave: "dolar", nome: "Dólar", cor: 4, mapa: s.dolarVariacao },
    { chave: "euro", nome: "Euro", cor: 5, mapa: s.euroVariacao },
  ];
  const fim = fimComparavel(ativos, periodo.fim);
  if (!fim || fim < periodo.inicio) {
    return { destaques: [], graficos: [], avisos: ["Ainda não há meses fechados com todos os dados no período escolhido."] };
  }
  const meses = listarMeses(periodo.inicio, fim);
  const indices = new Map(ativos.map((a) => [a.chave, indiceBase100(a.mapa, meses)]));
  const ipcaPeriodo = valorOuNulo(acumularMeses(s.ipca, periodo.inicio, fim));

  const linhasTabela = ativos.map((a) => {
    const nominal = valorOuNulo(acumularMeses(a.mapa, periodo.inicio, fim));
    return {
      id: a.chave, ativo: a.nome, nominal,
      real: nominal === null || ipcaPeriodo === null ? null : juroReal(nominal, ipcaPeriodo),
      final: nominal === null ? null : 100 * (1 + nominal / 100),
    };
  });

  return {
    destaques: [],
    graficos: [{
      id: "base100", titulo: `R$ 100 aplicados no início de ${formatarMes(periodo.inicio)}`, tipo: "linha", formato: "indice",
      series: ativos.map((a) => ({ chave: a.chave, nome: a.nome, cor: a.cor })),
      linhas: meses.map((m, i) => ({
        x: formatarMes(m),
        ...Object.fromEntries(ativos.map((a) => [a.chave, indices.get(a.chave)?.[i] ?? null])),
      })),
      nota: "Dólar e euro: variação da PTAX de venda (fim de mês). Real = descontado o IPCA do período.",
    }],
    tabela: {
      titulo: `Rendimento de ${formatarMes(periodo.inicio)} a ${formatarMes(fim)}`,
      colunas: [
        { chave: "ativo", titulo: "Ativo" },
        { chave: "final", titulo: "R$ 100 viraram", formato: "indice" },
        { chave: "nominal", titulo: "Nominal", formato: "pct" },
        { chave: "real", titulo: "Real (− IPCA)", formato: "pct" },
      ],
      linhas: linhasTabela,
    },
    avisos: fim < periodo.fim ? [`Comparação até ${formatarMes(fim)}, último mês fechado com todos os dados.`] : [],
  };
}
