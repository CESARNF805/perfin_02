import type { Metadata } from "next";
import { TelaPainel } from "@/components/painel/TelaPainel";
import { dadosDoPeriodo } from "@/lib/dados-pagina";
import { painelComparador } from "@/services/painel/comparador";
import type { ParametrosBusca } from "@/services/periodo";

export const metadata: Metadata = { title: "Comparador R$ 100" };

export default async function PaginaComparador({ searchParams }: { searchParams: Promise<ParametrosBusca> }) {
  const { periodo, dados } = await dadosDoPeriodo(searchParams);
  return (
    <TelaPainel
      titulo="Quanto rendeu R$ 100"
      descricao="CDI, IPCA, IGP-M, dólar e euro — nominal e real"
      periodo={periodo}
      painel={painelComparador(dados, periodo)}
    />
  );
}
