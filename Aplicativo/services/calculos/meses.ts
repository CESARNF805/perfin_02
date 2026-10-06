/** Utilitários de calendário para meses no formato AAAA-MM. */
import type { DataIso, Mes } from "@/types/indicadores";

export function mesDe(data: DataIso): Mes {
  return data.slice(0, 7);
}

export function somarMeses(mes: Mes, quantidade: number): Mes {
  const [ano, m] = mes.split("-").map(Number) as [number, number];
  const total = ano * 12 + (m - 1) + quantidade;
  const novoAno = Math.floor(total / 12);
  const novoMes = (total % 12) + 1;
  return `${novoAno}-${String(novoMes).padStart(2, "0")}`;
}

/** Lista todos os meses de `inicio` a `fim`, inclusive. */
export function listarMeses(inicio: Mes, fim: Mes): Mes[] {
  const meses: Mes[] = [];
  for (let atual = inicio; atual <= fim; atual = somarMeses(atual, 1)) meses.push(atual);
  return meses;
}

export function anoDe(mes: Mes): number {
  return Number(mes.slice(0, 4));
}

/** Mês corrente no fuso de São Paulo. */
export function mesAtual(agora: Date = new Date()): Mes {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(agora);
  const ano = partes.find((p) => p.type === "year")?.value;
  const mes = partes.find((p) => p.type === "month")?.value;
  return `${ano}-${mes}`;
}
