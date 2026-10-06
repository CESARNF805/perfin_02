import "server-only";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { painelPublicoSchema, type CartaPublica, type PainelPublico } from "@/types/publico";

/** Acesso único ao Supabase do site: só leitura, chave publishable, RLS libera apenas dados publicados. */
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(10),
});

function cliente() {
  const env = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  if (!env.success) throw new Error("Variáveis NEXT_PUBLIC_SUPABASE_* ausentes ou inválidas.");
  return createClient(env.data.NEXT_PUBLIC_SUPABASE_URL, env.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const COLUNAS_CARTA = "id, mes_referencia, titulo, corpo, publicada_em";

/** Painel público já calculado pelo Portal. Null se ainda não foi publicado ou se o formato for inválido. */
export async function buscarPainelPublico(): Promise<PainelPublico | null> {
  const { data, error } = await cliente().from("painel_publico").select("dados").eq("id", 1).maybeSingle();
  if (error) throw new Error("Não foi possível carregar os indicadores.");
  const resultado = painelPublicoSchema.safeParse(data?.dados);
  return resultado.success ? resultado.data : null;
}

export async function listarCartas(): Promise<CartaPublica[]> {
  const { data, error } = await cliente()
    .from("cartas_mensais")
    .select(COLUNAS_CARTA)
    .eq("status", "publicada")
    .order("mes_referencia", { ascending: false })
    .limit(36);
  if (error) throw new Error("Não foi possível carregar as cartas.");
  return (data ?? []) as CartaPublica[];
}

/** Carta publicada de um mês (AAAA-MM). */
export async function buscarCarta(mes: string): Promise<CartaPublica | null> {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) return null;
  const { data, error } = await cliente()
    .from("cartas_mensais")
    .select(COLUNAS_CARTA)
    .eq("status", "publicada")
    .eq("mes_referencia", `${mes}-01`)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar a carta.");
  return (data as CartaPublica | null) ?? null;
}
