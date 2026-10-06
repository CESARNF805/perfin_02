import { NextResponse } from "next/server";
import { z } from "zod";
import { obterSessao } from "@/lib/auth/sessao";
import { MIME_XLSX } from "@/lib/google/planilhas";
import { clienteSupabase } from "@/lib/supabase/servidor";
import { baixarXlsx, buscarRelatorio, nomeArquivo } from "@/services/relatorios";

/** Download do relatório em .xlsx (exportado pelo Drive do próprio usuário). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await obterSessao();
  if (!sessao?.membro) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) return NextResponse.json({ erro: "Relatório inválido." }, { status: 400 });

  const relatorio = await buscarRelatorio(await clienteSupabase(), id.data);
  if (!relatorio) return NextResponse.json({ erro: "Relatório não encontrado." }, { status: 404 });

  const arquivo = await baixarXlsx(sessao.userId, relatorio);
  if (!arquivo.ok) {
    const status = arquivo.motivo === "desconectado" ? 401 : 502;
    return NextResponse.json({ erro: "Não foi possível baixar do Google Drive." }, { status });
  }
  return new NextResponse(arquivo.dados, {
    headers: {
      "Content-Type": MIME_XLSX,
      "Content-Disposition": `attachment; filename="${nomeArquivo(relatorio)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
