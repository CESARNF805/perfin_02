"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DadosGrafico, SerieGrafico } from "@/types/visualizacao";
import { formatarNumero, formatarValor } from "@/lib/formatacao";

const CORES: Record<SerieGrafico["cor"], string> = {
  1: "#101B2A", 2: "#415765", 3: "#6D8B9E", 4: "#9FB3BF", 5: "#C9D3D9", 6: "#6D6E71",
  alerta: "#A85A4A", positivo: "#4A7A6B",
};

const EIXO = { fontSize: 12, fill: "#6D6E71" };

/** Gráfico de linhas ou barras a partir de dados já calculados no servidor. */
export function Grafico({ dados }: { dados: DadosGrafico }) {
  const temDados = dados.linhas.some((l) => dados.series.some((s) => typeof l[s.chave] === "number"));
  const formatar = (v: unknown) => (typeof v === "number" ? formatarValor(v, dados.formato) : "—");
  const linhasComFaixa: Record<string, unknown>[] = dados.faixa
    ? dados.linhas.map((l) => {
        const min = l[dados.faixa!.chaveMin];
        const max = l[dados.faixa!.chaveMax];
        return { ...l, __faixa: typeof min === "number" && typeof max === "number" ? [min, max] : null };
      })
    : dados.linhas;

  return (
    <figure className="cartao" style={{ margin: 0 }}>
      <figcaption>
        <h2>{dados.titulo}</h2>
      </figcaption>
      {temDados ? (
        <div className="grafico" role="img" aria-label={`Gráfico: ${dados.titulo}`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={linhasComFaixa} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="#E6E7E8" />
              <XAxis dataKey="x" tick={EIXO} tickLine={false} axisLine={{ stroke: "#E6E7E8" }} minTickGap={24} />
              <YAxis tick={EIXO} tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => formatarNumero(v, dados.formato === "brl" ? 2 : 1)} domain={["auto", "auto"]} />
              <Tooltip formatter={(v) => formatar(v)} contentStyle={{ borderRadius: 0, border: "1px solid #E6E7E8" }} />
              <Legend verticalAlign="top" align="left" iconType="plainline" wrapperStyle={{ fontSize: 12, color: "#6D6E71", paddingBottom: 8 }} />
              {dados.formato !== "brl" && dados.formato !== "indice" && <ReferenceLine y={0} stroke="#6D6E71" strokeWidth={1} />}
              {dados.faixa && (
                <Area dataKey="__faixa" name={dados.faixa.nome} fill="#C9D3D9" fillOpacity={0.4} stroke="none" isAnimationActive={false} />
              )}
              {dados.series.map((s) =>
                dados.tipo === "barra" ? (
                  <Bar key={s.chave} dataKey={s.chave} name={s.nome} fill={CORES[s.cor]} isAnimationActive={false} />
                ) : (
                  <Line key={s.chave} dataKey={s.chave} name={s.nome} stroke={CORES[s.cor]} strokeWidth={s.cor === 6 ? 1 : 2}
                    strokeDasharray={s.cor === 6 ? "4 4" : undefined} dot={false} connectNulls={false} isAnimationActive={false} />
                ),
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="texto-apoio">Sem dados para o período.</p>
      )}
      {dados.nota && <p className="grafico__nota">{dados.nota}</p>}
    </figure>
  );
}
