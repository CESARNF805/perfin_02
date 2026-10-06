"use server";

import { redirect } from "next/navigation";
import { envPublico } from "@/lib/env-publico";
import { envServidor } from "@/lib/env";
import { ESCOPOS_GOOGLE } from "@/lib/google/tokens";
import { clienteSupabase } from "@/lib/supabase/servidor";

/** Inicia o login Google (PKCE). Pede acesso offline para receber o refresh token. */
export async function entrarComGoogle(): Promise<void> {
  const db = await clienteSupabase();
  const { data, error } = await db.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${envPublico().NEXT_PUBLIC_SITE_URL}/auth/callback`,
      scopes: ESCOPOS_GOOGLE.join(" "),
      queryParams: { access_type: "offline", prompt: "consent", hd: envServidor().ALLOWED_GOOGLE_DOMAIN },
    },
  });
  if (error || !data.url) redirect("/login?erro=google");
  redirect(data.url);
}
