import Link from "next/link";

export default function PaginaInicial() {
  return (
    <>
      <section className="secao secao--escura">
        <h1>Construindo com a Perfin</h1>
        <p className="texto apoio">Gestora de investimentos com atuação em infraestrutura, equities e wealth.</p>
      </section>
      <section className="secao secao--ardosia">
        <h2>Indicadores</h2>
        <p className="texto">
          Acompanhe inflação, juros, câmbio e expectativas de mercado com dados do Banco Central, atualizados a cada dia útil.
        </p>
        <p>
          <Link href="/indicadores">Ver indicadores</Link>
        </p>
      </section>
      <section className="secao">
        <h2>Carta mensal</h2>
        <p className="texto">A leitura do time Perfin sobre os principais indicadores do mês.</p>
        <p>
          <Link href="/carta-mensal">Ler as cartas</Link>
        </p>
      </section>
    </>
  );
}
