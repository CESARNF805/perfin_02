import type { Metadata } from "next";
import Link from "next/link";
import { FormLoginAdmin } from "@/components/admin/FormLoginAdmin";

export const metadata: Metadata = { title: "Administrador" };

export default function PaginaLoginAdmin() {
  return (
    <main className="tela-entrada">
      <section className="tela-entrada__caixa" aria-labelledby="titulo-admin">
        <p className="marca">Perfin</p>
        <h1 id="titulo-admin">Administrador</h1>
        <p className="texto-apoio">Acesso com e-mail e senha, seguido da verificação em duas etapas.</p>
        <FormLoginAdmin />
        <p className="texto-legal">
          <Link href="/login">Entrar com Google</Link>
        </p>
      </section>
    </main>
  );
}
