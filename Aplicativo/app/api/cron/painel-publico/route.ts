import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { envServidor } from "@/lib/env";
import { atualizarPainelPublico } from "@/services/site";

function autorizado(cabecalho: string | null): boolean {
  const esperado = Buffer.from(`Bearer ${envServidor().CRON_SECRET}`);
  const recebido = Buffer.from(cabecalho ?? "");
  return recebido.length === esperado.length && timingSafeEqual(recebido, esperado);
}

/** Chamado pelo Vercel Cron (Authorization: Bearer CRON_SECRET) para recalcular o painel público. */
export async function GET(request: Request) {
  if (!autorizado(request.headers.get("authorization"))) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }
  const resultado = await atualizarPainelPublico();
  return NextResponse.json(resultado.ok ? { ok: true } : { ok: false }, { status: resultado.ok ? 200 : 500 });
}
