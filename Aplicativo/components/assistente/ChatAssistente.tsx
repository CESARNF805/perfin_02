"use client";

import { useRef, useState } from "react";
import type { Periodo } from "@/types/indicadores";

interface Mensagem {
  id: number;
  papel: "usuario" | "assistente";
  texto: string;
}

const MAX_HISTORICO = 10;

interface Props {
  periodo: Periodo;
  sugestoes: string[];
}

/** Chat do assistente: envia a pergunta e o período filtrado; a resposta chega em streaming. */
export function ChatAssistente({ periodo, sugestoes }: Props) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [pergunta, setPergunta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const proximoId = useRef(1);

  async function enviar(texto: string) {
    const limpa = texto.trim();
    if (!limpa || enviando) return;
    const historico = mensagens.slice(-MAX_HISTORICO).map(({ papel, texto: t }) => ({ papel, texto: t }));
    const idResposta = proximoId.current + 1;
    proximoId.current += 2;
    setMensagens((m) => [...m, { id: idResposta - 1, papel: "usuario", texto: limpa }, { id: idResposta, papel: "assistente", texto: "" }]);
    setPergunta("");
    setEnviando(true);
    const acrescentar = (parte: string) =>
      setMensagens((m) => m.map((msg) => (msg.id === idResposta ? { ...msg, texto: msg.texto + parte } : msg)));
    try {
      const resposta = await fetch("/api/assistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: limpa, periodo, historico }),
      });
      if (!resposta.ok || !resposta.body) throw new Error();
      const leitor = resposta.body.getReader();
      const decodificador = new TextDecoder();
      for (;;) {
        const { done, value } = await leitor.read();
        if (done) break;
        acrescentar(decodificador.decode(value, { stream: true }));
      }
    } catch {
      acrescentar("Não foi possível obter a resposta. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="chat">
      <div className="chat__mensagens" aria-live="polite">
        {mensagens.length === 0 && <p className="texto-apoio">Faça uma pergunta sobre os indicadores do período selecionado.</p>}
        {mensagens.map((m) => (
          <div key={m.id} className={`chat__mensagem chat__mensagem--${m.papel}`}>
            <span className="visualmente-oculto">{m.papel === "usuario" ? "Você:" : "Assistente:"}</span>
            {m.texto || (enviando ? "…" : "")}
          </div>
        ))}
      </div>
      <div className="chat__sugestoes">
        {sugestoes.map((s) => (
          <button key={s} type="button" className="botao botao--secundario" disabled={enviando} onClick={() => enviar(s)}>
            {s}
          </button>
        ))}
      </div>
      <form className="chat__form" onSubmit={(e) => { e.preventDefault(); enviar(pergunta); }}>
        <label htmlFor="pergunta" className="visualmente-oculto">Sua pergunta</label>
        <input id="pergunta" className="campo" value={pergunta} onChange={(e) => setPergunta(e.target.value)} maxLength={1000} placeholder="Pergunte sobre os indicadores…" autoComplete="off" />
        <button type="submit" className="botao" disabled={enviando || pergunta.trim().length < 2}>
          {enviando ? "Respondendo…" : "Enviar"}
        </button>
      </form>
    </div>
  );
}
