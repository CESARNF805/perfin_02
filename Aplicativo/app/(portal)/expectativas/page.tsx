import type { Metadata } from "next";
import { TelaPainel } from "@/components/painel/TelaPainel";
import { dadosDoPeriodo } from "@/lib/dados-pagina";
import { painelExpectativas } from "@/services/painel/expectativas";
import type { ParametrosBusca } from "@/services/periodo";

export const metadata: Metadata = { title: "Expectativas (Focus)" };

export default async function PaginaExpectativas({ searchParams }: { searchParams: Promise<ParametrosBusca> }) {
  const { periodo, dados } = await dadosDoPeriodo(searchParams);
  return (
    <TelaPainel
      titulo="Expectativas (Focus)"
      descricao="Medianas do Boletim Focus, revisões e surpresas"
      periodo={periodo}
      painel={painelExpectativas(dados, periodo)}
    />
  );
}
