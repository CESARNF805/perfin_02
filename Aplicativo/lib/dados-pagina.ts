import "server-only";
import type { DadosIndicadores, Periodo } from "@/types/indicadores";
import { exigirUsuario } from "@/lib/auth/sessao";
import { clienteSupabase } from "@/lib/supabase/servidor";
import { carregarDados } from "@/services/indicadores";
import { resolverPeriodo, type ParametrosBusca } from "@/services/periodo";

/** Valida o acesso, resolve o filtro de período da URL e carrega os dados (com RLS do usuário). */
export async function dadosDoPeriodo(
  searchParams: Promise<ParametrosBusca>,
): Promise<{ periodo: Periodo; dados: DadosIndicadores }> {
  await exigirUsuario();
  const periodo = resolverPeriodo(await searchParams);
  const dados = await carregarDados(await clienteSupabase(), periodo.inicio, periodo.fim);
  return { periodo, dados };
}
