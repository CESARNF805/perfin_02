"use client";

/** Sai da conta e pede ao service worker para limpar o cache do aparelho. */
export function BotaoSair() {
  function limparCache() {
    navigator.serviceWorker?.controller?.postMessage("limpar-cache");
  }
  return (
    <form action="/sair" method="post" onSubmit={limparCache}>
      <button type="submit" className="link-botao">
        Sair
      </button>
    </form>
  );
}
