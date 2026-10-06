import "server-only";
import { createClient } from "@supabase/supabase-js";
import { envPublico } from "@/lib/env-publico";
import { envServidor } from "@/lib/env";

/**
 * Cliente com a secret key: IGNORA o RLS. Usar só no servidor e só para operações que o
 * próprio servidor controla (perfis, tokens Google, snapshot público, cron).
 */
export function clienteSupabaseAdmin() {
  return createClient(envPublico().NEXT_PUBLIC_SUPABASE_URL, envServidor().SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
