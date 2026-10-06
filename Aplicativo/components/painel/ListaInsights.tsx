import type { Insight } from "@/types/visualizacao";

export function ListaInsights({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return <p className="texto-apoio">Nenhum destaque automático para o período.</p>;
  return (
    <ul className="lista-insights">
      {insights.map((i) => (
        <li key={i.id} className={`insight insight--${i.severidade}`}>
          <h3>{i.titulo}</h3>
          <p>{i.texto}</p>
        </li>
      ))}
    </ul>
  );
}
