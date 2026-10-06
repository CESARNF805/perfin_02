import Link from "next/link";
import type { Periodo } from "@/types/indicadores";
import type { Painel } from "@/types/visualizacao";
import { formatarMes } from "@/lib/formatacao";
import { periodoParaParametros } from "@/services/periodo";
import { Destaques } from "./Destaques";
import { FiltroPeriodo } from "./FiltroPeriodo";
import { Grafico } from "./Grafico";
import { TabelaPainel } from "./TabelaPainel";

interface Props {
  titulo: string;
  descricao: string;
  periodo: Periodo;
  painel: Painel;
}

/** Estrutura comum das telas de painel: cabeçalho + filtro, destaques, gráficos e tabela. */
export function TelaPainel({ titulo, descricao, periodo, painel }: Props) {
  const linkAssistente = `/assistente?${new URLSearchParams(periodoParaParametros(periodo))}`;
  const vazio = painel.destaques.length === 0 && painel.graficos.length === 0;
  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1>{titulo}</h1>
          <p className="texto-apoio">
            {descricao} · {formatarMes(periodo.inicio)} a {formatarMes(periodo.fim)}
          </p>
        </div>
        <FiltroPeriodo periodo={periodo} />
      </div>
      {painel.avisos.length > 0 && (
        <ul className="avisos">
          {painel.avisos.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      )}
      {vazio ? (
        <p className="texto-apoio">Sem dados para o período escolhido.</p>
      ) : (
        <>
          <Destaques itens={painel.destaques} />
          <div className="grade-graficos">
            {painel.graficos.map((g) => (
              <Grafico key={g.id} dados={g} />
            ))}
          </div>
          {painel.tabela && <TabelaPainel titulo={painel.tabela.titulo} tabela={painel.tabela} />}
        </>
      )}
      <p style={{ marginTop: 24 }}>
        <Link href={linkAssistente}>Perguntar ao assistente sobre este período</Link>
      </p>
    </>
  );
}
