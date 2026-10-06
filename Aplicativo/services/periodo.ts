/** Filtro global de período: lido da URL, validado e convertido em meses. */
import { z } from "zod";
import type { Mes, Periodo, PresetPeriodo } from "@/types/indicadores";
import { mesAtual, somarMeses } from "./calculos/meses";

export const MES_MINIMO: Mes = "2010-01";
export const PRESET_PADRAO: PresetPeriodo = "12m";

export const PRESETS: { valor: PresetPeriodo; rotulo: string }[] = [
  { valor: "mes", rotulo: "Mês atual" },
  { valor: "12m", rotulo: "12 meses" },
  { valor: "24m", rotulo: "24 meses" },
  { valor: "5a", rotulo: "5 anos" },
  { valor: "ano", rotulo: "Ano corrente" },
  { valor: "personalizado", rotulo: "Personalizado" },
];

const mesSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

const parametrosSchema = z.object({
  periodo: z.enum(["mes", "12m", "24m", "5a", "ano", "personalizado"]).catch(PRESET_PADRAO),
  de: mesSchema.optional().catch(undefined),
  ate: mesSchema.optional().catch(undefined),
});

export type ParametrosBusca = Record<string, string | string[] | undefined>;

function primeiro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

function limitar(mes: Mes, minimo: Mes, maximo: Mes): Mes {
  return mes < minimo ? minimo : mes > maximo ? maximo : mes;
}

/** Converte os parâmetros da URL num período válido. Valores inválidos caem no padrão. */
export function resolverPeriodo(parametros: ParametrosBusca, hoje: Mes = mesAtual()): Periodo {
  const p = parametrosSchema.parse({
    periodo: primeiro(parametros.periodo),
    de: primeiro(parametros.de),
    ate: primeiro(parametros.ate),
  });
  const fim = hoje;
  switch (p.periodo) {
    case "mes":
      return { preset: "mes", inicio: fim, fim };
    case "24m":
      return { preset: "24m", inicio: somarMeses(fim, -23), fim };
    case "5a":
      return { preset: "5a", inicio: somarMeses(fim, -59), fim };
    case "ano":
      return { preset: "ano", inicio: `${fim.slice(0, 4)}-01`, fim };
    case "personalizado": {
      if (!p.de || !p.ate) break;
      const inicio = limitar(p.de < p.ate ? p.de : p.ate, MES_MINIMO, hoje);
      const final = limitar(p.de < p.ate ? p.ate : p.de, MES_MINIMO, hoje);
      return { preset: "personalizado", inicio, fim: final };
    }
    case "12m":
      break;
  }
  return { preset: "12m", inicio: somarMeses(fim, -11), fim };
}

/** Parâmetros de URL que reproduzem o período (para links e para o assistente). */
export function periodoParaParametros(periodo: Periodo): Record<string, string> {
  if (periodo.preset === "personalizado") return { periodo: "personalizado", de: periodo.inicio, ate: periodo.fim };
  return { periodo: periodo.preset };
}

export const periodoSchema = z.object({
  preset: z.enum(["mes", "12m", "24m", "5a", "ano", "personalizado"]),
  inicio: mesSchema,
  fim: mesSchema,
});
