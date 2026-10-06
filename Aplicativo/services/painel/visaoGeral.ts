/** Visão geral: os seis números que o time olha primeiro. */
import type { DadosIndicadores, Mes } from "@/types/indicadores";
import type { Destaque } from "@/types/visualizacao";
import { formatarData, formatarMes, formatarPercentual } from "@/lib/formatacao";
import { anoDe, somarMeses } from "../calculos/meses";
import { derivar, juroRealExPost12m, metaDoAno } from "../calculos/derivadas";
import { acumulado12m, ultimoPontoAte, valorOuNulo } from "../calculos/series";
import { destaque, ultimoMesAte } from "./comum";

/** Quantos meses de histórico a visão geral carrega (insights usam janelas longas). */
export const MESES_VISAO_GERAL = 120;

export function inicioVisaoGeral(mes: Mes): Mes {
  return somarMeses(mes, -(MESES_VISAO_GERAL - 1));
}

export function destaquesVisaoGeral(dados: DadosIndicadores, mes: Mes): Destaque[] {
  const s = derivar(dados);
  const mIpca = ultimoMesAte(s.ipca, mes);
  const mCdi = ultimoMesAte(s.cdiMensal, mes);
  const mIgpm = ultimoMesAte(s.igpm, mes);
  const mReal = mIpca && mCdi ? (mIpca < mCdi ? mIpca : mCdi) : null;
  const ipca12 = mIpca ? valorOuNulo(acumulado12m(s.ipca, mIpca)) : null;
  const meta = mIpca ? metaDoAno(s.metas, anoDe(mIpca)) : null;
  const teto = meta ? meta.centro + meta.tolerancia : null;
  const selic = ultimoPontoAte(s.selicMeta, `${mes}-31`);
  const dolar = ultimoPontoAte(s.dolar, `${mes}-31`);
  const varDolar = dolar ? s.dolarVariacao.get(dolar.data.slice(0, 7)) ?? null : null;

  return [
    destaque("ipca12", "IPCA 12 meses", ipca12, "pct",
      mIpca ? `${formatarMes(mIpca)} · meta ${meta ? formatarPercentual(meta.centro, 1) : "—"}` : "Sem dado",
      ipca12 !== null && teto !== null && ipca12 > teto ? "alerta" : "neutro"),
    destaque("selic", "Selic meta", selic?.valor ?? null, "pct", selic ? `Em ${formatarData(selic.data)}` : "Sem dado"),
    destaque("cdi12", "CDI 12 meses", mCdi ? valorOuNulo(acumulado12m(s.cdiMensal, mCdi)) : null, "pct",
      mCdi ? `Até ${formatarMes(mCdi)}` : "Sem dado"),
    destaque("real", "Juro real ex-post", mReal ? juroRealExPost12m(s, mReal) : null, "pct",
      mReal ? `12 meses até ${formatarMes(mReal)}` : "Sem dado"),
    destaque("dolar", "Dólar PTAX", dolar?.valor ?? null, "brl",
      varDolar !== null ? `${formatarPercentual(varDolar)} no mês` : "Sem dado",
      varDolar !== null && varDolar > 0 ? "alerta" : "neutro"),
    destaque("igpm12", "IGP-M 12 meses", mIgpm ? valorOuNulo(acumulado12m(s.igpm, mIgpm)) : null, "pct",
      mIgpm ? `Até ${formatarMes(mIgpm)}` : "Sem dado"),
  ];
}
