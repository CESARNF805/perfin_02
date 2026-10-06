"use client";

export default function Erro({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="secao" role="alert">
      <h1>Conteúdo indisponível</h1>
      <p className="texto apoio">Não foi possível carregar esta página agora.</p>
      <button type="button" onClick={reset}>
        Tentar de novo
      </button>
    </section>
  );
}
