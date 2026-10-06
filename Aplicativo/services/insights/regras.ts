/** Regras determinísticas de insights. Cada regra devolve um insight ou null. */
import type { DadosIndicadores, Mes } from "@/types/indicadores";
import type { Insight } from "@/types/visualizacao";
import { formatarMes, formatarPercentual, formatarPontosPercentuais } from "@/lib/formatacao";
import { anoDe, somarMeses } from "../calculos/meses";
import { juroRealExPost12m, metaDoAno, type SeriesDerivadas } from "../calculos/derivadas";
import { direcaoRevisao, serieMediana, surpresaMensal, tendenciaRevisao } from "../calculos/focus";
import { acumulado12m, acumuladoAno, valorOuNulo } from "../calculos/series";
import { juroReal } from "../calculos/taxas";
import { spreadIgpmIpca } from "../painel/inflacao";
import { ultimoMesAte } from "../painel/comum";
import { CONFIG_INSIGHTS as C } from "./config";

export interface ContextoRegras {
  s: SeriesDerivadas;
  dados: DadosIndicadores;
  /** Mês de referência (último mês considerado). */
  mes: Mes;
}

/**
 * Desde quando `valor` é o maior (ou menor) da série: retorna o mês mais recente anterior
 * que superou o valor, ou null se é recorde na janela inteira. `undefined` = não é recorde relevante.
 */
export function recordeDesde(
  valorNoMes: (m: Mes) => number | null,
  mes: Mes,
  direcao: "max" | "min",
  janela: number = C.janelaHistoricaMeses,
): Mes | null | undefined {
  const atual = valorNoMes(mes);
  if (atual === null) return undefined;
  for (let i = 1; i <= janela; i++) {
    const anterior = somarMeses(mes, -i);
    const v = valorNoMes(anterior);
    if (v === null) continue;
    if (direcao === "max" ? v >= atual : v <= atual) return i >= C.recordeMinimoMeses ? anterior : undefined;
  }
  return null;
}

export function regraIpcaMeta({ s, mes }: ContextoRegras): Insight | null {
  const ultimo = ultimoMesAte(s.ipca, mes);
  const meta = ultimo ? metaDoAno(s.metas, anoDe(ultimo)) : null;
  if (!ultimo || !meta) return null;
  const ipca12 = valorOuNulo(acumulado12m(s.ipca, ultimo));
  if (ipca12 === null) return null;
  const teto = meta.centro + meta.tolerancia;
  const piso = meta.centro - meta.tolerancia;
  if (ipca12 <= teto && ipca12 >= piso) {
    return { id: "ipca_meta", severidade: "informativo", titulo: "Inflação dentro da banda da meta",
      texto: `IPCA 12m em ${formatarPercentual(ipca12)} em ${formatarMes(ultimo)}, dentro da banda (${formatarPercentual(piso, 1)} a ${formatarPercentual(teto, 1)}).` };
  }
  const acima = ipca12 > teto;
  let seguidos = 0;
  for (let m = ultimo; ; m = somarMeses(m, -1)) {
    const v = valorOuNulo(acumulado12m(s.ipca, m));
    const metaM = metaDoAno(s.metas, anoDe(m));
    if (v === null || !metaM || (acima ? v <= metaM.centro + metaM.tolerancia : v >= metaM.centro - metaM.tolerancia)) break;
    seguidos++;
  }
  return { id: "ipca_meta", severidade: "alerta", titulo: acima ? "IPCA acima do teto da meta" : "IPCA abaixo do piso da meta",
    texto: `IPCA 12m em ${formatarPercentual(ipca12)} em ${formatarMes(ultimo)}, ${acima ? "acima do teto" : "abaixo do piso"} (${formatarPercentual(acima ? teto : piso, 1)})${seguidos > 1 ? ` pelo ${seguidos}º mês seguido` : ""}.` };
}

export function regraJuroReal({ s, mes }: ContextoRegras): Insight | null {
  const ultimo = ultimoMesAte(s.ipca, mes);
  const ultimoCdi = ultimoMesAte(s.cdiMensal, mes);
  if (!ultimo || !ultimoCdi) return null;
  const ref = ultimo < ultimoCdi ? ultimo : ultimoCdi;
  const atual = juroRealExPost12m(s, ref);
  if (atual === null) return null;
  for (const direcao of ["max", "min"] as const) {
    const desde = recordeDesde((m) => juroRealExPost12m(s, m), ref, direcao);
    if (desde === undefined) continue;
    const quando = desde === null ? "da série disponível" : `desde ${formatarMes(desde)}`;
    return { id: "juro_real", severidade: "atencao", titulo: `Juro real no ${direcao === "max" ? "maior" : "menor"} nível ${quando}`,
      texto: `Juro real ex-post (CDI 12m descontado o IPCA 12m) em ${formatarPercentual(atual)} em ${formatarMes(ref)}.` };
  }
  return { id: "juro_real", severidade: "informativo", titulo: "Juro real ex-post",
    texto: `CDI 12m descontado o IPCA 12m: ${formatarPercentual(atual)} em ${formatarMes(ref)}.` };
}

