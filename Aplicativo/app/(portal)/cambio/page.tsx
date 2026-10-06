import type { Metadata } from "next";
import { TelaPainel } from "@/components/painel/TelaPainel";
import { dadosDoPeriodo } from "@/lib/dados-pagina";
import { painelCambio } from "@/services/painel/cambio";
import type { ParametrosBusca } from "@/services/periodo";

export const metadata: Metadata = { title: "Câmbio" };

export default async function PaginaCambio({ searchParams }: { searchParams: Promise<ParametrosBusca> }) {
  const { periodo, dados } = await dadosDoPeriodo(searchParams);
  return (
    <TelaPainel
      titulo="Câmbio"
      descricao="Dólar e euro (PTAX venda), variação e volatilidade"
      periodo={periodo}
      painel={painelCambio(dados, periodo)}
    />
  );
}
