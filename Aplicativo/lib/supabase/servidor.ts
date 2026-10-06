import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { envPublico } from "@/lib/env-publico";

/** Cliente Supabase com a sessão do usuário (cookies). Todas as consultas passam pelo RLS. */
export async function clienteSupabase() {
  // cookies() primeiro: marca a rota como dinâmica antes de qualquer outra coisa (nada de pré-render estático).
  const armazenamento = await cookies();
  const env = envPublico();
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => armazenamento.getAll(),
      setAll: (lista) => {
        try {
          for (const { name, value, options } of lista) armazenamento.set(name, value, options);
        } catch {
          // Em Server Components não é possível gravar cookies; o proxy renova a sessão.
        }
      },
    },
  });
}
