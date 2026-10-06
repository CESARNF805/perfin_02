/** Publicação no site: seleção do painel público e snapshot calculado. */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { SelecaoPublica } from "@/types/publicacao";
import type { Resultado } from "@/lib/mensagens-admin";
import { clienteSupabaseAdmin } from "@/lib/supabase/admin";
import { mesAtual, somarMeses } from "./calculos/meses";
import { falha } from "./admin";
import { carregarDados } from "./indicadores";
import { MESES_PUBLICOS, montarSnapshot } from "./publicacao";

export async function listarSelecao(db: SupabaseClient): Promise<SelecaoPublica[]> {
  const { data, error } = await db.from("publicacao_indicadores").select("indicador_id, visivel, ordem, grafico");
  if (error) throw new Error("Não foi possível ler a seleção pública.");
  return (data ?? []) as SelecaoPublica[];
}

/** Recalcula e grava o snapshot público. Usa a secret key (chamado só pelo admin ou pelo cron). */
export async function atualizarPainelPublico(): Promise<Resultado> {
  const db = clienteSupabaseAdmin();
  const hoje = mesAtual();
  const selecao = await listarSelecao(db);
  const dados = await carregarDados(db, somarMeses(hoje, -(MESES_PUBLICOS + 12)), hoje);
  const snapshot = montarSnapshot(dados, selecao, hoje);
  const { error } = await db.from("painel_publico").upsert({ id: 1, dados: snapshot, atualizado_em: snapshot.atualizadoEm });
  return error ? falha("falha_gravacao") : { ok: true };
}

const selecaoSchema = z
  .array(
    z.object({
      indicador_id: z.string().regex(/^[a-z0-9_]{2,40}$/),
      visivel: z.boolean(),
      ordem: z.number().int().min(0).max(10000),
      grafico: z.enum(["linha", "barra"]),
    }),
  )
  .max(50);

export async function salvarSelecao(db: SupabaseClient, entrada: unknown): Promise<Resultado> {
  const dados = selecaoSchema.safeParse(entrada);
  if (!dados.success) return falha("dados_invalidos");
  const { error } = await db.from("publicacao_indicadores").upsert(dados.data, { onConflict: "indicador_id" });
  if (error) return falha("falha_gravacao");
  return atualizarPainelPublico();
}
