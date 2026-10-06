import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarCarta } from "@/lib/dados";
import { formatarDataExtenso, formatarMesExtenso, paragrafos } from "@/lib/formatacao";

export const revalidate = 600;

type Props = { params: Promise<{ mes: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const carta = await buscarCarta((await params).mes);
  return { title: carta?.titulo ?? "Carta mensal" };
}

export default async function PaginaCarta({ params }: Props) {
  const carta = await buscarCarta((await params).mes);
  if (!carta) notFound();
  return (
    <article className="secao carta">
      <p className="apoio">{formatarMesExtenso(carta.mes_referencia)}</p>
      <h1>{carta.titulo}</h1>
      {paragrafos(carta.corpo).map((p, i) => (
        // Parágrafos de texto estático, sem reordenação: o índice é estável aqui.
        <p key={i}>{p}</p>
      ))}
      {carta.publicada_em && <p className="apoio">Publicada em {formatarDataExtenso(carta.publicada_em)}</p>}
      <p>
        <Link href="/carta-mensal">Todas as cartas</Link>
      </p>
    </article>
  );
}
