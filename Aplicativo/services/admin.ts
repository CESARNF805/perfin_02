/** Regras e validações da área de administração. As escritas usam o cliente do admin (RLS is_admin). */
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { CodigoMensagem, Resultado } from "@/lib/mensagens-admin";

export interface PerfilListado {
  user_id: string;
  email: string;
  nome: string | null;
  papel: "admin" | "usuario";
  bloqueado: boolean;
  ultimo_acesso: string | null;
}

export const falha = (erro: CodigoMensagem): Resultado => ({ ok: false, erro });

export async function listarPerfis(db: SupabaseClient): Promise<PerfilListado[]> {
  const { data, error } = await db
    .from("perfis")
    .select("user_id, email, nome, papel, bloqueado, ultimo_acesso")
    .order("ultimo_acesso", { ascending: false, nullsFirst: false });
  if (error) throw new Error("Não foi possível listar os usuários.");
  return (data ?? []) as PerfilListado[];
}

const bloqueioSchema = z.object({ userId: z.uuid(), bloquear: z.enum(["sim", "nao"]) });

export async function definirBloqueio(db: SupabaseClient, entrada: unknown): Promise<Resultado> {
  const dados = bloqueioSchema.safeParse(entrada);
  if (!dados.success) return falha("pedido_invalido");
  const { error, count } = await db
    .from("perfis")
    .update({ bloqueado: dados.data.bloquear === "sim" }, { count: "exact" })
    .eq("user_id", dados.data.userId)
    .eq("papel", "usuario");
  if (error || count === 0) return falha("falha_gravacao");
  return { ok: true };
}

export const novoIndicadorSchema = z.object({
  id: z.string().regex(/^[a-z0-9_]{2,40}$/),
  nome: z.string().trim().min(2).max(80),
  grupo: z.enum(["inflacao", "juros", "cambio", "atividade", "outros"]),
  unidade: z.enum(["pct_am", "pct_ad", "pct_aa", "brl"]),
  periodicidade: z.enum(["diaria", "mensal"]),
  serie_sgs: z.coerce.number().int().positive().max(99999999),
  ordem: z.coerce.number().int().min(0).max(10000).default(500),
});

export async function criarIndicador(db: SupabaseClient, entrada: unknown): Promise<Resultado> {
  const dados = novoIndicadorSchema.safeParse(entrada);
  if (!dados.success) return falha("dados_invalidos");
  const { error } = await db.from("indicadores").insert({ ...dados.data, fonte: "BCB/SGS" });
  if (error) return falha(error.code === "23505" ? "indicador_duplicado" : "falha_gravacao");
  return { ok: true };
}

const ativoSchema = z.object({ id: z.string().regex(/^[a-z0-9_]{2,40}$/), ativo: z.enum(["sim", "nao"]) });

export async function alternarIndicador(db: SupabaseClient, entrada: unknown): Promise<Resultado> {
  const dados = ativoSchema.safeParse(entrada);
  if (!dados.success) return falha("pedido_invalido");
  const { error } = await db.from("indicadores").update({ ativo: dados.data.ativo === "sim" }).eq("id", dados.data.id);
  return error ? falha("falha_gravacao") : { ok: true };
}

const metaSchema = z.object({
  ano: z.coerce.number().int().min(1999).max(2100),
  centro: z.coerce.number().min(0).max(50),
  tolerancia: z.coerce.number().min(0).max(20),
});

export async function salvarMeta(db: SupabaseClient, entrada: unknown): Promise<Resultado> {
  const dados = metaSchema.safeParse(entrada);
  if (!dados.success) return falha("dados_invalidos");
  const { error } = await db.from("metas_inflacao").upsert(dados.data, { onConflict: "ano" });
  return error ? falha("falha_gravacao") : { ok: true };
}
