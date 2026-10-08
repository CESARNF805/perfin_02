import type { Metadata } from "next";
import Link from "next/link";
import { listarCartas } from "@/lib/dados";
import { formatarDataExtenso, formatarMesExtenso, paragrafos } from "@/lib/formatacao";

export const metadata: Metadata = { title: "Carta mensal" };
export const dynamic = "force-dynamic";

export default async function PaginaCartas() {
  const cartas = await listarCartas();
  return (
    <section className="secao">
      <h1>Carta mensal</h1>
      {cartas.length === 0 ? (
        <p className="texto apoio">Nenhuma carta publicada ainda.</p>
      ) : (
        <ul className="lista-cartas">
          {cartas.map((c) => (
            <li key={c.id}>
              <p className="apoio">{formatarMesExtenso(c.mes_referencia)}</p>
              <h3>
                <Link href={`/carta-mensal/${c.mes_referencia.slice(0, 7)}`}>{c.titulo}</Link>
              </h3>
              <p className="texto">{paragrafos(c.corpo)[0]?.slice(0, 280)}</p>
              {c.publicada_em && <p className="apoio">Publicada em {formatarDataExtenso(c.publicada_em)}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
