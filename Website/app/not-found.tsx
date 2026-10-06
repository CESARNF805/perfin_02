import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <section className="secao">
      <h1>Página não encontrada</h1>
      <p>
        <Link href="/">Voltar ao início</Link>
      </p>
    </section>
  );
}
