import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Acesso não autorizado" };

const TEXTOS: Record<string, string> = {
  bloqueado: "Seu acesso foi bloqueado por um administrador.",
  admin: "Esta área é exclusiva do administrador, com login por senha e verificação em duas etapas.",
};

export default async function PaginaAcessoNegado({ searchParams }: { searchParams: Promise<{ motivo?: string }> }) {
  const { motivo } = await searchParams;
  return (
    <main className="tela-entrada">
      <section className="tela-entrada__caixa" aria-labelledby="titulo-negado">
        <p className="marca">Perfin</p>
        <h1 id="titulo-negado">Acesso não autorizado</h1>
        <p className="texto-apoio">
          {(motivo && TEXTOS[motivo]) ?? "O Portal Perfin é exclusivo para contas Google da Perfin autorizadas."}
        </p>
        <p>
          <Link href="/login">Voltar para o login</Link>
        </p>
      </section>
    </main>
  );
}
