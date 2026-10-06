import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { obterSessao } from "@/lib/auth/sessao";
import { entrarComGoogle } from "./actions";

export const metadata: Metadata = { title: "Entrar" };

const MENSAGENS: Record<string, string> = {
  google: "Não foi possível iniciar o login com o Google. Tente novamente.",
  callback: "O login não foi concluído. Tente novamente.",
};

export default async function PaginaLogin({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const sessao = await obterSessao();
  if (sessao?.membro && !(sessao.sessaoSenha && !sessao.ehAdmin)) redirect("/");
  const { erro } = await searchParams;
  const mensagem = erro ? MENSAGENS[erro] : undefined;

  return (
    <main className="tela-entrada">
      <section className="tela-entrada__caixa" aria-labelledby="titulo-login">
        <p className="marca">Perfin</p>
        <h1 id="titulo-login">Portal Perfin</h1>
        <p className="texto-apoio">Central de análise econômica do time. Entre com sua conta Google da Perfin.</p>
        {mensagem && <p className="alerta" role="alert">{mensagem}</p>}
        <form action={entrarComGoogle}>
          <BotaoEnviar rotuloEnviando="Redirecionando…">Entrar com Google</BotaoEnviar>
        </form>
        <p className="texto-legal">
          <Link href="/admin/login">Entrar como administrador</Link>
        </p>
      </section>
    </main>
  );
}
