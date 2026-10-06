import Link from "next/link";
import { Suspense } from "react";
import { ProximasReunioes } from "@/components/google/ProximasReunioes";
import { Destaques } from "@/components/painel/Destaques";
import { ListaInsights } from "@/components/painel/ListaInsights";
import { exigirUsuario } from "@/lib/auth/sessao";
import { clienteSupabase } from "@/lib/supabase/servidor";
import { mesAtual } from "@/services/calculos/meses";
import { carregarDados } from "@/services/indicadores";
import { gerarInsights } from "@/services/insights";
import { destaquesVisaoGeral, inicioVisaoGeral } from "@/services/painel/visaoGeral";

export default async function PaginaVisaoGeral() {
  const sessao = await exigirUsuario();
  const mes = mesAtual();
  const dados = await carregarDados(await clienteSupabase(), inicioVisaoGeral(mes), mes);
  const insights = gerarInsights(dados, mes);

  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1>Visão geral</h1>
          <p className="texto-apoio">Os números mais recentes e o que mudou.</p>
        </div>
      </div>
      <Destaques itens={destaquesVisaoGeral(dados, mes)} />
      <div className="duas-colunas">
        <section aria-labelledby="titulo-insights">
          <h2 id="titulo-insights">Destaques automáticos</h2>
          <ListaInsights insights={insights} />
          <p>
            <Link href="/assistente">Perguntar ao assistente</Link>
          </p>
        </section>
        <section aria-labelledby="titulo-agenda">
          <h2 id="titulo-agenda">Próximas reuniões</h2>
          <Suspense fallback={<div className="esqueleto" />}>
            <ProximasReunioes userId={sessao.userId} limite={3} />
          </Suspense>
          <p>
            <Link href="/agenda">Ver agenda</Link>
          </p>
        </section>
      </div>
    </>
  );
}
