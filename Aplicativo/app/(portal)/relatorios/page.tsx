import type { Metadata } from "next";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { ListaRelatorios } from "@/components/google/ListaRelatorios";
import { ReconectarGoogle } from "@/components/google/ReconectarGoogle";
import { exigirUsuario } from "@/lib/auth/sessao";
import { formatarMes } from "@/lib/formatacao";
import { temConexaoGoogle } from "@/lib/google/tokens";
import { clienteSupabase } from "@/lib/supabase/servidor";
import { listarRelatorios, verificarMesDoRelatorio } from "@/services/relatorios";
import { gerarRelatorio } from "./actions";

export const metadata: Metadata = { title: "Relatórios" };

const MENSAGENS: Record<string, { texto: string; erro: boolean }> = {
  gerado: { texto: "Relatório criado no seu Google Drive.", erro: false },
  rascunho: { texto: "Rascunho criado no seu Gmail. Revise e envie por lá — o portal nunca envia e-mails.", erro: false },
  dados: { texto: "Ainda não há IPCA e IGP-M divulgados para fechar o relatório.", erro: true },
  desconectado: { texto: "Conecte novamente sua conta Google.", erro: true },
  falha: { texto: "O Google não respondeu. Tente novamente.", erro: true },
  banco: { texto: "Não foi possível registrar o relatório.", erro: true },
  invalido: { texto: "Relatório não encontrado.", erro: true },
};

export default async function PaginaRelatorios({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const sessao = await exigirUsuario();
  const db = await clienteSupabase();
  const [referencia, relatorios, conectado, params] = await Promise.all([
    verificarMesDoRelatorio(db),
    listarRelatorios(db),
    temConexaoGoogle(sessao.userId),
    searchParams,
  ]);
  const chave = params.ok ?? params.erro;
  const mensagem = chave ? MENSAGENS[chave] : undefined;

  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1>Relatório do mês</h1>
          <p className="texto-apoio">Planilha Google com o resumo dos indicadores, salva no seu Drive, com download em Excel.</p>
        </div>
      </div>
      {mensagem && <p className={mensagem.erro ? "alerta" : "sucesso"} role="status">{mensagem.texto}</p>}
      <section className="cartao" aria-labelledby="titulo-gerar" style={{ marginBottom: 24 }}>
        <h2 id="titulo-gerar">{referencia.ok ? `Relatório de ${formatarMes(referencia.mes)}` : "Relatório indisponível"}</h2>
        {!conectado ? (
          <ReconectarGoogle motivo="desconectado" />
        ) : referencia.ok ? (
          <form action={gerarRelatorio}>
            <BotaoEnviar rotuloEnviando="Gerando planilha…">Gerar relatório</BotaoEnviar>
          </form>
        ) : (
          <p className="texto-apoio">{referencia.motivo} O IPCA sai por volta do dia 10 do mês seguinte.</p>
        )}
      </section>
      <section aria-labelledby="titulo-historico">
        <h2 id="titulo-historico">Seus relatórios</h2>
        <ListaRelatorios relatorios={relatorios} />
      </section>
    </>
  );
}
