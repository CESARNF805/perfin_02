import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { envPublico } from "@/lib/env-publico";

/** Rotas acessíveis sem sessão. */
const ROTAS_PUBLICAS = ["/login", "/acesso-negado", "/auth/callback", "/admin/login", "/offline", "/api/cron/"];

export function rotaPublica(caminho: string): boolean {
  return ROTAS_PUBLICAS.some((r) => caminho === r || (r.endsWith("/") ? caminho.startsWith(r) : caminho.startsWith(`${r}/`)));
}

/** Renova a sessão do Supabase a cada requisição e manda quem não está logado para /login. */
export async function atualizarSessao(request: NextRequest): Promise<NextResponse> {
  const env = envPublico();
  let resposta = NextResponse.next({ request });
  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista) => {
        for (const { name, value } of lista) request.cookies.set(name, value);
        resposta = NextResponse.next({ request });
        for (const { name, value, options } of lista) resposta.cookies.set(name, value, options);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const caminho = request.nextUrl.pathname;
  if (!data?.claims && !rotaPublica(caminho)) {
    if (caminho.startsWith("/api/")) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return resposta;
}
