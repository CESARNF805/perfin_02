/** Formatação única de números, moedas e datas no padrão pt-BR (fuso de São Paulo). */
import type { FormatoValor } from "@/types/visualizacao";

export const FUSO = "America/Sao_Paulo";
const LOCALE = "pt-BR";
const MESES_ABREV = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const numero = (casas: number) =>
  new Intl.NumberFormat(LOCALE, { minimumFractionDigits: casas, maximumFractionDigits: casas });

export function formatarNumero(valor: number | null | undefined, casas = 2): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return "—";
  return numero(casas).format(valor);
}

/** 4,52% */
export function formatarPercentual(valor: number | null | undefined, casas = 2): string {
  const texto = formatarNumero(valor, casas);
  return texto === "—" ? texto : `${texto}%`;
}

/** +0,12 p.p. */
export function formatarPontosPercentuais(valor: number | null | undefined, casas = 2): string {
  const texto = formatarNumero(valor, casas);
  if (texto === "—") return texto;
  return `${valor !== null && valor !== undefined && valor > 0 ? "+" : ""}${texto} p.p.`;
}

/** R$ 5,1234 */
export function formatarMoeda(valor: number | null | undefined, casas = 4): string {
  const texto = formatarNumero(valor, casas);
  return texto === "—" ? texto : `R$ ${texto}`;
}

export function formatarValor(valor: number | null | undefined, formato: FormatoValor): string {
  switch (formato) {
    case "pct":
      return formatarPercentual(valor);
    case "pp":
      return formatarPontosPercentuais(valor);
    case "brl":
      return formatarMoeda(valor);
    case "indice":
      return formatarNumero(valor, 2);
  }
}

/** "2026-08" → "ago/2026" */
export function formatarMes(mes: string): string {
  const [ano, m] = mes.split("-");
  const indice = Number(m) - 1;
  return `${MESES_ABREV[indice] ?? m}/${ano}`;
}

/** "2026-10-06" → "06/10/2026" (sem conversão de fuso: datas de calendário). */
export function formatarData(data: string): string {
  const [ano, mes, dia] = data.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

/** Data e hora de um instante (ISO com fuso) no horário de São Paulo. */
export function formatarDataHora(instante: string | Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(instante));
}

/** "ter., 07 out., 14:30" — para listas de reuniões. */
export function formatarDiaHora(instante: string | Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: FUSO,
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(instante));
}

export function formatarDiaSemana(instante: string | Date): string {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: FUSO, weekday: "short", day: "2-digit", month: "short" }).format(
    new Date(instante),
  );
}
