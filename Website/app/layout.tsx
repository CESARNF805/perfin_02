import type { Metadata } from "next";
import { Nunito_Sans, Poppins } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import { DISCLAIMER } from "@/lib/textos";
import "./globals.css";

const titulo = Poppins({ subsets: ["latin"], weight: ["400", "700"], variable: "--fonte-titulo", display: "swap" });
const corpo = Nunito_Sans({ subsets: ["latin"], weight: ["400", "500"], variable: "--fonte-corpo", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Perfin", template: "%s · Perfin" },
  description: "Perfin — gestora de investimentos. Indicadores econômicos e carta mensal.",
};

export default function LayoutSite({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${titulo.variable} ${corpo.variable}`}>
      <body>
        <header className="cabecalho">
          <Link href="/" className="cabecalho__marca">Perfin</Link>
          <nav aria-label="Navegação principal">
            <ul className="cabecalho__menu">
              <li><Link href="/indicadores">Indicadores</Link></li>
              <li><Link href="/carta-mensal">Carta mensal</Link></li>
            </ul>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="rodape">
          <p>© {new Date().getFullYear()} Perfin. Todos os direitos reservados.</p>
        </footer>
        <p className="disclaimer">{DISCLAIMER}</p>
      </body>
    </html>
  );
}
