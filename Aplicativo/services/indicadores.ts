/** Leitura de indicadores, expectativas e metas no Supabase (respeitando o RLS do cliente recebido). */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DadosIndicadores, ExpectativaFocus, Indicador, MetaInflacao, Mes, Ponto } from "@/types/indicadores";
import { anoDe, listarMeses, somarMeses } from "./calculos/meses";

const TAMANHO_PAGINA = 1000;
/** Meses extras antes do período, para calcular acumulados de 12 meses e variações. */
export const MESES_HISTORICO = 13;

export class ErroDados extends Error {
  constructor(contexto: string) {
    super(`Não foi possível carregar ${contexto}.`);
  }
}

interface Janela {
  desde: Mes;
  ate: Mes;
}

async function paginar<T>(consulta: (de: number, ate: number) => PromiseLike<{ data: T[] | null; error: unknown }>, contexto: string) {
  const linhas: T[] = [];
  for (let de = 0; ; de += TAMANHO_PAGINA) {
    const { data, error } = await consulta(de, de + TAMANHO_PAGINA - 1);
    if (error) throw new ErroDados(contexto);
    linhas.push(...(data ?? []));
    if (!data || data.length < TAMANHO_PAGINA) return linhas;
  }
}

export async function carregarCatalogo(db: SupabaseClient): Promise<Indicador[]> {
  const { data, error } = await db.from("indicadores").select("*").order("ordem");
  if (error) throw new ErroDados("o catálogo de indicadores");
  return (data ?? []) as Indicador[];
}

async function carregarValores(db: SupabaseClient, indicadorId: string, janela: Janela): Promise<Ponto[]> {
  const linhas = await paginar<{ data: string; valor: number | string }>(
    (de, ate) =>
      db
        .from("indicador_valores")
        .select("data, valor")
        .eq("indicador_id", indicadorId)
        .gte("data", `${janela.desde}-01`)
        .lt("data", `${somarMeses(janela.ate, 1)}-01`)
        .order("data")
        .range(de, ate),
    `os valores de ${indicadorId}`,
  );
  return linhas.map((l) => ({ data: l.data, valor: Number(l.valor) }));
}

type LinhaFocus = Omit<ExpectativaFocus, "mediana"> & { mediana: number | string | null };

/** Pesquisas Focus com data em [desde, antes) — nunca posteriores ao período analisado. */
async function consultarFocus(db: SupabaseClient, tipo: string, desde: string, antes: string, referencias?: string[]) {
  return paginar<LinhaFocus>((de, ate) => {
    let consulta = db
      .from("expectativas_focus")
      .select("indicador, tipo, referencia, data, mediana")
      .eq("tipo", tipo)
      .gte("data", desde)
      .lt("data", antes);
    if (referencias) consulta = consulta.in("referencia", referencias);
    return consulta.order("data").range(de, ate);
  }, "as expectativas Focus");
}

async function carregarFocus(db: SupabaseClient, janela: Janela): Promise<ExpectativaFocus[]> {
  const ano = anoDe(janela.ate);
  const inicio = `${janela.desde}-01`;
  // Ano anterior incluído: em jan/fev o último IPCA divulgado ainda é de dezembro.
  const inicioAnoAnterior = `${ano - 1}-01-01`;
  const desdeAnual = inicio < inicioAnoAnterior ? inicio : inicioAnoAnterior;
  const antes = `${somarMeses(janela.ate, 1)}-01`;
  // Expectativa mensal: meses do período (mais 1 de folga) para o gráfico de surpresas.
  const mesesMensal = listarMeses(somarMeses(janela.desde, MESES_HISTORICO - 1), janela.ate);
  const partes = await Promise.all([
    consultarFocus(db, "anual", desdeAnual, antes, [String(ano - 1), String(ano), String(ano + 1)]),
    consultarFocus(db, "12m", inicio, antes),
    consultarFocus(db, "mensal", `${somarMeses(mesesMensal[0] ?? janela.ate, -2)}-01`, antes, mesesMensal),
    consultarFocus(db, "copom", `${somarMeses(janela.ate, -1)}-01`, antes),
  ]);
  return partes.flat().map((l) => ({ ...l, mediana: l.mediana === null ? null : Number(l.mediana) }));
}

export async function carregarMetas(db: SupabaseClient): Promise<MetaInflacao[]> {
  const { data, error } = await db.from("metas_inflacao").select("ano, centro, tolerancia").order("ano");
  if (error) throw new ErroDados("as metas de inflação");
  return (data ?? []).map((m) => ({ ano: m.ano, centro: Number(m.centro), tolerancia: Number(m.tolerancia) }));
}

/** Carrega tudo o que os painéis precisam entre `desde` e `ate` (já com o histórico extra). */
export async function carregarDados(db: SupabaseClient, inicio: Mes, fim: Mes): Promise<DadosIndicadores> {
  const janela: Janela = { desde: somarMeses(inicio, -MESES_HISTORICO), ate: fim };
  const catalogo = (await carregarCatalogo(db)).filter((i) => i.ativo);
  const [listas, focus, metas] = await Promise.all([
    Promise.all(catalogo.map((i) => carregarValores(db, i.id, janela))),
    carregarFocus(db, janela),
    carregarMetas(db),
  ]);
  const valores = Object.fromEntries(catalogo.map((i, indice) => [i.id, listas[indice] ?? []]));
  return { catalogo, valores, focus, metas };
}
