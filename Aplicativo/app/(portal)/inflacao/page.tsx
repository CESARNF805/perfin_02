import type { Metadata } from "next";
import { TelaPainel } from "@/components/painel/TelaPainel";
import { dadosDoPeriodo } from "@/lib/dados-pagina";
import { painelInflacao } from "@/services/painel/inflacao";
import type { ParametrosBusca } from "@/services/periodo";

export const metadata: Metadata = { title: "Inflação" };

export default async function PaginaInflacao({ searchParams }: { searchParams: Promise<ParametrosBusca> }) {
  const { periodo, dados } = await dadosDoPeriodo(searchParams);
  return (
    <TelaPainel
      titulo="Inflação"
      descricao="IPCA, INPC e IGP-M, meta e spread"
      periodo={periodo}
      painel={painelInflacao(dados, periodo)}
    />
  );
}
