/** Séries derivadas usadas por painéis, insights, relatório e publicação (calculadas uma vez). */
import type { DadosIndicadores, MetaInflacao, Mes, Ponto } from "@/types/indicadores";
import { ultimaMediana } from "./focus";
import {
  acumulado12m,
  compostoDiarioPorMes,
  mapaMensal,
  ultimoPorMes,
  ultimoPontoAte,
  valorOuNulo,
  variacaoMensal,
} from "./series";
import { juroReal } from "./taxas";

export interface SeriesDerivadas {
  ipca: Map<Mes, number>;
  inpc: Map<Mes, number>;
  igpm: Map<Mes, number>;
  livres: Map<Mes, number>;
  monitorados: Map<Mes, number>;
  cdiMensal: Map<Mes, number>;
  selicMetaMensal: Map<Mes, number>;
  dolarMensal: Map<Mes, number>;
  euroMensal: Map<Mes, number>;
  dolarVariacao: Map<Mes, number>;
  euroVariacao: Map<Mes, number>;
  dolar: Ponto[];
  euro: Ponto[];
  selicMeta: Ponto[];
  metas: MetaInflacao[];
}

export function derivar(dados: DadosIndicadores): SeriesDerivadas {
  const v = (id: string) => dados.valores[id] ?? [];
  const dolarMensal = ultimoPorMes(v("dolar"));
  const euroMensal = ultimoPorMes(v("euro"));
  return {
    ipca: mapaMensal(v("ipca")),
    inpc: mapaMensal(v("inpc")),
    igpm: mapaMensal(v("igpm")),
    livres: mapaMensal(v("ipca_livres")),
    monitorados: mapaMensal(v("ipca_monitorados")),
    cdiMensal: compostoDiarioPorMes(v("cdi")),
    selicMetaMensal: ultimoPorMes(v("selic_meta")),
    dolarMensal,
    euroMensal,
    dolarVariacao: variacaoMensal(dolarMensal),
    euroVariacao: variacaoMensal(euroMensal),
    dolar: v("dolar"),
    euro: v("euro"),
    selicMeta: v("selic_meta"),
    metas: dados.metas,
  };
}

export function metaDoAno(metas: readonly MetaInflacao[], ano: number): MetaInflacao | null {
  return metas.find((m) => m.ano === ano) ?? null;
}

/** Juro real ex-post em 12 meses: CDI 12m descontado o IPCA 12m (Fisher). */
export function juroRealExPost12m(s: SeriesDerivadas, mes: Mes): number | null {
  const cdi = valorOuNulo(acumulado12m(s.cdiMensal, mes));
  const ipca = valorOuNulo(acumulado12m(s.ipca, mes));
  return cdi === null || ipca === null ? null : juroReal(cdi, ipca);
}

export interface JuroExAnte {
  valor: number;
  selicMeta: number;
  ipcaEsperado12m: number;
  dataPesquisa: string;
}

/** Juro real ex-ante (aproximação): Selic meta atual descontada o IPCA esperado em 12 meses (Focus). */
export function juroRealExAnte(s: SeriesDerivadas, dados: DadosIndicadores, ate: string): JuroExAnte | null {
  const selic = ultimoPontoAte(s.selicMeta, ate);
  const ipcaEsperado = ultimaMediana(
    dados.focus.filter((e) => e.data <= ate),
    "ipca",
    "12m",
    "suavizada",
  );
  if (!selic || !ipcaEsperado) return null;
  return {
    valor: juroReal(selic.valor, ipcaEsperado.valor),
    selicMeta: selic.valor,
    ipcaEsperado12m: ipcaEsperado.valor,
    dataPesquisa: ipcaEsperado.data,
  };
}
