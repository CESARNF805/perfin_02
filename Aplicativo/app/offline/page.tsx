import type { Metadata } from "next";
import { BotaoTentarNovamente } from "@/components/pwa/BotaoTentarNovamente";

export const metadata: Metadata = { title: "Sem conexão" };
export const dynamic = "force-static";

export default function PaginaOffline() {
  return (
    <main className="tela-entrada">
      <section className="tela-entrada__caixa" aria-labelledby="titulo-offline">
        <p className="marca">Perfin</p>
        <h1 id="titulo-offline">Você está offline</h1>
        <p className="texto-apoio">
          Os dados do portal não ficam guardados no aparelho. Conecte-se à internet para ver os indicadores.
        </p>
        <BotaoTentarNovamente />
      </section>
    </main>
  );
}
