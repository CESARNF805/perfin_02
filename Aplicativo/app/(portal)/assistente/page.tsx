import type { Metadata } from "next";
import { ChatAssistente } from "@/components/assistente/ChatAssistente";
import { FiltroPeriodo } from "@/components/painel/FiltroPeriodo";
import { exigirUsuario } from "@/lib/auth/sessao";
import { formatarMes } from "@/lib/formatacao";
import { AVISO_ASSISTENTE, PERGUNTAS_SUGERIDAS } from "@/services/assistente";
import { resolverPeriodo, type ParametrosBusca } from "@/services/periodo";

export const metadata: Metadata = { title: "Assistente" };

export default async function PaginaAssistente({ searchParams }: { searchParams: Promise<ParametrosBusca> }) {
  await exigirUsuario();
  const periodo = resolverPeriodo(await searchParams);
  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1>Assistente</h1>
          <p className="texto-apoio">
            Respostas com base nos indicadores de {formatarMes(periodo.inicio)} a {formatarMes(periodo.fim)}.
          </p>
        </div>
        <FiltroPeriodo periodo={periodo} />
      </div>
      <p className="texto-legal" role="note">{AVISO_ASSISTENTE}</p>
      <ChatAssistente key={`${periodo.inicio}-${periodo.fim}`} periodo={periodo} sugestoes={PERGUNTAS_SUGERIDAS} />
    </>
  );
}
