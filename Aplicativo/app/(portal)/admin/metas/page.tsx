import type { Metadata } from "next";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { Mensagem } from "@/components/admin/Mensagem";
import { formatarPercentual } from "@/lib/formatacao";
import { clienteSupabase } from "@/lib/supabase/servidor";
import { carregarMetas } from "@/services/indicadores";
import { gravarMeta } from "../actions";

export const metadata: Metadata = { title: "Metas de inflação" };

export default async function PaginaMetas({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const [metas, params] = await Promise.all([carregarMetas(await clienteSupabase()), searchParams]);
  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1>Metas de inflação</h1>
          <p className="texto-apoio">Definidas pelo CMN. Usadas na faixa da meta e nos insights.</p>
        </div>
      </div>
      <Mensagem {...params} />
      <div className="duas-colunas">
        <section className="cartao">
          <table className="tabela">
            <thead>
              <tr>
                <th scope="col">Ano</th>
                <th scope="col" className="numero">Centro</th>
                <th scope="col" className="numero">Tolerância</th>
                <th scope="col" className="numero">Banda</th>
              </tr>
            </thead>
            <tbody>
              {[...metas].reverse().map((m) => (
                <tr key={m.ano}>
                  <td>{m.ano}</td>
                  <td className="numero">{formatarPercentual(m.centro)}</td>
                  <td className="numero">{formatarPercentual(m.tolerancia).replace("%", " p.p.")}</td>
                  <td className="numero">
                    {formatarPercentual(m.centro - m.tolerancia)} a {formatarPercentual(m.centro + m.tolerancia)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="cartao" aria-labelledby="titulo-meta">
          <h2 id="titulo-meta">Cadastrar ou alterar</h2>
          <form action={gravarMeta} className="formulario">
            <label htmlFor="ano">Ano</label>
            <input id="ano" name="ano" type="number" min={1999} max={2100} required />
            <label htmlFor="centro">Centro (%)</label>
            <input id="centro" name="centro" type="number" step="0.01" min={0} max={50} required />
            <label htmlFor="tolerancia">Tolerância (p.p.)</label>
            <input id="tolerancia" name="tolerancia" type="number" step="0.01" min={0} max={20} required />
            <BotaoEnviar rotuloEnviando="Salvando…">Salvar</BotaoEnviar>
          </form>
        </section>
      </div>
    </>
  );
}
