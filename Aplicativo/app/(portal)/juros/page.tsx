import type { Metadata } from "next";
import { TelaPainel } from "@/components/painel/TelaPainel";
import { dadosDoPeriodo } from "@/lib/dados-pagina";
import { painelJuros } from "@/services/painel/juros";
import type { ParametrosBusca } from "@/services/periodo";

export const metadata: Metadata = { title: "Juros" };

export default async function PaginaJuros({ searchParams }: { searchParams: Promise<ParametrosBusca> }) {
  const { periodo, dados } = await dadosDoPeriodo(searchParams);
  return (
    <TelaPainel titulo="Juros" descricao="Selic, CDI e juro real" periodo={periodo} painel={painelJuros(dados, periodo)} />
  );
}
