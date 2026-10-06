import type { Metadata } from "next";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { EditorCarta } from "@/components/admin/EditorCarta";
import { ListaCartas } from "@/components/admin/ListaCartas";
import { Mensagem } from "@/components/admin/Mensagem";
import { TabelaSelecaoPublica } from "@/components/admin/TabelaSelecaoPublica";
import { clienteSupabase } from "@/lib/supabase/servidor";
import { mesAtual, somarMeses } from "@/services/calculos/meses";
import { listarCartas } from "@/services/cartas";
import { carregarCatalogo } from "@/services/indicadores";
import { listarSelecao } from "@/services/site";
import { rascunhoCartaIa, republicarPainel } from "../actions";

export const metadata: Metadata = { title: "Publicação no site" };

export default async function PaginaPublicacao({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const db = await clienteSupabase();
  const [catalogo, selecao, cartas, params] = await Promise.all([carregarCatalogo(db), listarSelecao(db), listarCartas(db), searchParams]);
  const mesSugerido = somarMeses(mesAtual(), -1);

  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1>Publicação no site</h1>
          <p className="texto-apoio">O que aparece no painel público e na carta mensal do site institucional.</p>
        </div>
        <form action={republicarPainel}>
          <BotaoEnviar variante="secundario" rotuloEnviando="Recalculando…">Recalcular painel público</BotaoEnviar>
        </form>
      </div>
      <Mensagem {...params} />
      <section className="cartao" aria-labelledby="titulo-painel" style={{ marginBottom: 24 }}>
        <h2 id="titulo-painel">Indicadores públicos</h2>
        <TabelaSelecaoPublica catalogo={catalogo} selecao={selecao} />
      </section>
      <section className="cartao" aria-labelledby="titulo-carta" style={{ marginBottom: 24 }}>
        <h2 id="titulo-carta">Carta mensal</h2>
        <form action={rascunhoCartaIa} className="acoes-linha" style={{ marginBottom: 16 }}>
          <label htmlFor="mes-ia">Mês</label>
          <input id="mes-ia" name="mes" type="month" defaultValue={mesSugerido} className="campo" style={{ width: "auto" }} required />
          <BotaoEnviar variante="secundario" rotuloEnviando="Gerando com IA…">Gerar rascunho com IA</BotaoEnviar>
        </form>
        <EditorCarta mesPadrao={mesSugerido} />
      </section>
      <section aria-labelledby="titulo-cartas">
        <h2 id="titulo-cartas">Cartas</h2>
        <ListaCartas cartas={cartas} />
      </section>
    </>
  );
}
