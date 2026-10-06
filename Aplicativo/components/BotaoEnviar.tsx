"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

interface Props {
  children: ReactNode;
  rotuloEnviando?: string;
  variante?: "primario" | "secundario";
  nome?: string;
  valor?: string;
}

/** Botão de formulário que se desativa enquanto a ação do servidor roda. */
export function BotaoEnviar({ children, rotuloEnviando = "Aguarde…", variante = "primario", nome, valor }: Props) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name={nome} value={valor} className={variante === "primario" ? "botao" : "botao botao--secundario"} disabled={pending} aria-busy={pending}>
      {pending ? rotuloEnviando : children}
    </button>
  );
}
