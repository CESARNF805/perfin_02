"use client";

import { useActionState } from "react";
import { verificarMfa, type EstadoFormulario } from "@/app/(auth)/admin/actions";
import { BotaoEnviar } from "@/components/BotaoEnviar";

export function FormCodigoMfa({ factorId }: { factorId: string }) {
  const [estado, acao] = useActionState<EstadoFormulario, FormData>(verificarMfa, {});
  return (
    <form action={acao} className="formulario">
      <input type="hidden" name="factorId" value={factorId} />
      <label htmlFor="codigo">Código</label>
      <input id="codigo" name="codigo" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required />
      {estado.erro && <p className="alerta" role="alert">{estado.erro}</p>}
      <BotaoEnviar rotuloEnviando="Verificando…">Verificar</BotaoEnviar>
    </form>
  );
}
