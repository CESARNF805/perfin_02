import type { Metadata } from "next";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { FormNovoIndicador } from "@/components/admin/FormNovoIndicador";
import { Mensagem } from "@/components/admin/Mensagem";
import { TabelaIndicadores } from "@/components/admin/TabelaIndicadores";
import { clienteSupabase } from "@/lib/supabase/servidor";
import { carregarCatalogo } from "@/services/indicadores";
import { coletarAgora } from "../actions";

export const metadata: Metadata = { title: "Indicadores" };

export default async function PaginaIndicadores({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const [catalogo, params] = await Promise.all([carregarCatalogo(await clienteSupabase()), searchParams]);
  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1>Indicadores</h1>
          <p className="texto-apoio">Séries coletadas do Banco Central (SGS) todo dia útil pelo GitHub Actions.</p>
        </div>
        <form action={coletarAgora}>
          <BotaoEnviar rotuloEnviando="Disparando…">Coletar agora</BotaoEnviar>
        </form>
      </div>
      <Mensagem {...params} />
      <section className="cartao" style={{ marginBottom: 24 }}>
        <TabelaIndicadores catalogo={catalogo} />
      </section>
      <section className="cartao" aria-labelledby="titulo-novo">
        <h2 id="titulo-novo">Nova série do SGS</h2>
        <p className="texto-apoio">Consulte o código no SGS do Banco Central. A série aparece nos dados após a próxima coleta.</p>
        <FormNovoIndicador />
      </section>
    </>
  );
}
