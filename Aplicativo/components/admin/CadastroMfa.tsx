"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { iniciarCadastroMfa, type EstadoCadastroMfa } from "@/app/(auth)/admin/actions";
import { FormCodigoMfa } from "./FormCodigoMfa";

export function CadastroMfa() {
  const [estado, setEstado] = useState<EstadoCadastroMfa>({});
  const [pendente, iniciar] = useTransition();

  if (estado.factorId && estado.qrCode) {
    return (
      <>
        <p className="texto-apoio">
          Escaneie o QR code no seu aplicativo autenticador (Google Authenticator, Microsoft Authenticator…) e digite o
          código gerado.
        </p>
        <Image src={estado.qrCode} alt="QR code para cadastrar o autenticador" width={200} height={200} unoptimized />
        <p className="texto-legal">
          Não consegue escanear? Use a chave: <code>{estado.segredo}</code>
        </p>
        <FormCodigoMfa factorId={estado.factorId} />
      </>
    );
  }

  return (
    <>
      <p className="texto-apoio">Primeiro acesso: cadastre um aplicativo autenticador para proteger a área de admin.</p>
      {estado.erro && <p className="alerta" role="alert">{estado.erro}</p>}
      <button type="button" className="botao" disabled={pendente} onClick={() => iniciar(async () => setEstado(await iniciarCadastroMfa()))}>
        {pendente ? "Gerando…" : "Gerar QR code"}
      </button>
    </>
  );
}
