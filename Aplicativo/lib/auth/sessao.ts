import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { envServidor } from "@/lib/env";
import { clienteSupabase } from "@/lib/supabase/servidor";
import { ehEmailAdmin, sessaoComSenha, sessaoComSenhaEMfa, type ClaimsSessao } from "./regras";

export interface Sessao {
  userId: string;
  email: string;
  nome: string | null;
  /** Tem perfil válido e não bloqueado. */
  membro: boolean;
  /** Papel cadastrado (pode ser admin mesmo numa sessão sem MFA). */
  papel: "admin" | "usuario" | null;
  /** Poderes de admin ativos nesta sessão (senha + MFA). */
  ehAdmin: boolean;
  /** Sessão aberta com senha (admin), aguardando ou não o MFA. */
  sessaoSenha: boolean;
}

/** Lê e valida a sessão no servidor (JWT verificado pelo Supabase) e o perfil no banco. */
export const obterSessao = cache(async (): Promise<Sessao | null> => {
  const db = await clienteSupabase();
  const { data, error } = await db.auth.getClaims();
  const claims = data?.claims as ClaimsSessao | undefined;
  if (error || !claims?.sub) return null;
  const { data: perfil } = await db
    .from("perfis")
    .select("email, nome, papel, bloqueado")
    .eq("user_id", claims.sub)
    .maybeSingle();
  const membro = Boolean(perfil && !perfil.bloqueado);
  const papel = (perfil?.papel as Sessao["papel"]) ?? null;
  const ehAdmin = membro && papel === "admin" && ehEmailAdmin(perfil?.email, envServidor().ADMIN_USER) && sessaoComSenhaEMfa(claims);
  return {
    userId: claims.sub,
    email: perfil?.email ?? claims.email ?? "",
    nome: perfil?.nome ?? null,
    membro,
    papel,
    ehAdmin,
    sessaoSenha: sessaoComSenha(claims),
  };
});

/** Exige usuário logado e autorizado; caso contrário redireciona. */
export async function exigirUsuario(): Promise<Sessao> {
  const sessao = await obterSessao();
  if (!sessao) redirect("/login");
  if (!sessao.membro) redirect("/acesso-negado");
  if (sessao.sessaoSenha && sessao.papel === "admin" && !sessao.ehAdmin) redirect("/admin/mfa");
  return sessao;
}

/** Exige sessão de admin com senha + MFA. */
export async function exigirAdmin(): Promise<Sessao> {
  const sessao = await exigirUsuario();
  if (!sessao.ehAdmin) redirect("/acesso-negado?motivo=admin");
  return sessao;
}
