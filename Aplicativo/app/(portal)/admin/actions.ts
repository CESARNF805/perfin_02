"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/auth/sessao";
import { dispararColeta } from "@/lib/github";
import type { CodigoMensagem, Resultado } from "@/lib/mensagens-admin";
import { clienteSupabase } from "@/lib/supabase/servidor";
import { alternarIndicador, criarIndicador, definirBloqueio, salvarMeta } from "@/services/admin";
import { criarCarta, editarCarta, rascunhoComIa } from "@/services/cartas";
import { atualizarPainelPublico, salvarSelecao } from "@/services/site";

/** Volta para a tela com o CÓDIGO da mensagem (o texto é fixo, em lib/mensagens-admin.ts). */
function voltar(caminho: string, resultado: Resultado, sucesso: CodigoMensagem): never {
  revalidatePath(caminho);
  const params = new URLSearchParams(resultado.ok ? { ok: sucesso } : { erro: resultado.erro });
  redirect(`${caminho}?${params}`);
}

export async function alterarBloqueio(formulario: FormData) {
  await exigirAdmin();
  const resultado = await definirBloqueio(await clienteSupabase(), {
    userId: formulario.get("userId"),
    bloquear: formulario.get("bloquear"),
  });
  voltar("/admin/usuarios", resultado, "acesso_atualizado");
}

export async function novoIndicador(formulario: FormData) {
  await exigirAdmin();
  const resultado = await criarIndicador(await clienteSupabase(), Object.fromEntries(formulario));
  voltar("/admin/indicadores", resultado, "indicador_cadastrado");
}

export async function alterarIndicador(formulario: FormData) {
  await exigirAdmin();
  const resultado = await alternarIndicador(await clienteSupabase(), { id: formulario.get("id"), ativo: formulario.get("ativo") });
  voltar("/admin/indicadores", resultado, "indicador_atualizado");
}

export async function coletarAgora() {
  await exigirAdmin();
  voltar("/admin/indicadores", await dispararColeta(), "coleta_disparada");
}

export async function gravarMeta(formulario: FormData) {
  await exigirAdmin();
  const resultado = await salvarMeta(await clienteSupabase(), Object.fromEntries(formulario));
  voltar("/admin/metas", resultado, "meta_salva");
}

export async function gravarSelecaoPublica(formulario: FormData) {
  await exigirAdmin();
  const ids = formulario.getAll("indicador_id").map(String);
  const selecao = ids.map((id) => ({
    indicador_id: id,
    visivel: formulario.get(`visivel_${id}`) === "on",
    ordem: Number(formulario.get(`ordem_${id}`) ?? 100),
    grafico: formulario.get(`grafico_${id}`) === "barra" ? "barra" : "linha",
  }));
  voltar("/admin/publicacao", await salvarSelecao(await clienteSupabase(), selecao), "painel_publicado");
}

export async function republicarPainel() {
  await exigirAdmin();
  voltar("/admin/publicacao", await atualizarPainelPublico(), "painel_publicado");
}

export async function gravarCarta(formulario: FormData) {
  const sessao = await exigirAdmin();
  const db = await clienteSupabase();
  const conteudo = { titulo: formulario.get("titulo"), corpo: formulario.get("corpo"), status: formulario.get("status") };
  const id = formulario.get("id");
  const resultado = id
    ? await editarCarta(db, sessao.userId, { ...conteudo, id })
    : await criarCarta(db, sessao.userId, { ...conteudo, mes: formulario.get("mes") });
  voltar("/admin/publicacao", resultado, conteudo.status === "publicada" ? "carta_publicada" : "carta_rascunho");
}

export async function rascunhoCartaIa(formulario: FormData) {
  const sessao = await exigirAdmin();
  const resultado = await rascunhoComIa(await clienteSupabase(), sessao.userId, formulario.get("mes"));
  voltar("/admin/publicacao", resultado, "carta_ia");
}
