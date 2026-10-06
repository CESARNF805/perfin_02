/** Dados públicos lidos do Supabase (snapshot gerado pelo Portal Perfin e cartas publicadas). */
import { z } from "zod";

const pontoSchema = z.object({
  mes: z.string().regex(/^\d{4}-\d{2}$/),
  valor: z.number().nullable(),
  piso: z.number().nullable().optional(),
  teto: z.number().nullable().optional(),
});

const indicadorSchema = z.object({
  id: z.string(),
  nome: z.string(),
  grafico: z.enum(["linha", "barra"]),
  formato: z.enum(["pct", "brl"]),
  rotuloSerie: z.string(),
  destaque: z.object({ rotulo: z.string(), valor: z.number().nullable(), detalhe: z.string() }),
  serie: z.array(pontoSchema),
});

export const painelPublicoSchema = z.object({
  versao: z.literal(1),
  atualizadoEm: z.string(),
  referencia: z.string(),
  indicadores: z.array(indicadorSchema),
});

export type PainelPublico = z.infer<typeof painelPublicoSchema>;
export type IndicadorPublico = z.infer<typeof indicadorSchema>;

export interface CartaPublica {
  id: string;
  mes_referencia: string;
  titulo: string;
  corpo: string;
  publicada_em: string | null;
}
