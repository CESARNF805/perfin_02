import type { Destaque } from "@/types/visualizacao";
import { formatarValor } from "@/lib/formatacao";

export function Destaques({ itens }: { itens: Destaque[] }) {
  if (itens.length === 0) return null;
  return (
    <ul className="grade-destaques" style={{ listStyle: "none", padding: 0 }}>
      {itens.map((d) => (
        <li key={d.id} className={`destaque${d.tom && d.tom !== "neutro" ? ` destaque--${d.tom}` : ""}`}>
          <span className="destaque__rotulo">{d.rotulo}</span>
          <span className="destaque__valor">{formatarValor(d.valor, d.formato)}</span>
          {d.detalhe && <span className="destaque__detalhe">{d.detalhe}</span>}
        </li>
      ))}
    </ul>
  );
}
