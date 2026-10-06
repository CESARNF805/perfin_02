import "server-only";
import type { Reuniao } from "@/types/google";
import { listarProximasReunioes } from "./agenda";
import { ErroGoogle, ErroGoogleDesconectado } from "./http";
import { obterAccessToken } from "./tokens";

export type ResultadoGoogle<T> = { ok: true; dados: T } | { ok: false; motivo: "desconectado" | "falha" };

/** Executa uma operação Google com o token do usuário, convertendo falhas em resultado tratável na tela. */
export async function comGoogle<T>(userId: string, operacao: (token: string) => Promise<T>): Promise<ResultadoGoogle<T>> {
  try {
    return { ok: true, dados: await operacao(await obterAccessToken(userId)) };
  } catch (erro) {
    if (erro instanceof ErroGoogleDesconectado) return { ok: false, motivo: "desconectado" };
    if (erro instanceof ErroGoogle) return { ok: false, motivo: "falha" };
    throw erro;
  }
}

export function reunioesDoUsuario(userId: string, dias = 7, limite = 10): Promise<ResultadoGoogle<Reuniao[]>> {
  return comGoogle(userId, (token) => listarProximasReunioes(token, dias, limite));
}
