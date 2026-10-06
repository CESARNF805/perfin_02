"use client";

import { useEffect, useState } from "react";

/** Registra o service worker e avisa quando há nova versão. */
export function RegistrarServiceWorker() {
  const [novaVersao, setNovaVersao] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let ativo = true;
    // Só recarrega na troca de versão; na 1ª instalação (sem controller anterior) não há o que atualizar.
    const tinhaController = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((registro) => {
      const verificar = (sw: ServiceWorker | null) => {
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          if (ativo && sw.state === "installed" && navigator.serviceWorker.controller) setNovaVersao(sw);
        });
      };
      if (registro.waiting && navigator.serviceWorker.controller) setNovaVersao(registro.waiting);
      registro.addEventListener("updatefound", () => verificar(registro.installing));
    });
    let recarregou = false;
    const aoTrocar = () => {
      if (recarregou || !tinhaController) return;
      recarregou = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", aoTrocar);
    return () => {
      ativo = false;
      navigator.serviceWorker.removeEventListener("controllerchange", aoTrocar);
    };
  }, []);

  if (!novaVersao) return null;
  return (
    <div className="aviso-atualizacao" role="status">
      <span>Nova versão disponível.</span>
      <button type="button" className="botao" onClick={() => novaVersao.postMessage("atualizar")}>
        Atualizar
      </button>
    </div>
  );
}
