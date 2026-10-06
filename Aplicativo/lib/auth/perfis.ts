import "server-only";
import { clienteSupabaseAdmin } from "@/lib/supabase/admin";

export type ResultadoPerfil = "ok" | "bloqueado" | "erro";

/** Cria o perfil de usuário no primeiro login (papel 'usuario') ou atualiza o último acesso. */
export async function registrarAcessoUsuario(userId: string, email: string, nome: string | null): Promise<ResultadoPerfil> {
  const db = clienteSupabaseAdmin();
  const { data: existente, error } = await db.from("perfis").select("bloqueado").eq("user_id", userId).maybeSingle();
  if (error) return "erro";
  if (existente?.bloqueado) return "bloqueado";
  const agora = new Date().toISOString();
  const { error: erroGravacao } = existente
    ? await db.from("perfis").update({ ultimo_acesso: agora, nome }).eq("user_id", userId)
    : await db.from("perfis").insert({ user_id: userId, email, nome, papel: "usuario", ultimo_acesso: agora });
  return erroGravacao ? "erro" : "ok";
}

/** Garante o papel admin para o e-mail de ADMIN_USER (chamado só após login por senha válido). */
export async function registrarAcessoAdmin(userId: string, email: string): Promise<ResultadoPerfil> {
  const db = clienteSupabaseAdmin();
  const { data: existente, error: erroLeitura } = await db.from("perfis").select("bloqueado").eq("user_id", userId).maybeSingle();
  if (erroLeitura) return "erro";
  if (existente?.bloqueado) return "bloqueado";
  const { error } = await db
    .from("perfis")
    .upsert({ user_id: userId, email, papel: "admin", ultimo_acesso: new Date().toISOString() }, { onConflict: "user_id" });
  return error ? "erro" : "ok";
}
