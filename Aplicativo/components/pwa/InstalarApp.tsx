"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

interface EventoInstalacao extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function jaInstalado(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function iosNaoInstalado(): boolean {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return ios && !jaInstalado();
}

const semInscricao = () => () => {};

/** Botão "Instalar app": convite nativo (Android/desktop) ou instruções (iPhone). */
export function InstalarApp() {
  const [convite, setConvite] = useState<EventoInstalacao | null>(null);
  const [mostrarIos, setMostrarIos] = useState(false);
  const ios = useSyncExternalStore(semInscricao, iosNaoInstalado, () => false);

  useEffect(() => {
    const aoConvidar = (e: Event) => {
      e.preventDefault();
      if (!jaInstalado()) setConvite(e as EventoInstalacao);
    };
    window.addEventListener("beforeinstallprompt", aoConvidar);
    return () => window.removeEventListener("beforeinstallprompt", aoConvidar);
  }, []);

  if (!convite && !ios) return null;

  async function instalar() {
    if (convite) {
      await convite.prompt();
      await convite.userChoice;
      setConvite(null);
      return;
    }
    setMostrarIos((v) => !v);
  }

  return (
    <div className="instalar">
      <button type="button" className="link-botao" onClick={instalar} aria-expanded={convite ? undefined : mostrarIos}>
        Instalar app
      </button>
      {mostrarIos && (
        <p className="texto-legal" role="note">
          No iPhone: toque em <strong>Compartilhar</strong> e depois em <strong>Adicionar à Tela de Início</strong>.
        </p>
      )}
    </div>
  );
}
