"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { NAV_ADMIN, NAV_INFERIOR, NAV_PRINCIPAL, PARAMETROS_PERIODO, type ItemNavegacao } from "@/lib/navegacao";

function useHref() {
  const busca = useSearchParams();
  return (item: ItemNavegacao) => {
    if (!item.usaPeriodo) return item.href;
    const params = new URLSearchParams();
    for (const chave of PARAMETROS_PERIODO) {
      const valor = busca.get(chave);
      if (valor) params.set(chave, valor);
    }
    const query = params.toString();
    return query ? `${item.href}?${query}` : item.href;
  };
}

function ativo(caminho: string, href: string) {
  return href === "/" ? caminho === "/" : caminho === href || caminho.startsWith(`${href}/`);
}

function ListaLinks({ itens, aoNavegar }: { itens: ItemNavegacao[]; aoNavegar?: () => void }) {
  const caminho = usePathname();
  const href = useHref();
  return (
    <ul className="navegacao__lista">
      {itens.map((item) => (
        <li key={item.href}>
          <Link
            className="navegacao__link"
            href={href(item)}
            aria-current={ativo(caminho, item.href) ? "page" : undefined}
            onClick={aoNavegar}
          >
            {item.rotulo}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function MenuCompleto({ ehAdmin, aoNavegar }: { ehAdmin: boolean; aoNavegar?: () => void }) {
  return (
    <>
      <ListaLinks itens={NAV_PRINCIPAL} aoNavegar={aoNavegar} />
      {ehAdmin && (
        <>
          <p className="navegacao__secao">Administração</p>
          <ListaLinks itens={NAV_ADMIN} aoNavegar={aoNavegar} />
        </>
      )}
    </>
  );
}

/** Menu lateral (desktop) e barra inferior com menu "Mais" (celular). */
export function Navegacao({ ehAdmin }: { ehAdmin: boolean }) {
  const caminho = usePathname();
  const href = useHref();
  const [maisAberto, setMaisAberto] = useState(false);

  return (
    <>
      <nav className="navegacao menu-lateral" aria-label="Navegação principal">
        <MenuCompleto ehAdmin={ehAdmin} />
      </nav>

      {maisAberto && (
        <nav id="menu-mais" className="navegacao menu-mais" aria-label="Todas as telas">
          <MenuCompleto ehAdmin={ehAdmin} aoNavegar={() => setMaisAberto(false)} />
        </nav>
      )}

      <nav className="nav-inferior" aria-label="Atalhos">
        {NAV_INFERIOR.map((item) => (
          <Link key={item.href} href={href(item)} aria-current={!maisAberto && ativo(caminho, item.href) ? "page" : undefined} onClick={() => setMaisAberto(false)}>
            {item.rotulo}
          </Link>
        ))}
        <button type="button" aria-expanded={maisAberto} aria-controls="menu-mais" onClick={() => setMaisAberto((v) => !v)}>
          Mais
        </button>
      </nav>
    </>
  );
}
