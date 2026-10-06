import { NextResponse, type NextRequest } from "next/server";
import { envPublico } from "@/lib/env-publico";
import { envServidor } from "@/lib/env";
import { googleAutorizado } from "@/lib/auth/regras";
import { registrarAcessoUsuario } from "@/lib/auth/perfis";
import { salvarTokensGoogle } from "@/lib/google/tokens";
import { clienteSupabase } from "@/lib/supabase/servidor";

function para(caminho: string) {
  return NextResponse.redirect(`${envPublico().NEXT_PUBLIC_SITE_URL}${caminho}`);
}

/** Retorno do login Google: valida domínio e e-mail, cria o perfil e guarda os tokens cifrados. */
export async function GET(request: NextRequest) {
  const codigo = request.nextUrl.searchParams.get("code");
  if (!codigo) return para("/login?erro=callback");

  const db = await clienteSupabase();
  const { data, error } = await db.auth.exchangeCodeForSession(codigo);
  if (error || !data.session) return para("/login?erro=callback");

  const { user, session } = data;
  const metadados = user.user_metadata ?? {};
  const autorizado = googleAutorizado(
    {
      email: user.email,
      emailVerificado: Boolean(user.email_confirmed_at) && metadados.email_verified !== false,
      dominioHospedado: metadados.custom_claims?.hd ?? null,
    },
    envServidor().ALLOWED_GOOGLE_DOMAIN,
  );
  if (!autorizado || !user.email) {
    await db.auth.signOut();
    return para("/acesso-negado");
  }

  const nome = typeof metadados.full_name === "string" ? metadados.full_name : null;
  const resultado = await registrarAcessoUsuario(user.id, user.email.toLowerCase(), nome);
  if (resultado !== "ok") {
    await db.auth.signOut();
    return para(resultado === "bloqueado" ? "/acesso-negado?motivo=bloqueado" : "/acesso-negado");
  }

  if (session.provider_refresh_token) {
    try {
      await salvarTokensGoogle(user.id, session.provider_refresh_token, session.provider_token ?? null);
    } catch {
      // O portal funciona sem Google (Agenda/Relatório pedirão para reconectar). Log sem dados sensíveis.
      console.error("[auth/callback] Falha ao guardar a conexão Google do usuário.");
    }
  }
  return para("/");
}
