import { formatarDataHora, formatarMes } from "@/lib/formatacao";
import type { Carta } from "@/services/cartas";
import { EditorCarta } from "./EditorCarta";

export function ListaCartas({ cartas }: { cartas: Carta[] }) {
  if (cartas.length === 0) return <p className="texto-apoio">Nenhuma carta ainda.</p>;
  return (
    <ul className="lista-simples">
      {cartas.map((c) => (
        <li key={c.id}>
          <h3>
            {formatarMes(c.mes_referencia.slice(0, 7))} · {c.titulo}
          </h3>
          <p className="texto-legal">
            {c.status === "publicada" && c.publicada_em ? `Publicada em ${formatarDataHora(c.publicada_em)}` : "Rascunho"} · atualizada
            em {formatarDataHora(c.atualizado_em)}
          </p>
          <EditorCarta carta={c} mesPadrao={c.mes_referencia.slice(0, 7)} />
        </li>
      ))}
    </ul>
  );
}
