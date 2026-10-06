/** Orquestra o relatório do mês: dados → planilha Google → registro; .xlsx e rascunho no Gmail. */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Relatorio } from "@/types/google";
import { formatarMes } from "@/lib/formatacao";
import { criarRascunho } from "@/lib/google/gmail";
import { comGoogle, type ResultadoGoogle } from "@/lib/google/servico";
import { criarPlanilha, exportarXlsx, MIME_XLSX } from "@/lib/google/planilhas";
import { mesAtual } from "./calculos/meses";
import { carregarDados } from "./indicadores";
import { inicioVisaoGeral } from "./painel/visaoGeral";
import { mesDoRelatorio, montarAbas, tituloRelatorio, type MesRelatorio } from "./relatorio";

export type ResultadoRelatorio = ResultadoGoogle<string> | { ok: false; motivo: "dados" | "banco" };

export async function verificarMesDoRelatorio(db: SupabaseClient): Promise<MesRelatorio> {
  const hoje = mesAtual();
  return mesDoRelatorio(await carregarDados(db, hoje, hoje), hoje);
}

export async function listarRelatorios(db: SupabaseClient): Promise<Relatorio[]> {
  const { data, error } = await db
    .from("relatorios")
    .select("id, mes_referencia, planilha_id, planilha_url, rascunho_gmail_id, criado_em")
    .order("criado_em", { ascending: false })
    .limit(24);
  if (error) throw new Error("Não foi possível listar os relatórios.");
  return (data ?? []) as Relatorio[];
}

export async function gerarRelatorioDoMes(db: SupabaseClient, userId: string): Promise<ResultadoRelatorio> {
  const hoje = mesAtual();
  const dados = await carregarDados(db, inicioVisaoGeral(hoje), hoje);
  const ref = mesDoRelatorio(dados, hoje);
  if (!ref.ok) return { ok: false, motivo: "dados" };
  const planilha = await comGoogle(userId, (token) => criarPlanilha(token, tituloRelatorio(ref.mes), montarAbas(dados, ref.mes)));
  if (!planilha.ok) return planilha;
  const { error } = await db.from("relatorios").insert({
    mes_referencia: `${ref.mes}-01`,
    planilha_id: planilha.dados.id,
    planilha_url: planilha.dados.url,
  });
  return error ? { ok: false, motivo: "banco" } : { ok: true, dados: planilha.dados.id };
}

export async function buscarRelatorio(db: SupabaseClient, id: string): Promise<Relatorio | null> {
  const { data } = await db
    .from("relatorios")
    .select("id, mes_referencia, planilha_id, planilha_url, rascunho_gmail_id, criado_em")
    .eq("id", id)
    .maybeSingle();
  return (data as Relatorio | null) ?? null;
}

export function nomeArquivo(relatorio: Relatorio): string {
  return `portal-perfin-${relatorio.mes_referencia.slice(0, 7)}.xlsx`;
}

export function baixarXlsx(userId: string, relatorio: Relatorio): Promise<ResultadoGoogle<ArrayBuffer>> {
  return comGoogle(userId, (token) => exportarXlsx(token, relatorio.planilha_id));
}

/** Cria o rascunho com o .xlsx anexado. Nunca envia: o usuário revisa e envia pelo Gmail. */
export async function criarRascunhoDoRelatorio(db: SupabaseClient, userId: string, relatorio: Relatorio): Promise<ResultadoRelatorio> {
  const mes = formatarMes(relatorio.mes_referencia.slice(0, 7));
  const rascunho = await comGoogle(userId, async (token) => {
    const xlsx = await exportarXlsx(token, relatorio.planilha_id);
    return criarRascunho(token, {
      assunto: `Portal Perfin — Indicadores de ${mes}`,
      corpo: [
        "Olá,",
        "",
        `Segue em anexo o resumo dos indicadores econômicos de ${mes}.`,
        `Planilha no Google Drive: ${relatorio.planilha_url}`,
        "",
        "Material informativo; não constitui recomendação de investimento.",
      ].join("\n"),
      anexo: { nome: nomeArquivo(relatorio), tipo: MIME_XLSX, conteudo: new Uint8Array(xlsx) },
    });
  });
  if (!rascunho.ok) return rascunho;
  const { error } = await db.from("relatorios").update({ rascunho_gmail_id: rascunho.dados }).eq("id", relatorio.id);
  return error ? { ok: false, motivo: "banco" } : rascunho;
}
