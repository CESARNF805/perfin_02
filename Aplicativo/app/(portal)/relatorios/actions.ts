"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { exigirUsuario } from "@/lib/auth/sessao";
import { clienteSupabase } from "@/lib/supabase/servidor";
import { buscarRelatorio, criarRascunhoDoRelatorio, gerarRelatorioDoMes } from "@/services/relatorios";

export async function gerarRelatorio(): Promise<void> {
  const sessao = await exigirUsuario();
  const resultado = await gerarRelatorioDoMes(await clienteSupabase(), sessao.userId);
  revalidatePath("/relatorios");
  redirect(resultado.ok ? "/relatorios?ok=gerado" : `/relatorios?erro=${resultado.motivo}`);
}

export async function criarRascunhoGmail(formulario: FormData): Promise<void> {
  const sessao = await exigirUsuario();
  const id = z.uuid().safeParse(formulario.get("id"));
  if (!id.success) redirect("/relatorios?erro=invalido");
  const db = await clienteSupabase();
  const relatorio = await buscarRelatorio(db, id.data);
  if (!relatorio) redirect("/relatorios?erro=invalido");
  const resultado = await criarRascunhoDoRelatorio(db, sessao.userId, relatorio);
  revalidatePath("/relatorios");
  redirect(resultado.ok ? "/relatorios?ok=rascunho" : `/relatorios?erro=${resultado.motivo}`);
}
