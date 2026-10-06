import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { BotaoSair } from "@/components/portal/BotaoSair";
import { Navegacao } from "@/components/portal/Navegacao";
import { InstalarApp } from "@/components/pwa/InstalarApp";
import { exigirUsuario } from "@/lib/auth/sessao";

export default async function LayoutPortal({ children }: { children: ReactNode }) {
  const sessao = await exigirUsuario();
  return (
    <div className="portal">
      <header className="cabecalho">
        <Link href="/" className="cabecalho__marca">
          Portal Perfin
        </Link>
        <div className="cabecalho__acoes">
          <InstalarApp />
          <span className="cabecalho__usuario">
            {sessao.nome ?? sessao.email}
            {sessao.ehAdmin ? " · admin" : ""}
          </span>
          <BotaoSair />
        </div>
      </header>
      <Suspense fallback={<nav className="navegacao menu-lateral" aria-label="Navegação principal" />}>
        <Navegacao ehAdmin={sessao.ehAdmin} />
      </Suspense>
      <main className="conteudo" id="conteudo">
        {children}
      </main>
    </div>
  );
}
