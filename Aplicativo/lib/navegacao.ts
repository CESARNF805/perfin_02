/** Itens de navegação do portal. */
export interface ItemNavegacao {
  href: string;
  rotulo: string;
  /** Leva o filtro de período junto ao navegar. */
  usaPeriodo?: boolean;
}

export const NAV_PRINCIPAL: ItemNavegacao[] = [
  { href: "/", rotulo: "Visão geral" },
  { href: "/inflacao", rotulo: "Inflação", usaPeriodo: true },
  { href: "/juros", rotulo: "Juros", usaPeriodo: true },
  { href: "/cambio", rotulo: "Câmbio", usaPeriodo: true },
  { href: "/expectativas", rotulo: "Expectativas (Focus)", usaPeriodo: true },
  { href: "/comparador", rotulo: "Comparador R$ 100", usaPeriodo: true },
  { href: "/relatorios", rotulo: "Relatórios" },
  { href: "/agenda", rotulo: "Agenda" },
  { href: "/assistente", rotulo: "Assistente", usaPeriodo: true },
];

export const NAV_ADMIN: ItemNavegacao[] = [
  { href: "/admin/usuarios", rotulo: "Usuários" },
  { href: "/admin/indicadores", rotulo: "Indicadores" },
  { href: "/admin/metas", rotulo: "Metas de inflação" },
  { href: "/admin/publicacao", rotulo: "Publicação no site" },
];

/** Atalhos da barra inferior no celular (o 5º botão abre o menu "Mais"). */
export const NAV_INFERIOR: ItemNavegacao[] = [
  { href: "/", rotulo: "Início" },
  { href: "/inflacao", rotulo: "Painéis", usaPeriodo: true },
  { href: "/assistente", rotulo: "Assistente", usaPeriodo: true },
  { href: "/agenda", rotulo: "Agenda" },
];

export const PARAMETROS_PERIODO = ["periodo", "de", "ate"] as const;
