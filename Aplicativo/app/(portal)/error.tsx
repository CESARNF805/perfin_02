"use client";

/** Erro inesperado numa tela do portal: mensagem genérica, sem detalhes internos. */
export default function ErroPortal({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="cartao" role="alert">
      <h1>Não foi possível carregar esta tela</h1>
      <p className="texto-apoio">Tente novamente em instantes. Se o problema continuar, avise o administrador.</p>
      <button type="button" className="botao" onClick={reset}>
        Tentar de novo
      </button>
    </section>
  );
}
