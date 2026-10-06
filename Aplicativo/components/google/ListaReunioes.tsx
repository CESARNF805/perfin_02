import type { Reuniao } from "@/types/google";
import { formatarDiaHora, formatarDiaSemana } from "@/lib/formatacao";

export function ListaReunioes({ reunioes }: { reunioes: Reuniao[] }) {
  if (reunioes.length === 0) return <p className="texto-apoio">Nenhuma reunião nos próximos dias.</p>;
  return (
    <ul className="lista-reunioes">
      {reunioes.map((r) => (
        <li key={r.id} className="reuniao">
          <h3>{r.titulo}</h3>
          <p>
            {r.diaInteiro ? `${formatarDiaSemana(`${r.inicio}T12:00:00`)} · dia inteiro` : formatarDiaHora(r.inicio)}
            {r.local ? ` · ${r.local}` : ""}
          </p>
          <p className="acoes-linha">
            {r.linkReuniao && (
              <a href={r.linkReuniao} target="_blank" rel="noopener noreferrer">
                Entrar na reunião
              </a>
            )}
            {r.linkAgenda && (
              <a href={r.linkAgenda} target="_blank" rel="noopener noreferrer">
                Abrir no Google Agenda
              </a>
            )}
          </p>
        </li>
      ))}
    </ul>
  );
}
