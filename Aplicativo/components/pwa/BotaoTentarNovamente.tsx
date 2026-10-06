"use client";

/** Recarrega a página inteira (pela rede) para sair da tela offline. */
export function BotaoTentarNovamente() {
  return (
    <button type="button" className="botao" onClick={() => window.location.reload()}>
      Tentar de novo
    </button>
  );
}
