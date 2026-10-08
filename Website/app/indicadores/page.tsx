import type { Metadata } from "next";
import { GraficoPublico } from "@/components/GraficoPublico";
import { buscarPainelPublico } from "@/lib/dados";
import { formatarDataExtenso, formatarValor } from "@/lib/formatacao";

export const metadata: Metadata = { title: "Indicadores" };
/** Gerada a cada acesso: o build não depende do banco e o conteúdo varia conforme quem está logado. */
export const dynamic = "force-dynamic";

export default async function PaginaIndicadores() {
  const painel = await buscarPainelPublico();
  return (
    <section className="secao">
      <h1>Indicadores</h1>
      {!painel || painel.indicadores.length === 0 ? (
        <p className="texto apoio">Os indicadores ainda não foram publicados. Volte em breve.</p>
      ) : (
        <>
          <p className="apoio">
            Atualizado em {formatarDataExtenso(painel.atualizadoEm)} · Fonte: Banco Central do Brasil
          </p>
          <div className="grade">
            {painel.indicadores.map((i) => (
              <article key={i.id} className="indicador">
                <h3>{i.destaque.rotulo}</h3>
                <p className="indicador__valor">{formatarValor(i.destaque.valor, i.formato)}</p>
                <p className="apoio">{i.destaque.detalhe}</p>
                <GraficoPublico indicador={i} />
                <p className="apoio">{i.rotuloSerie}</p>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
