import "server-only";
import { envServidor } from "@/lib/env";
import { cifrar, decifrar } from "@/lib/cripto";
import { clienteSupabaseAdmin } from "@/lib/supabase/admin";
import { ErroGoogleDesconectado } from "./http";

export const ESCOPOS_GOOGLE = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.events.readonly",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/gmail.compose",
];

/** Margem para renovar o access token antes de expirar. */
const MARGEM_MS = 2 * 60 * 1000;
const VALIDADE_PADRAO_S = 3600;

export async function salvarTokensGoogle(userId: string, refreshToken: string, accessToken: string | null): Promise<void> {
  const chave = envServidor().TOKEN_ENCRYPTION_KEY;
  const { error } = await clienteSupabaseAdmin().from("google_tokens").upsert({
    user_id: userId,
    refresh_token_cifrado: cifrar(refreshToken, chave),
    access_token_cifrado: accessToken ? cifrar(accessToken, chave) : null,
    expira_em: accessToken ? new Date(Date.now() + VALIDADE_PADRAO_S * 1000).toISOString() : null,
    escopos: ESCOPOS_GOOGLE.join(" "),
    atualizado_em: new Date().toISOString(),
  });
  if (error) throw new Error("Não foi possível guardar a conexão com o Google.");
}

export async function removerTokensGoogle(userId: string): Promise<void> {
  await clienteSupabaseAdmin().from("google_tokens").delete().eq("user_id", userId);
}

async function renovar(userId: string, refreshCifrado: string): Promise<string> {
  const env = envServidor();
  const resposta = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: decifrar(refreshCifrado, env.TOKEN_ENCRYPTION_KEY),
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
    }),
    cache: "no-store",
  });
  if (!resposta.ok) {
    if (resposta.status === 400 || resposta.status === 401) await removerTokensGoogle(userId);
    throw new ErroGoogleDesconectado();
  }
  const corpo = (await resposta.json()) as { access_token: string; expires_in?: number };
  await clienteSupabaseAdmin()
    .from("google_tokens")
    .update({
      access_token_cifrado: cifrar(corpo.access_token, env.TOKEN_ENCRYPTION_KEY),
      expira_em: new Date(Date.now() + (corpo.expires_in ?? VALIDADE_PADRAO_S) * 1000).toISOString(),
      atualizado_em: new Date().toISOString(),
    })
    .eq("user_id", userId);
  return corpo.access_token;
}

/** Access token válido do usuário; renova com o refresh token quando necessário. */
export async function obterAccessToken(userId: string): Promise<string> {
  const { data } = await clienteSupabaseAdmin()
    .from("google_tokens")
    .select("refresh_token_cifrado, access_token_cifrado, expira_em")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) throw new ErroGoogleDesconectado();
  const valido = data.access_token_cifrado && data.expira_em && new Date(data.expira_em).getTime() - MARGEM_MS > Date.now();
  if (valido) return decifrar(data.access_token_cifrado!, envServidor().TOKEN_ENCRYPTION_KEY);
  return renovar(userId, data.refresh_token_cifrado);
}

export async function temConexaoGoogle(userId: string): Promise<boolean> {
  const { data } = await clienteSupabaseAdmin().from("google_tokens").select("user_id").eq("user_id", userId).maybeSingle();
  return Boolean(data);
}
