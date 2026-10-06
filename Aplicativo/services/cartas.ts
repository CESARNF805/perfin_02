/** Carta mensal do site: listagem, criação, edição, publicação e rascunho gerado por IA. */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Resultado } from "@/lib/mensagens-admin";
import { formatarMes } from "@/lib/formatacao";
import { gerarTexto } from "@/lib/gemini";
import { somarMeses } from "./calculos/meses";
import { falha } from "./admin";
import { montarContexto } from "./assistente";
import { carregarDados } from "./indicadores";
import { gerarInsights } from "./insights";
import { inicioVisaoGeral } from "./painel/visaoGeral";

export interface Carta {
  id: string;
  mes_referencia: string;
  titulo: string;
  corpo: string;
  status: "rascunho" | "publicada";
  publicada_em: string | null;
  atualizado_em: string;
}

const COLUNAS = "id, mes_referencia, titulo, corpo, status, publicada_em, atualizado_em";
const mesSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

export async function listarCartas(db: SupabaseClient): Promise<Carta[]> {
  const { data, error } = await db.from("cartas_mensais").select(COLUNAS).order("mes_referencia", { ascending: false }).limit(24);
  if (error) throw new Error("Não foi possível listar as cartas.");
  return (data ?? []) as Carta[];
}

const conteudoSchema = z.object({
  titulo: z.string().trim().min(3).max(200),
  corpo: z.string().trim().min(20).max(20000),
  status: z.enum(["rascunho", "publicada"]),
});

/** Data de publicação: mantida se já existia; definida ao publicar; limpa ao voltar para rascunho. */
export function dataPublicacao(status: Carta["status"], anterior: string | null, agora: string): string | null {
  if (status === "rascunho") return null;
  return anterior ?? agora;
}

/** Nova carta (um mês só pode ter uma carta: duplicata é recusada, nunca sobrescrita). */
export async function criarCarta(db: SupabaseClient, autor: string, entrada: unknown): Promise<Resultado> {
  const dados = conteudoSchema.extend({ mes: mesSchema }).safeParse(entrada);
  if (!dados.success) return falha("dados_invalidos");
  const agora = new Date().toISOString();
  const { error } = await db.from("cartas_mensais").insert({
    mes_referencia: `${dados.data.mes}-01`, titulo: dados.data.titulo, corpo: dados.data.corpo, status: dados.data.status,
    autor, atualizado_em: agora, publicada_em: dataPublicacao(dados.data.status, null, agora),
  });
  if (error) return falha(error.code === "23505" ? "carta_existente" : "falha_gravacao");
  return { ok: true };
}

/** Edita a carta pelo id (o mês não muda). */
export async function editarCarta(db: SupabaseClient, autor: string, entrada: unknown): Promise<Resultado> {
  const dados = conteudoSchema.extend({ id: z.uuid() }).safeParse(entrada);
  if (!dados.success) return falha("dados_invalidos");
  const { data: atual } = await db.from("cartas_mensais").select("publicada_em").eq("id", dados.data.id).maybeSingle();
  if (!atual) return falha("carta_nao_encontrada");
  const agora = new Date().toISOString();
  const { error } = await db.from("cartas_mensais").update({
    titulo: dados.data.titulo, corpo: dados.data.corpo, status: dados.data.status, autor, atualizado_em: agora,
    publicada_em: dataPublicacao(dados.data.status, atual.publicada_em as string | null, agora),
  }).eq("id", dados.data.id);
  return error ? falha("falha_gravacao") : { ok: true };
}

const INSTRUCAO_CARTA = [
  "Você redige a carta mensal pública de indicadores econômicos da Perfin, uma gestora de investimentos.",
  "Escreva em português do Brasil, tom institucional, sóbrio e objetivo, frases curtas.",
  "Use SOMENTE os números do bloco DADOS. Não invente dados nem projeções próprias.",
  "Não faça recomendação de investimento. 4 a 6 parágrafos, texto corrido, sem títulos, sem markdown.",
].join("\n");

async function textoDaIa(db: SupabaseClient, mes: string): Promise<string> {
  const dados = await carregarDados(db, inicioVisaoGeral(mes), mes);
  const periodo = { preset: "personalizado" as const, inicio: somarMeses(mes, -11), fim: mes };
  const corpo = await gerarTexto({
    sistema: `${INSTRUCAO_CARTA}\n\n${montarContexto(dados, periodo, gerarInsights(dados, mes))}`,
    mensagens: [{ papel: "usuario", texto: `Escreva a carta de ${formatarMes(mes)}.` }],
    maxTokens: 2000,
  });
  if (corpo.trim().length < 20) throw new Error("Resposta vazia da IA.");
  return corpo.trim();
}

/** Rascunho da IA: cria ou atualiza o RASCUNHO do mês; nunca toca numa carta já publicada. */
export async function rascunhoComIa(db: SupabaseClient, autor: string, mesInformado: unknown): Promise<Resultado> {
  const mes = mesSchema.safeParse(mesInformado);
  if (!mes.success) return falha("mes_invalido");
  const { data: existente } = await db.from("cartas_mensais").select("id, status").eq("mes_referencia", `${mes.data}-01`).maybeSingle();
  if (existente?.status === "publicada") return falha("carta_ja_publicada");
  let corpo: string;
  try {
    corpo = await textoDaIa(db, mes.data);
  } catch {
    return falha("ia_indisponivel");
  }
  const conteudo = { titulo: `Carta de indicadores — ${formatarMes(mes.data)}`, corpo, status: "rascunho" as const };
  return existente ? editarCarta(db, autor, { ...conteudo, id: existente.id }) : criarCarta(db, autor, { ...conteudo, mes: mes.data });
}
