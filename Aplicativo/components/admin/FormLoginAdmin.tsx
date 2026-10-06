"use client";

import { useActionState } from "react";
import { entrarComoAdmin, type EstadoFormulario } from "@/app/(auth)/admin/actions";
import { BotaoEnviar } from "@/components/BotaoEnviar";

export function FormLoginAdmin() {
  const [estado, acao] = useActionState<EstadoFormulario, FormData>(entrarComoAdmin, {});
  return (
    <form action={acao} className="formulario">
      <label htmlFor="email">E-mail</label>
      <input id="email" name="email" type="email" autoComplete="username" required maxLength={200} />
      <label htmlFor="senha">Senha</label>
      <input id="senha" name="senha" type="password" autoComplete="current-password" required minLength={8} maxLength={200} />
      {estado.erro && <p className="alerta" role="alert">{estado.erro}</p>}
      <BotaoEnviar rotuloEnviando="Entrando…">Entrar</BotaoEnviar>
    </form>
  );
}
