"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { envServidor } from "@/lib/env";
import { ehEmailAdmin, sessaoComSenha, type ClaimsSessao } from "@/lib/auth/regras";
import { registrarAcessoAdmin } from "@/lib/auth/perfis";
import { clienteSupabase } from "@/lib/supabase/servidor";

export interface EstadoFormulario {
  erro?: string;
}

export interface EstadoCadastroMfa extends EstadoFormulario {
  factorId?: string;
  qrCode?: string;
  segredo?: string;
}

const CREDENCIAIS_INVALIDAS = "E-mail ou senha inválidos.";

const loginSchema = z.object({
  email: z.email().max(200),
  senha: z.string().min(8).max(200),
});

export async function entrarComoAdmin(_anterior: EstadoFormulario, formulario: FormData): Promise<EstadoFormulario> {
  const dados = loginSchema.safeParse({ email: formulario.get("email"), senha: formulario.get("senha") });
  if (!dados.success) return { erro: CREDENCIAIS_INVALIDAS };
  // A mensagem é a mesma para qualquer falha, para não revelar qual e-mail é o do admin.
  if (!ehEmailAdmin(dados.data.email, envServidor().ADMIN_USER)) return { erro: CREDENCIAIS_INVALIDAS };

  const db = await clienteSupabase();
  const { data, error } = await db.auth.signInWithPassword({ email: dados.data.email, password: dados.data.senha });
  if (error || !data.user) return { erro: CREDENCIAIS_INVALIDAS };

  const resultado = await registrarAcessoAdmin(data.user.id, dados.data.email.toLowerCase());
  if (resultado !== "ok") {
    await db.auth.signOut();
    return { erro: resultado === "bloqueado" ? "Acesso bloqueado." : "Não foi possível concluir o login." };
  }
  redirect("/admin/mfa");
}

/** Confirma que há sessão aberta com senha do e-mail admin (pré-requisito do MFA). */
async function sessaoSenhaAdmin() {
  const db = await clienteSupabase();
  const { data } = await db.auth.getClaims();
  const claims = data?.claims as ClaimsSessao | undefined;
  if (!claims || !sessaoComSenha(claims) || !ehEmailAdmin(claims.email, envServidor().ADMIN_USER)) return null;
  return db;
}

export async function iniciarCadastroMfa(): Promise<EstadoCadastroMfa> {
  const db = await sessaoSenhaAdmin();
  if (!db) return { erro: "Sessão expirada. Entre novamente." };
  const { data: fatores, error: erroFatores } = await db.auth.mfa.listFactors();
  if (erroFatores) return { erro: "Não foi possível verificar o segundo fator." };
  // Já existe autenticador: cadastrar outro exige a verificação do atual (nunca por esta tela).
  if (fatores?.totp.some((f) => f.status === "verified")) return { erro: "Autenticador já cadastrado. Use o código dele." };
  for (const fator of fatores?.all ?? []) {
    if (fator.status === "unverified") await db.auth.mfa.unenroll({ factorId: fator.id });
  }
  const { data, error } = await db.auth.mfa.enroll({ factorType: "totp", friendlyName: "Portal Perfin" });
  if (error || !data) return { erro: "Não foi possível iniciar a verificação em duas etapas." };
  return { factorId: data.id, qrCode: data.totp.qr_code, segredo: data.totp.secret };
}

const codigoSchema = z.object({
  factorId: z.uuid(),
  codigo: z.string().regex(/^\d{6}$/),
});

export async function verificarMfa(_anterior: EstadoFormulario, formulario: FormData): Promise<EstadoFormulario> {
  const dados = codigoSchema.safeParse({ factorId: formulario.get("factorId"), codigo: formulario.get("codigo") });
  if (!dados.success) return { erro: "Informe o código de 6 dígitos." };
  const db = await sessaoSenhaAdmin();
  if (!db) return { erro: "Sessão expirada. Entre novamente." };
  const { error } = await db.auth.mfa.challengeAndVerify({ factorId: dados.data.factorId, code: dados.data.codigo });
  if (error) return { erro: "Código inválido ou expirado." };
  redirect("/admin");
}
