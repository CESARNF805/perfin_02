import type { Metadata } from "next";
import { Suspense } from "react";
import { ProximasReunioes } from "@/components/google/ProximasReunioes";
import { exigirUsuario } from "@/lib/auth/sessao";

export const metadata: Metadata = { title: "Agenda" };

export default async function PaginaAgenda() {
  const sessao = await exigirUsuario();
  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1>Agenda</h1>
          <p className="texto-apoio">Suas próximas reuniões no Google Agenda (7 dias).</p>
        </div>
      </div>
      <Suspense fallback={<div className="esqueleto" />}>
        <ProximasReunioes userId={sessao.userId} />
      </Suspense>
    </>
  );
}