export function regraDolar({ s, mes }: ContextoRegras): Insight | null {
  const fechado = ultimoMesAte(s.dolarVariacao, somarMeses(mes, -1));
  const variacao = fechado ? s.dolarVariacao.get(fechado) : undefined;
  if (!fechado || variacao === undefined || Math.abs(variacao) < C.variacaoDolarRelevante) return null;
  const direcao = variacao > 0 ? "max" : "min";
  const desde = recordeDesde((m) => s.dolarVariacao.get(m) ?? null, fechado, direcao);
  const recorde = desde === undefined ? "" : desde === null ? " — maior movimento da série disponível"
    : ` — maior ${variacao > 0 ? "alta" : "queda"} mensal desde ${formatarMes(desde)}`;
  return { id: "dolar_mes", severidade: "atencao", titulo: `Dólar ${variacao > 0 ? "subiu" : "caiu"} ${formatarPercentual(Math.abs(variacao), 1)} em ${formatarMes(fechado)}`,
    texto: `Variação da PTAX de venda no mês${recorde}.` };
}

export function regraSurpresaIpca({ s, dados, mes }: ContextoRegras): Insight | null {
  const ultimo = ultimoMesAte(s.ipca, mes);
  const sp = ultimo ? surpresaMensal(dados.focus, s.ipca, ultimo) : null;
  if (!ultimo || !sp || Math.abs(sp.diferenca) < C.surpresaIpcaRelevante) return null;
  return { id: "surpresa_ipca", severidade: sp.diferenca > 0 ? "alerta" : "informativo",
    titulo: `IPCA de ${formatarMes(ultimo)} veio ${formatarPontosPercentuais(sp.diferenca)} ${sp.diferenca > 0 ? "acima" : "abaixo"} do Focus`,
    texto: `Realizado ${formatarPercentual(sp.realizado)} contra mediana esperada de ${formatarPercentual(sp.esperado)}.` };
}

export function regraRevisaoFocus({ dados, mes }: ContextoRegras): Insight | null {
  const ano = anoDe(mes);
  const t = tendenciaRevisao(serieMediana(dados.focus, "ipca", "anual", String(ano)));
  if (!t) return null;
  const relevante = Math.abs(t.sequencia) >= C.sequenciaFocusRelevante
    || (t.variacao4Semanas !== null && Math.abs(t.variacao4Semanas) >= C.revisaoFocusRelevante);
  if (!relevante) return null;
  const direcao = direcaoRevisao(t);
  if (direcao === 0) return null;
  const anterior = t.variacao4Semanas === null ? null : t.atual - t.variacao4Semanas;
  const seq = Math.abs(t.sequencia) >= 2 ? ` — ${Math.abs(t.sequencia)}ª ${t.sequencia > 0 ? "alta" : "queda"} seguida` : "";
  return { id: "revisao_focus", severidade: direcao > 0 ? "atencao" : "informativo",
    titulo: `Focus ${direcao > 0 ? "elevou" : "reduziu"} o IPCA ${ano}`,
    texto: `Mediana ${anterior === null ? "" : `de ${formatarPercentual(anterior)} `}para ${formatarPercentual(t.atual)} em 4 semanas${seq}.` };
}

export function regraSpreadIgpm({ s, mes }: ContextoRegras): Insight | null {
  const a = ultimoMesAte(s.ipca, mes);
  const b = ultimoMesAte(s.igpm, mes);
  if (!a || !b) return null;
  const ref = a < b ? a : b;
  const spread = spreadIgpmIpca(s, ref);
  if (spread === null || Math.abs(spread) < C.spreadIgpmRelevante) return null;
  return { id: "spread_igpm", severidade: "informativo",
    titulo: `IGP-M 12m ${formatarPontosPercentuais(spread)} ${spread > 0 ? "acima" : "abaixo"} do IPCA`,
    texto: spread > 0 ? "Reajustes de contratos por IGP-M ficam mais caros que a inflação ao consumidor."
      : "Reajustes de contratos por IGP-M ficam mais baratos que a inflação ao consumidor." };
}

export function regraGanhoRealAno({ s, mes }: ContextoRegras): Insight | null {
  const a = ultimoMesAte(s.ipca, mes);
  const b = ultimoMesAte(s.cdiMensal, mes);
  if (!a || !b) return null;
  const ref = a < b ? a : b;
  if (anoDe(ref) !== anoDe(mes)) return null;
  const cdi = valorOuNulo(acumuladoAno(s.cdiMensal, ref));
  const ipca = valorOuNulo(acumuladoAno(s.ipca, ref));
  if (cdi === null || ipca === null) return null;
  const real = juroReal(cdi, ipca);
  return { id: "ganho_real_ano", severidade: real < 0 ? "alerta" : "informativo",
    titulo: `No ano, CDI ${real >= 0 ? "ganhou" : "perdeu"} da inflação`,
    texto: `De janeiro a ${formatarMes(ref)}: CDI ${formatarPercentual(cdi)} contra IPCA ${formatarPercentual(ipca)} → ganho real de ${formatarPercentual(real)}.` };
}
