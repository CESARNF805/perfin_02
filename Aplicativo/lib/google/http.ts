import "server-only";

/** O usuário precisa entrar de novo com o Google (token ausente, expirado ou revogado). */
export class ErroGoogleDesconectado extends Error {
  constructor() {
    super("Conta Google desconectada. Entre novamente com o Google.");
  }
}

/** Falha numa API do Google. A mensagem é genérica: detalhes internos não vão para a tela. */
export class ErroGoogle extends Error {
  constructor(
    public readonly api: string,
    public readonly status: number,
  ) {
    super(`Falha ao acessar o Google ${api} (HTTP ${status}).`);
  }
}

export async function googleFetch(api: string, token: string, url: string, init: RequestInit = {}): Promise<Response> {
  const resposta = await fetch(url, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (resposta.status === 401) throw new ErroGoogleDesconectado();
  if (!resposta.ok) throw new ErroGoogle(api, resposta.status);
  return resposta;
}

export async function googleJson<T>(api: string, token: string, url: string, init: RequestInit = {}): Promise<T> {
  const resposta = await googleFetch(api, token, url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  return (await resposta.json()) as T;
}
